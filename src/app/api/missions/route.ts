import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthUserFromRequest } from '@/lib/rbac';
import { Mission } from '@/models/Mission';
import { StudentMission } from '@/models/StudentMission';
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/utils/apiHelpers';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const me = await getAuthUserFromRequest(req);
    if (!me) {
      return createErrorResponse('Unauthorized', 401);
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Build query
    let query: any = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Fetch missions with pagination
    const missions = await Mission.find(query)
      .populate('batchId', 'code title')
      .populate('courses.courseOfferingId.courseId', 'code title')
      .populate('createdBy', 'name email')
      .select('code title description status startDate endDate maxStudents courses requirements rewards createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalMissions = await Mission.countDocuments(query);

    // Get student counts for each mission
    const missionsWithStudentCounts = await Promise.all(
      missions.map(async (mission) => {
        const studentCount = await StudentMission.countDocuments({
          missionId: mission._id,
          status: { $ne: 'dropped' }
        });

        return {
          ...mission,
          students: [],
          studentCount: studentCount
        };
      })
    );

    // Transform data for frontend
    const transformedMissions = missionsWithStudentCounts.map(mission => ({
      _id: mission._id,
      code: mission.code || 'N/A',
      title: mission.title || 'Untitled',
      description: mission.description || '',
      status: mission.status || 'draft',
      startDate: mission.startDate,
      endDate: mission.endDate,
      maxStudents: mission.maxStudents || 0,
      students: [],
      studentCount: mission.studentCount || 0,
      courses: mission.courses || [],
      requirements: mission.requirements || [],
      rewards: mission.rewards || [],
      createdAt: mission.createdAt,
      batch: mission.batchId ? {
        code: mission.batchId.code || 'N/A',
        title: mission.batchId.title || 'Untitled'
      } : null
    }));

    return NextResponse.json({
      missions: transformedMissions,
      total: totalMissions,
      page,
      limit,
      pages: Math.ceil(totalMissions / limit)
    });

  } catch (error) {
    console.error('Error in missions API:', error);
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
    
    // Create new mission
    const mission = new Mission({
      ...body,
      createdBy: me._id,
      students: [],
      status: body.status || 'draft'
    });

    await mission.save();

    // Populate the created mission for response
    const populatedMission = await Mission.findById(mission._id)
      .populate('batchId', 'code title')
      .populate('courses.courseOfferingId.courseId', 'code title')
      .populate('createdBy', 'name email');

    return NextResponse.json({
      success: true,
      message: 'Mission created successfully',
      mission: populatedMission
    });

  } catch (error) {
    console.error('Error creating mission:', error);
    return handleApiError(error);
  }
}
