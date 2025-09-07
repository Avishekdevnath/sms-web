import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthUserFromRequest } from '@/lib/rbac';
import { User } from '@/models/User';
import { Mission } from '@/models/Mission';
import { StudentMission } from '@/models/StudentMission'; // Add StudentMission import
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/utils/apiHelpers';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const me = await getAuthUserFromRequest(req);
    if (!me) {
      return createErrorResponse('Unauthorized', 401);
    }

    // Only admins, SREs, and mentors can assign mentors
    if (!['admin', 'sre', 'mentor'].includes(me.role)) {
      return createErrorResponse('Insufficient permissions', 403);
    }

    const { studentIds, mentorId, missionId } = await req.json();

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return createErrorResponse('Student IDs array is required', 400);
    }

    if (!mentorId) {
      return createErrorResponse('Mentor ID is required', 400);
    }

    // Verify mentor exists and is actually a mentor
    const mentor = await User.findById(mentorId);
    if (!mentor || mentor.role !== 'mentor') {
      return createErrorResponse('Invalid mentor ID', 400);
    }

    // Check if mentor has capacity for more students
    const currentStudentCount = mentor.studentsCount || 0;
    const maxStudents = mentor.maxStudents || 10;
    
    if (currentStudentCount + studentIds.length > maxStudents) {
      return createErrorResponse(
        `Mentor can only handle ${maxStudents} students. Current: ${currentStudentCount}, Requested: ${studentIds.length}`,
        400
      );
    }

    // Verify all students exist and are actually students
    const students = await User.find({ 
      _id: { $in: studentIds }, 
      role: 'student' 
    });

    if (students.length !== studentIds.length) {
      return createErrorResponse('Some student IDs are invalid', 400);
    }

    // If missionId is provided, verify students are enrolled in that mission using StudentMission
    if (missionId) {
      const mission = await Mission.findById(missionId);
      if (!mission) {
        return createErrorResponse('Mission not found', 404);
      }

      // Check if all students are enrolled in this mission using StudentMission
      const studentsInMission = await StudentMission.find({
        missionId: missionId,
        studentId: { $in: studentIds },
        status: { $ne: 'dropped' }
      });

      if (studentsInMission.length !== studentIds.length) {
        return createErrorResponse('Some students are not enrolled in the specified mission', 400);
      }
    }

    // Update students with mentor assignment
    const updatePromises = studentIds.map(studentId =>
      User.findByIdAndUpdate(
        studentId,
        { 
          $set: { 
            mentorId: mentorId,
            updatedAt: new Date()
          }
        }
      )
    );

    await Promise.all(updatePromises);

    // Update mentor's student count
    await User.findByIdAndUpdate(
      mentorId,
      { 
        $inc: { studentsCount: studentIds.length },
        updatedAt: new Date()
      }
    );

    // If missionId is provided, update StudentMission records with mentor assignment
    if (missionId) {
      await StudentMission.updateMany(
        {
          missionId: missionId,
          studentId: { $in: studentIds },
          status: { $ne: 'dropped' }
        },
        {
          $set: {
            mentorId: mentorId,
            lastActivity: new Date()
          }
        }
      );
    }

    return createSuccessResponse(
      { 
        assignedStudents: studentIds.length,
        mentorId: mentorId,
        missionId: missionId || null
      },
      `Successfully assigned ${studentIds.length} students to mentor ${mentor.name}`
    );

  } catch (error) {
    return handleApiError(error);
  }
}
