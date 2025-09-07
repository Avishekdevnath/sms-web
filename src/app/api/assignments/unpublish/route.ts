import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Assignment } from "@/models/Assignment";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";
import { handleApiError, createErrorResponse } from "@/utils/apiHelpers";
import { Types } from "mongoose";

export async function PATCH(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const me = await getAuthUserFromRequest(req);
    if (!me) {
      return createErrorResponse('Unauthorized', 401);
    }
    requireRoles(me, ["admin", "manager", "developer", "mentor"]);
    
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return createErrorResponse('Assignment ID is required', 400);
    }
    
    if (!Types.ObjectId.isValid(id)) {
      return createErrorResponse('Invalid assignment ID', 400);
    }
    
    // Check if assignment exists
    const existingAssignment = await Assignment.findById(id);
    if (!existingAssignment) {
      return createErrorResponse('Assignment not found', 404);
    }
    
    // Unpublish assignment (preserve existing data as per requirements)
    const updatedAssignment = await Assignment.findByIdAndUpdate(
      id, 
      { publishedAt: null },
      { new: true }
    )
      .populate('courseOfferingId', 'title code')
      .populate('createdBy', 'name email')
      .lean();
    
    return NextResponse.json({ 
      message: 'Assignment unpublished successfully',
      data: updatedAssignment 
    });
  } catch (error) {
    return handleApiError(error);
  }
} 