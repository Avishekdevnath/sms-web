import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthUserFromRequest } from '@/lib/rbac';
import { Mission } from '@/models/Mission';
import { StudentMission } from '@/models/StudentMission'; // Add StudentMission import
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/utils/apiHelpers';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ missionId: string }> }
) {
  try {
    await connectToDatabase();
    
    const me = await getAuthUserFromRequest(req);
    if (!me) {
      return createErrorResponse('Unauthorized', 401);
    }

    const { missionId } = await params;

    // Find the mission with populated data (but not students array)
    const mission = await Mission.findById(missionId)
      .populate('batchId', 'code title')
      .populate('courses.courseOfferingId.courseId', 'code title')
      .populate('createdBy', 'name email')
      .lean();

    if (!mission) {
      return createErrorResponse('Mission not found', 404);
    }

    // Get student count and basic info using StudentMission model
    const studentCount = await StudentMission.countDocuments({
      missionId: missionId,
      status: { $ne: 'dropped' }
    });

    // Transform data for frontend
    const transformedMission = {
      _id: mission._id,
      code: mission.code,
      title: mission.title,
      description: mission.description,
      status: mission.status,
      startDate: mission.startDate,
      endDate: mission.endDate,
      maxStudents: mission.maxStudents,
      students: [], // Empty array - students are managed via StudentMission model
      studentCount: studentCount, // Actual count from StudentMission
      courses: mission.courses || [],
      requirements: mission.requirements || [],
      rewards: mission.rewards || [],
      createdAt: mission.createdAt,
      batch: mission.batchId ? {
        code: mission.batchId.code,
        title: mission.batchId.title
      } : null,
      createdBy: mission.createdBy
    };

    return createSuccessResponse({ mission: transformedMission });
  } catch (error) {
    return handleApiError(error);
  }
}
