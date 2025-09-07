import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthUserFromRequest } from '@/lib/rbac';
import { Mission } from '@/models/Mission';
import { StudentMission } from '@/models/StudentMission'; // Add StudentMission import
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/utils/apiHelpers';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const me = await getAuthUserFromRequest(req);
    if (!me) {
      return createErrorResponse('Unauthorized', 401);
    }

    // Fetch all missions with populated data (but not students array)
    const missions = await Mission.find({})
      .populate('batchId', 'code title')
      .populate('courses.courseOfferingId.courseId', 'code title')
      .populate('createdBy', 'name email')
      .select('code title description status startDate endDate maxStudents courses requirements rewards createdAt')
      .lean();

    console.log('Raw missions from database:', missions); // Debug log

    // Get student counts for each mission using StudentMission model
    const missionsWithStudentCounts = await Promise.all(
      missions.map(async (mission) => {
        // Count active students for this mission - be more specific about status
        const activeStudentCount = await StudentMission.countDocuments({
          missionId: mission._id,
          status: 'active'
        });

        const completedStudentCount = await StudentMission.countDocuments({
          missionId: mission._id,
          status: 'completed'
        });

        const totalStudentCount = activeStudentCount + completedStudentCount;

        console.log(`Mission ${mission.code} (${mission._id}): active=${activeStudentCount}, completed=${completedStudentCount}, total=${totalStudentCount}`);

        return {
          ...mission,
          students: [], // Empty array since we're not using the old students field
          studentCount: totalStudentCount // Only count active and completed students
        };
      })
    );

    // Transform data for frontend - simplified structure
    const transformedMissions = missionsWithStudentCounts.map(mission => ({
      _id: mission._id,
      code: mission.code || 'N/A',
      title: mission.title || 'Untitled',
      description: mission.description || '',
      status: mission.status || 'draft',
      startDate: mission.startDate,
      endDate: mission.endDate,
      maxStudents: mission.maxStudents || 0,
      students: [], // Empty array - students are managed via StudentMission model
      studentCount: mission.studentCount || 0, // Actual count from StudentMission
      courses: mission.courses || [],
      requirements: mission.requirements || [],
      rewards: mission.rewards || [],
      createdAt: mission.createdAt,
      batch: mission.batchId ? {
        code: mission.batchId.code || 'N/A',
        title: mission.batchId.title || 'Untitled'
      } : null
    }));

    console.log('Transformed missions:', transformedMissions); // Debug log
    console.log('Number of missions found:', transformedMissions.length); // Debug log

    return createSuccessResponse({ missions: transformedMissions });
  } catch (error) {
    console.error('Error in mission-hub missions API:', error); // Debug log
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const me = await getAuthUserFromRequest(req);
    if (!me) {
      return createErrorResponse('Unauthorized', 401);
    }

    // Only admins and SREs can create missions
    if (!['admin', 'sre'].includes(me.role)) {
      return createErrorResponse('Insufficient permissions', 403);
    }

    const body = await req.json();
    
    // Create new mission (without students array since we're using StudentMission model)
    const mission = new Mission({
      ...body,
      createdBy: me._id,
      students: [], // Keep empty for backward compatibility
      status: body.status || 'draft'
    });

    await mission.save();

    return createSuccessResponse({ mission }, 'Mission created successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
