import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MissionMentor } from '@/models/MissionMentor';
import { Mission } from '@/models/Mission';
import { getAuthUserFromRequest } from '@/lib/rbac';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ missionId: string }> }
) {
  try {
    // Check authentication
    const me = await getAuthUserFromRequest(request);
    if (!me) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { missionId } = await params;

    if (!missionId) {
      return NextResponse.json({ error: 'Mission ID is required' }, { status: 400 });
    }

    await connectToDatabase();

    // Check if mission exists
    const mission = await Mission.findById(missionId);
    if (!mission) {
      return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
    }

    // Get all mentors for this mission
    const missionMentors = await MissionMentor.find({ 
      missionId
      // Removed status filter to show all mentors
    })
    .populate('mentorId', 'name email role profilePicture')
    .populate('assignedStudents', 'name email studentId')
    .sort({ role: 1, currentWorkload: 1 }); // Sort by role priority and workload

    // Update any inactive mentors to active status (fix for existing data)
    for (const mentor of missionMentors) {
      if (mentor.status === 'inactive' && mentor.currentWorkload === 0) {
        mentor.status = 'active';
        await mentor.save();
        console.log(`Updated mentor ${mentor._id} status from inactive to active`);
      }
    }

    console.log('Found mission mentors:', missionMentors.length);
    console.log('Mission mentors data:', JSON.stringify(missionMentors, null, 2));

    // Group mentors by role for better organization
    const mentorsByRole = {
      primary: missionMentors.filter(m => m.role === 'primary'),
      secondary: missionMentors.filter(m => m.role === 'secondary'),
      moderator: missionMentors.filter(m => m.role === 'moderator')
    };

    // Calculate mission-level statistics
    const totalStudents = mission.students.length;
    const totalMentors = missionMentors.length;
    const activeMentors = missionMentors.filter(m => m.status === 'active').length;
    const overloadedMentors = missionMentors.filter(m => m.status === 'overloaded').length;

    return NextResponse.json({
      message: 'Mission mentors retrieved successfully',
      data: {
        mission: {
          id: mission._id,
          code: mission.code,
          title: mission.title,
          status: mission.status
        },
        mentors: missionMentors,
        mentorsByRole,
        statistics: {
          totalStudents,
          totalMentors,
          activeMentors,
          overloadedMentors
        }
      }
    });

  } catch (error) {
    console.error('Error retrieving mission mentors:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
