import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthUserFromRequest } from '@/lib/rbac';
import { StudentMission } from '@/models/StudentMission';
import { Mission } from '@/models/Mission';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const me = await getAuthUserFromRequest(request);
    if (!me) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const missionId = searchParams.get('missionId');

    if (!missionId) {
      return NextResponse.json({ error: 'Mission ID is required' }, { status: 400 });
    }

    // Check if mission exists
    const mission = await Mission.findById(missionId);
    if (!mission) {
      return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
    }

    // Get all StudentMission records for this mission
    const studentMissions = await StudentMission.find({
      missionId: missionId
    }).populate('studentId', 'name email').lean();

    // Group by status
    const statusCounts = {
      active: 0,
      completed: 0,
      failed: 0,
      dropped: 0,
      total: studentMissions.length
    };

    studentMissions.forEach(sm => {
      if (sm.status) {
        statusCounts[sm.status as keyof typeof statusCounts]++;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        mission: {
          _id: mission._id,
          code: mission.code,
          title: mission.title,
          batchId: mission.batchId
        },
        studentMissions: studentMissions,
        statusCounts,
        summary: `Found ${studentMissions.length} total student-mission records`
      }
    });

  } catch (error) {
    console.error('Error in debug API:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
