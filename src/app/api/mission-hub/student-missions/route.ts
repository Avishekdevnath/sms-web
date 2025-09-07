import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthUserFromRequest } from '@/lib/rbac';
import { MissionV2, MissionStudentV2 } from '@/models/v2';
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/utils/apiHelpers';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const me = await getAuthUserFromRequest(req);
    if (!me) {
      return createErrorResponse('Unauthorized', 401);
    }

    // Only students can access this endpoint
    if (me.role !== 'student') {
      return createErrorResponse('Access denied', 403);
    }

    // ✅ Get missions where the student is enrolled using V2 models
    const studentMissions = await MissionStudentV2.find({
      studentId: me._id,
      status: { $in: ['active', 'completed'] } // Only active and completed missions
    })
    .populate('missionId')
    .lean();

    // Extract mission IDs and fetch full mission data
    const missionIds = studentMissions.map(sm => sm.missionId);
    
    const missions = await MissionV2.find({
      _id: { $in: missionIds }
    })
    .populate('batchId', 'code title')
    .populate('courses.courseOfferingId.courseId', 'code title')
    .select('code title status description startDate endDate maxStudents courses requirements rewards totalStudents totalMentors')
    .lean();

    // ✅ Transform data for frontend with V2 structure
    const transformedMissions = missions.map(mission => {
      // Find corresponding student mission data
      const studentMission = studentMissions.find(sm => 
        sm.missionId._id.toString() === mission._id.toString()
      );

      return {
        _id: mission._id,
        code: mission.code,
        title: mission.title,
        status: mission.status,
        description: mission.description,
        startDate: mission.startDate,
        endDate: mission.endDate,
        maxStudents: mission.maxStudents,
        totalStudents: mission.totalStudents || 0,
        totalMentors: mission.totalMentors || 0,
        courses: mission.courses || [],
        requirements: mission.requirements || [],
        rewards: mission.rewards || [],
        batchId: mission.batchId ? {
          _id: mission.batchId._id,
          code: mission.batchId.code,
          title: mission.batchId.title
        } : null,
        // Student-specific data
        studentStatus: studentMission?.status || 'unknown',
        enrollmentDate: studentMission?.enrolledAt,
        progress: studentMission?.progress || 0
      };
    });

    return createSuccessResponse({ missions: transformedMissions });
  } catch (error) {
    return handleApiError(error);
  }
}
