import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthUserFromRequest } from '@/lib/rbac';
import { User } from '@/models/User';
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/utils/apiHelpers';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    
    const me = await getAuthUserFromRequest(req);
    if (!me) {
      return createErrorResponse('Unauthorized', 401);
    }

    // Only admins, SREs, and mentors can reactivate students
    if (!['admin', 'sre', 'mentor'].includes(me.role)) {
      return createErrorResponse('Insufficient permissions', 403);
    }

    const { id } = await params;

    // Find and reactivate the student
    const student = await User.findByIdAndUpdate(
      id,
      { 
        $set: { 
          isActive: true,
          updatedAt: new Date()
        }
      },
      { new: true }
    ).select('name email studentId');

    if (!student) {
      return createErrorResponse('Student not found', 404);
    }

    return createSuccessResponse(
      { student },
      `Student ${student.name} has been reactivated successfully`
    );

  } catch (error) {
    return handleApiError(error);
  }
}
