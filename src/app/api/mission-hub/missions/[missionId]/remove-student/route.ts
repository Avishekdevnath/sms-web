import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthUserFromRequest } from '@/lib/rbac';
import { Mission } from '@/models/Mission';
import { StudentMission } from '@/models/StudentMission'; // Add StudentMission import
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/utils/apiHelpers';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ missionId: string }> }
) {
  try {
    await connectToDatabase();
    
    const me = await getAuthUserFromRequest(req);
    if (!me) {
      return createErrorResponse('Unauthorized', 401);
    }

    // Only admins, SREs, and mentors can remove students
    if (!['admin', 'sre', 'mentor'].includes(me.role)) {
      return createErrorResponse('Insufficient permissions', 403);
    }

    const { missionId } = await params;
    const { studentId } = await req.json();

    if (!studentId) {
      return createErrorResponse('Student ID is required', 400);
    }

    // Find the mission
    const mission = await Mission.findById(missionId);
    if (!mission) {
      return createErrorResponse('Mission not found', 404);
    }

    // Check if user has permission to modify this mission
    if (me.role !== 'admin' && me.role !== 'sre' && mission.createdBy.toString() !== me._id) {
      return createErrorResponse('Insufficient permissions to modify this mission', 403);
    }

    // Check if student is actually enrolled in this mission using StudentMission
    const studentMission = await StudentMission.findOne({
      missionId: missionId,
      studentId: studentId,
      status: { $ne: 'dropped' }
    });

    if (!studentMission) {
      return createErrorResponse('Student is not enrolled in this mission', 400);
    }

    // Mark student as dropped instead of deleting (maintains history)
    await StudentMission.findByIdAndUpdate(
      studentMission._id,
      {
        $set: { 
          status: 'dropped',
          lastActivity: new Date()
        }
      }
    );

    // Get updated student count
    const updatedStudentCount = await StudentMission.countDocuments({
      missionId: missionId,
      status: { $ne: 'dropped' }
    });

    return createSuccessResponse(
      { 
        missionId: missionId,
        removedStudent: studentId,
        totalStudents: updatedStudentCount,
        message: 'Student successfully removed from mission'
      },
      'Student successfully removed from mission'
    );

  } catch (error) {
    return handleApiError(error);
  }
}
