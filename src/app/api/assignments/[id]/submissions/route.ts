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
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const skip = (page - 1) * limit;
    const sortBy = searchParams.get("sortBy") || "submittedAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    
    // Get assignment with email submissions
    const assignment = await Assignment.findById(id)
      .populate('courseOfferingId', 'title code')
      .populate('createdBy', 'name email')
      .populate('emailSubmissions.submittedBy', 'name email')
      .lean();
    
    if (!assignment) {
      return createErrorResponse('Assignment not found', 404);
    }
    
    let submissions = assignment.emailSubmissions || [];
    
    // Apply sorting
    submissions.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'submittedAt':
          aValue = new Date(a.submittedAt);
          bValue = new Date(b.submittedAt);
          break;
        case 'submittedBy':
          aValue = a.submittedBy.name || a.submittedBy.email;
          bValue = b.submittedBy.name || b.submittedBy.email;
          break;
        case 'successCount':
          aValue = a.successCount;
          bValue = b.successCount;
          break;
        case 'errorCount':
          aValue = a.errorCount;
          bValue = b.errorCount;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = new Date(a.submittedAt);
          bValue = new Date(b.submittedAt);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    // Apply pagination
    const total = submissions.length;
    const paginatedSubmissions = submissions.slice(skip, skip + limit);
    
    // Calculate statistics
    const stats = {
      totalSubmissions: submissions.length,
      totalEmailsProcessed: submissions.reduce((sum, sub) => sum + sub.processedCount, 0),
      totalEmailsSuccessful: submissions.reduce((sum, sub) => sum + sub.successCount, 0),
      totalEmailsFailed: submissions.reduce((sum, sub) => sum + sub.errorCount, 0),
      completedSubmissions: submissions.filter(sub => sub.status === 'completed').length,
      failedSubmissions: submissions.filter(sub => sub.status === 'failed').length,
      partialSubmissions: submissions.filter(sub => sub.status === 'partial').length
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
        submissions: paginatedSubmissions,
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
