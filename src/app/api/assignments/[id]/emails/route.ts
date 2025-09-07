import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Assignment } from "@/models/Assignment";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";
import { handleApiError, createErrorResponse } from "@/utils/apiHelpers";
import { Types } from "mongoose";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    const me = await getAuthUserFromRequest(req);
    if (!me) {
      return createErrorResponse('Unauthorized', 401);
    }
    requireRoles(me, ["admin", "manager", "developer", "mentor", "sre"]);
    
    const { id } = params;
    
    if (!Types.ObjectId.isValid(id)) {
      return createErrorResponse('Invalid assignment ID', 400);
    }
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
    const skip = (page - 1) * limit;
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "addedAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    
    // Get assignment with completed emails
    const assignment = await Assignment.findById(id)
      .populate('courseOfferingId', 'title code')
      .populate('createdBy', 'name email')
      .populate('completedEmails.studentId', 'name email studentId')
      .populate('completedEmails.addedBy', 'name email')
      .lean();
    
    if (!assignment) {
      return createErrorResponse('Assignment not found', 404);
    }
    
    let completedEmails = assignment.completedEmails || [];
    
    // Apply search filter
    if (search) {
      completedEmails = completedEmails.filter(email => 
        email.email.toLowerCase().includes(search.toLowerCase()) ||
        (email.studentId && 
          (email.studentId.name?.toLowerCase().includes(search.toLowerCase()) ||
           email.studentId.studentId?.toLowerCase().includes(search.toLowerCase()))
        )
      );
    }
    
    // Apply sorting
    completedEmails.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'email':
          aValue = a.email;
          bValue = b.email;
          break;
        case 'addedAt':
          aValue = new Date(a.addedAt);
          bValue = new Date(b.addedAt);
          break;
        case 'addedBy':
          aValue = a.addedBy.name || a.addedBy.email;
          bValue = b.addedBy.name || b.addedBy.email;
          break;
        case 'studentName':
          aValue = a.studentId?.name || '';
          bValue = b.studentId?.name || '';
          break;
        default:
          aValue = new Date(a.addedAt);
          bValue = new Date(b.addedAt);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    // Apply pagination
    const total = completedEmails.length;
    const paginatedEmails = completedEmails.slice(skip, skip + limit);
    
    // Calculate statistics
    const stats = {
      total: completedEmails.length,
      withStudentId: completedEmails.filter(email => email.studentId).length,
      withoutStudentId: completedEmails.filter(email => !email.studentId).length,
      uniqueEmails: new Set(completedEmails.map(email => email.email)).size
    };
    
    return NextResponse.json({
      data: {
        assignment: {
          _id: assignment._id,
          title: assignment.title,
          courseOfferingId: assignment.courseOfferingId,
          createdBy: assignment.createdBy,
          publishedAt: assignment.publishedAt
        },
        completedEmails: paginatedEmails,
        stats,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
    
  } catch (error) {
    return handleApiError(error);
  }
}
