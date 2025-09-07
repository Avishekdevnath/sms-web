import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Assignment } from "@/models/Assignment";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";
import { handleApiError, createErrorResponse } from "@/utils/apiHelpers";
import { cleanEmail } from "@/utils/emailProcessing";
import { Types } from "mongoose";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; email: string } }
) {
  try {
    await connectToDatabase();
    
    const me = await getAuthUserFromRequest(req);
    if (!me) {
      return createErrorResponse('Unauthorized', 401);
    }
    requireRoles(me, ["admin", "manager", "developer", "sre"]);
    
    const { id, email } = params;
    
    if (!Types.ObjectId.isValid(id)) {
      return createErrorResponse('Invalid assignment ID', 400);
    }
    
    if (!email) {
      return createErrorResponse('Email is required', 400);
    }
    
    const cleanedEmail = cleanEmail(email);
    
    // Check if assignment exists
    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return createErrorResponse('Assignment not found', 404);
    }
    
    // Find the email to remove
    const emailIndex = assignment.completedEmails.findIndex(
      ce => cleanEmail(ce.email) === cleanedEmail
    );
    
    if (emailIndex === -1) {
      return createErrorResponse('Email not found in assignment', 404);
    }
    
    // Remove the email
    assignment.completedEmails.splice(emailIndex, 1);
    
    // Save the updated assignment
    const updatedAssignment = await assignment.save();
    
    // Populate the updated assignment
    const populatedAssignment = await Assignment.findById(updatedAssignment._id)
      .populate('courseOfferingId', 'title code')
      .populate('createdBy', 'name email')
      .populate('completedEmails.studentId', 'name email studentId')
      .populate('completedEmails.addedBy', 'name email')
      .populate('emailSubmissions.submittedBy', 'name email')
      .lean();
    
    return NextResponse.json({
      message: 'Email removed successfully',
      data: populatedAssignment
    });
    
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; email: string } }
) {
  try {
    await connectToDatabase();
    
    const me = await getAuthUserFromRequest(req);
    if (!me) {
      return createErrorResponse('Unauthorized', 401);
    }
    requireRoles(me, ["admin", "manager", "developer", "sre"]);
    
    const { id, email } = params;
    
    if (!Types.ObjectId.isValid(id)) {
      return createErrorResponse('Invalid assignment ID', 400);
    }
    
    if (!email) {
      return createErrorResponse('Email is required', 400);
    }
    
    const body = await req.json();
    const { notes, status } = body;
    
    const cleanedEmail = cleanEmail(email);
    
    // Check if assignment exists
    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return createErrorResponse('Assignment not found', 404);
    }
    
    // Find the email to update
    const emailIndex = assignment.completedEmails.findIndex(
      ce => cleanEmail(ce.email) === cleanedEmail
    );
    
    if (emailIndex === -1) {
      return createErrorResponse('Email not found in assignment', 404);
    }
    
    // Update email fields if provided
    if (notes !== undefined) {
      assignment.completedEmails[emailIndex].notes = notes;
    }
    
    if (status !== undefined) {
      assignment.completedEmails[emailIndex].status = status;
    }
    
    // Save the updated assignment
    const updatedAssignment = await assignment.save();
    
    // Populate the updated assignment
    const populatedAssignment = await Assignment.findById(updatedAssignment._id)
      .populate('courseOfferingId', 'title code')
      .populate('createdBy', 'name email')
      .populate('completedEmails.studentId', 'name email studentId')
      .populate('completedEmails.addedBy', 'name email')
      .populate('emailSubmissions.submittedBy', 'name email')
      .lean();
    
    return NextResponse.json({
      message: 'Email updated successfully',
      data: populatedAssignment
    });
    
  } catch (error) {
    return handleApiError(error);
  }
}
