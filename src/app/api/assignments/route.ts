import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Assignment } from "@/models/Assignment";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";
import { AssignmentCreateSchema, AssignmentQuerySchema } from "@/schemas/assignment";
import { handleApiError } from "@/utils/apiHelpers";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const skip = (page - 1) * limit;
    const search = searchParams.get("search") || "";
    const courseOfferingId = searchParams.get("courseOfferingId");
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
    
    const [assignments, total] = await Promise.all([
      Assignment.find(filter)
        .populate('courseOfferingId', 'title code')
        .populate('createdBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Assignment.countDocuments(filter)
    ]);
    
    return NextResponse.json({
      assignments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch assignments');
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["admin", "manager", "developer", "mentor"]);
    
    const body = await req.json();
    const validatedData = AssignmentCreateSchema.parse(body);
    
    const assignment = new Assignment({
      ...validatedData,
      createdBy: me._id,
      publishedAt: validatedData.published ? new Date() : null
    });
    
    await assignment.save();
    
    const populatedAssignment = await Assignment.findById(assignment._id)
      .populate('courseOfferingId', 'title code')
      .populate('createdBy', 'name email')
      .lean();
    
    return NextResponse.json({ data: populatedAssignment }, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'Failed to create assignment');
  }
}