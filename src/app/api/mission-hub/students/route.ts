import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Mission } from '@/models/Mission';
import { StudentMission } from '@/models/StudentMission';
import { User } from '@/models/User';
import { getAuthUserFromRequest } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const me = await getAuthUserFromRequest(request);
    if (!me) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const missionId = searchParams.get('missionId');

    if (!missionId) {
      return NextResponse.json({ error: 'Mission ID is required' }, { status: 400 });
    }

    await connectToDatabase();

    // Check if mission exists
    const mission = await Mission.findById(missionId);
    if (!mission) {
      return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
    }

    console.log(`Fetching students for mission: ${missionId}`);

    // Get all students enrolled in this mission using the StudentMission model
    const studentMissions = await StudentMission.find({
      missionId: missionId,
      status: { $in: ['active', 'completed'] } // Only active and completed students
    }).populate('studentId', 'name email studentId role isActive').lean();

    console.log(`Found ${studentMissions.length} student missions for mission ${missionId}`);

    if (studentMissions.length === 0) {
      console.log(`No students found for mission ${missionId}`);
      return NextResponse.json({
        success: true,
        data: {
          students: []
        }
      });
    }

    // Extract student data from studentmissions
    const students = studentMissions.map(sm => {
      if (!sm.studentId) {
        console.warn(`StudentMission ${sm._id} has no populated studentId`);
        return null;
      }
      
      return {
        _id: sm.studentId._id,
        name: sm.studentId.name,
        email: sm.studentId.email,
        studentId: sm.studentId.studentId,
        role: sm.studentId.role,
        isActive: sm.studentId.isActive,
        status: sm.status,
        progress: sm.progress,
        startedAt: sm.startedAt,
        lastActivity: sm.lastActivity
      };
    }).filter(Boolean); // Remove null entries

    console.log(`Returning ${students.length} valid students for mission ${missionId}`);

    return NextResponse.json({
      success: true,
      data: {
        students: students
      }
    });

  } catch (error) {
    console.error('Error retrieving mission students:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
