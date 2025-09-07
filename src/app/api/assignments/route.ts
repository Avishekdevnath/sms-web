import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Assignment } from "@/models/Assignment";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";
import { AssignmentCreateSchema, AssignmentQuerySchema } from "@/schemas/assignment";
import { handleApiError, createErrorResponse } from "@/utils/apiHelpers";
import { Types } from "mongoose";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const skip = (page - 1) * limit;
    const search = searchParams.get("search") || "";
    const courseOfferingId = searchParams.get("courseOfferingId");
    const courseId = searchParams.get("courseId");
    const batchId = searchParams.get("batchId");
    const semesterId = searchParams.get("semesterId");
    const published = searchParams.get("published");
    const dueBefore = searchParams.get("dueBefore");
    const dueAfter = searchParams.get("dueAfter");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    
    // Build filter
    let filter: any = {};
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (courseOfferingId) {
      filter.courseOfferingId = courseOfferingId;
    }
    
    // Build course offering filter for nested properties
    let courseOfferingFilter: any = {};
    if (courseId || batchId || semesterId) {
      if (courseId) courseOfferingFilter.courseId = courseId;
      if (batchId) courseOfferingFilter.batchId = batchId;
      if (semesterId) courseOfferingFilter.semesterId = semesterId;
    }
    
    if (published === "true") {
      filter.publishedAt = { $ne: null };
    } else if (published === "false") {
      filter.publishedAt = null;
    }
    
    if (dueBefore) {
      filter.dueAt = { ...filter.dueAt, $lte: new Date(dueBefore) };
    }
    
    if (dueAfter) {
      filter.dueAt = { ...filter.dueAt, $gte: new Date(dueAfter) };
    }
    
    // Build sort
    const sort: any = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;
    
    // If we have course offering filters, we need to use aggregation
    let assignments, total;
    
    if (Object.keys(courseOfferingFilter).length > 0) {
      // Use aggregation pipeline for complex filtering
      const pipeline = [
        {
          $lookup: {
            from: 'courseofferings',
            localField: 'courseOfferingId',
            foreignField: '_id',
            as: 'courseOffering'
          }
        },
        {
          $unwind: '$courseOffering'
        },
        {
          $lookup: {
            from: 'courses',
            localField: 'courseOffering.courseId',
            foreignField: '_id',
            as: 'courseOffering.courseId'
          }
        },
        {
          $lookup: {
            from: 'batches',
            localField: 'courseOffering.batchId',
            foreignField: '_id',
            as: 'courseOffering.batchId'
          }
        },
        {
          $lookup: {
            from: 'semesters',
            localField: 'courseOffering.semesterId',
            foreignField: '_id',
            as: 'courseOffering.semesterId'
          }
        },
        {
          $unwind: {
            path: '$courseOffering.courseId',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $unwind: {
            path: '$courseOffering.batchId',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $unwind: {
            path: '$courseOffering.semesterId',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $match: {
            ...filter,
            ...(Object.keys(courseOfferingFilter).length > 0 && {
              $and: Object.entries(courseOfferingFilter).map(([key, value]) => ({
                [`courseOffering.${key}._id`]: new Types.ObjectId(value as string)
              }))
            })
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'createdBy',
            foreignField: '_id',
            as: 'createdBy'
          }
        },
        {
          $unwind: {
            path: '$createdBy',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $sort: sort
        },
        {
          $facet: {
            data: [
              { $skip: skip },
              { $limit: limit }
            ],
            total: [
              { $count: 'count' }
            ]
          }
        }
      ];
      
      const result = await Assignment.aggregate(pipeline);
      assignments = result[0].data;
      total = result[0].total[0]?.count || 0;
    } else {
      // Use regular find for simple filtering
      [assignments, total] = await Promise.all([
        Assignment.find(filter)
          .populate({
            path: 'courseOfferingId',
            select: 'title code courseId batchId semesterId',
            populate: [
              { path: 'courseId', select: 'title code' },
              { path: 'batchId', select: 'title code' },
              { path: 'semesterId', select: 'title number' }
            ]
          })
          .populate('createdBy', 'name email')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        Assignment.countDocuments(filter)
      ]);
    }
    
    // Add completion count to each assignment and normalize structure
    const assignmentsWithCounts = assignments.map(assignment => {
      // Normalize the structure for aggregation results
      const normalizedAssignment = {
        ...assignment,
        courseOfferingId: assignment.courseOffering || assignment.courseOfferingId,
        completionCount: assignment.completedEmails?.length || 0,
        totalSubmissions: assignment.emailSubmissions?.length || 0
      };
      
      // Remove the temporary courseOffering field if it exists
      if (normalizedAssignment.courseOffering) {
        delete normalizedAssignment.courseOffering;
      }
      
      return normalizedAssignment;
    });
    
    return NextResponse.json({
      assignments: assignmentsWithCounts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const me = await getAuthUserFromRequest(req);
    if (!me) {
      return createErrorResponse('Unauthorized', 401);
    }
    requireRoles(me, ["admin", "manager", "developer", "mentor"]);
    
    const body = await req.json();
    const validatedData = AssignmentCreateSchema.parse(body);
    
    const assignment = new Assignment({
      ...validatedData,
      createdBy: me._id,
      publishedAt: validatedData.published ? new Date() : null,
      completedEmails: [],
      emailSubmissions: []
    });
    
    await assignment.save();
    
    const populatedAssignment = await Assignment.findById(assignment._id)
      .populate('courseOfferingId', 'title code')
      .populate('createdBy', 'name email')
      .lean();
    
    return NextResponse.json({ data: populatedAssignment }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}