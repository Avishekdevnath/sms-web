import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MissionMentor } from '@/models/MissionMentor';
import { Mission } from '@/models/Mission';
import { User } from '@/models/User';
import { getAuthUserFromRequest } from '@/lib/rbac';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission (admin, sre, dev)
    if (!['admin', 'sre', 'developer'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { missionId, mentorId, role, specialization, maxStudents, notes } = body;

    // Validate required fields
    if (!missionId || !mentorId || !role) {
      return NextResponse.json({ 
        error: 'Missing required fields: missionId, mentorId, role' 
      }, { status: 400 });
    }

    // Validate role
    if (!['primary', 'secondary', 'moderator'].includes(role)) {
      return NextResponse.json({ 
        error: 'Invalid role. Must be primary, secondary, or moderator' 
      }, { status: 400 });
    }

    await connectToDatabase();

    // Check if mission exists
    const mission = await Mission.findById(missionId);
    if (!mission) {
      return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
    }

    // Check if mentor exists and has mentor role
    const mentor = await User.findById(mentorId);
    if (!mentor || mentor.role !== 'mentor') {
      return NextResponse.json({ error: 'Mentor not found or invalid role' }, { status: 404 });
    }

    // Check if mentor is already assigned to this mission
    const existingAssignment = await MissionMentor.findOne({ 
      missionId, 
      mentorId 
    });

    if (existingAssignment) {
      return NextResponse.json({ 
        error: 'Mentor is already assigned to this mission' 
      }, { status: 409 });
    }

    // Create new mission mentor assignment
    const missionMentor = new MissionMentor({
      missionId,
      mentorId,
      role,
      specialization: specialization || [],
      maxStudents: maxStudents || 10,
      currentWorkload: 0,
      status: 'active', // Explicitly set to active
      notes
    });

    console.log('Creating mission mentor:', missionMentor);
    await missionMentor.save();
    console.log('Mission mentor saved successfully:', missionMentor._id);

    // Update mission mentors array
    const missionUpdate = await Mission.findByIdAndUpdate(missionId, {
      $push: {
        mentors: {
          mentorId,
          role,
          specialization: specialization || []
        }
      }
    }, { new: true });

    console.log('Mission updated with new mentor:', missionUpdate);

    // Populate mentor details for response
    const populatedMentor = await MissionMentor.findById(missionMentor._id)
      .populate('mentorId', 'name email role')
      .populate('missionId', 'code title');

    return NextResponse.json({
      message: 'Mentor assigned successfully',
      data: populatedMentor
    }, { status: 201 });

  } catch (error) {
    console.error('Error assigning mentor to mission:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
