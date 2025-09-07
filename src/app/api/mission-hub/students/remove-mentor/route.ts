import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthUserFromRequest } from '@/lib/rbac';
import { User } from '@/models/User';
import { Mission } from '@/models/Mission';
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/utils/apiHelpers';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const me = await getAuthUserFromRequest(req);
    if (!me) {
      return createErrorResponse('Unauthorized', 401);
    }

    // Only admins, SREs, and mentors can remove mentor assignments
    if (!['admin', 'sre', 'mentor'].includes(me.role)) {
      return createErrorResponse('Insufficient permissions', 403);
    }

    const { studentId, missionId } = await req.json();

    if (!studentId) {
      return createErrorResponse('Student ID is required', 400);
    }

    // Verify student exists and is actually a student
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return createErrorResponse('Invalid student ID', 400);
    }

    // Check if student has a mentor assigned
    if (!student.mentorId) {
      return createErrorResponse('Student has no mentor assigned', 400);
    }

    // Get the current mentor to update their student count
    const currentMentor = await User.findById(student.mentorId);
    if (!currentMentor) {
      return createErrorResponse('Current mentor not found', 400);
    }

    // Remove mentor assignment from student
    await User.findByIdAndUpdate(
      studentId,
      { 
        $unset: { mentorId: "" },
        updatedAt: new Date()
      }
    );

    // Decrease mentor's student count
    await User.findByIdAndUpdate(
      currentMentor._id,
      { 
        $inc: { studentsCount: -1 },
        updatedAt: new Date()
      }
    );

    // If missionId is provided, update mission student records
    if (missionId) {
      await Mission.findByIdAndUpdate(
        missionId,
        {
          $unset: {
            "students.$[elem].mentorId": ""
          }
        },
        {
          arrayFilters: [{ "elem.studentId": studentId }],
          new: true
        }
      );
    }

    return createSuccessResponse(
      { 
        studentId: studentId,
        removedMentorId: currentMentor._id,
        missionId: missionId || null
      },
      `Successfully removed mentor assignment from student ${student.name}`
    );

  } catch (error) {
    return handleApiError(error);
  }
}
