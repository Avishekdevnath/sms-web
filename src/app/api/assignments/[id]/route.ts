import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Assignment } from "@/models/Assignment";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";
import { AssignmentCreateSchema } from "@/schemas/assignment";
import { handleApiError, createErrorResponse } from "@/utils/apiHelpers";
import { Types } from "mongoose";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    const { id } = params;
    
    if (!Types.ObjectId.isValid(id)) {
      return createErrorResponse('Invalid assignment ID', 400);
    }
    
    const assignment = await Assignment.findById(id)
      .populate('courseOfferingId', 'title code')
      .populate('createdBy', 'name email')
      .populate('completedEmails.studentId', 'name email studentId')
      .populate('completedEmails.addedBy', 'name email')
      .populate('emailSubmissions.submittedBy', 'name email')
      .lean();
    
    if (!assignment) {
      return createErrorResponse('Assignment not found', 404);
    }
    
    return NextResponse.json({ data: assignment });
  } catch (error) {
    return handleApiError(error);
  }
}

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
    const validatedData = AssignmentCreateSchema.partial().parse(body);
    
    // Check if assignment exists
    const existingAssignment = await Assignment.findById(id);
    if (!existingAssignment) {
      return createErrorResponse('Assignment not found', 404);
    }
    
    // Update assignment
    const updatedAssignment = await Assignment.findByIdAndUpdate(
      id,
      { ...validatedData, updatedAt: new Date() },
      { new: true }
    )
      .populate('courseOfferingId', 'title code')
      .populate('createdBy', 'name email')
      .lean();
    
    return NextResponse.json({ data: updatedAssignment });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    const me = await getAuthUserFromRequest(req);
    if (!me) {
      return createErrorResponse('Unauthorized', 401);
    }
    requireRoles(me, ["admin", "manager"]);
    
    const { id } = params;
    
    if (!Types.ObjectId.isValid(id)) {
      return createErrorResponse('Invalid assignment ID', 400);
    }
    
    // Check if assignment exists
    const existingAssignment = await Assignment.findById(id);
    if (!existingAssignment) {
      return createErrorResponse('Assignment not found', 404);
    }
    
    // Delete assignment
    await Assignment.findByIdAndDelete(id);
    
    return NextResponse.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
