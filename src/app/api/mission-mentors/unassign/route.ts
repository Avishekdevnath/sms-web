import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthUserFromRequest } from '@/lib/rbac';
import { MissionMentor } from '@/models';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission (admin, SRE, or dev)
    const userRole = user.role;
    if (!['admin', 'sre', 'dev'].includes(userRole)) {
      return NextResponse.json({ success: false, message: 'Insufficient permissions' }, { status: 403 });
    }

    const { missionId, mentorId } = await request.json();

    if (!missionId || !mentorId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Mission ID and Mentor ID are required' 
      }, { status: 400 });
    }

    await connectToDatabase();

    // Find the mission mentor record
    const missionMentor = await MissionMentor.findOne({
      missionId,
      mentorId
    });

    if (!missionMentor) {
      return NextResponse.json({ 
        success: false, 
        message: 'Mentor not found in this mission' 
      }, { status: 404 });
    }

    // Get assigned students before deletion
    const assignedStudents = missionMentor.assignedStudents || [];

    // Remove the mission mentor record
    await MissionMentor.deleteOne({
      missionId,
      mentorId
    });

    // Update the Mission model to remove mentor references
    const { Mission } = await import('@/models');
    await Mission.updateOne(
      { _id: missionId },
      { 
        $pull: { 
          mentors: { mentorId } 
        },
        $pull: {
          students: {
            $or: [
              { primaryMentorId: mentorId },
              { mentors: mentorId }
            ]
          }
        }
      }
    );

    // Update students to remove this mentor from their mentors array
    if (assignedStudents.length > 0) {
      await Mission.updateMany(
        { 
          _id: missionId,
          'students.studentId': { $in: assignedStudents }
        },
        {
          $pull: {
            'students.$.mentors': mentorId
          },
          $unset: {
            'students.$.primaryMentorId': ''
          }
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Mentor successfully unassigned from mission',
      data: {
        unassignedStudents: assignedStudents.length
      }
    });

  } catch (error) {
    console.error('Error unassigning mentor:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}
