import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Assignment } from "@/models/Assignment";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";
import { handleApiError, createErrorResponse } from "@/utils/apiHelpers";
import { Types } from "mongoose";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    const me = await getAuthUserFromRequest(req);
    if (!me) {
      return createErrorResponse('Unauthorized', 401);
    }
    requireRoles(me, ["admin", "manager", "developer", "mentor"]);
    
    const { id } = params;
    
    if (!Types.ObjectId.isValid(id)) {
      return createErrorResponse('Invalid assignment ID', 400);
    }
    
    const body = await req.json();
    const { published } = body;
    
    if (typeof published !== 'boolean') {
      return createErrorResponse('Published status must be a boolean', 400);
    }
    
    // Check if assignment exists
    const existingAssignment = await Assignment.findById(id);
    if (!existingAssignment) {
      return createErrorResponse('Assignment not found', 404);
    }
    
    // Toggle publish status
    const updatedAssignment = await Assignment.findByIdAndUpdate(
      id, 
      { publishedAt: published ? new Date() : null },
      { new: true }
    )
      .populate('courseOfferingId', 'title code')
      .populate('createdBy', 'name email')
      .lean();
    
    return NextResponse.json({ 
      message: `Assignment ${published ? 'published' : 'unpublished'} successfully`,
      data: updatedAssignment 
    });
  } catch (error) {
    return handleApiError(error);
  }
}
