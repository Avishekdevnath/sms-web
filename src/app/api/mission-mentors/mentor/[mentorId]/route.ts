import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MissionMentor } from '@/models/MissionMentor';
import { Mission } from '@/models/Mission';
import { getAuthUserFromRequest } from '@/lib/rbac';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ mentorId: string }> }
) {
  try {
    const me = await getAuthUserFromRequest(request);
    if (!me) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { mentorId } = await params;
    if (!mentorId) {
      return NextResponse.json({ error: 'Mentor ID is required' }, { status: 400 });
    }

    await connectToDatabase();

    const mentor = await MissionMentor.findById(mentorId)
      .populate('mentorId', 'name email role profilePicture')
      .populate('assignedStudents', 'name email studentId')
      .populate('missionId', 'code title');

    if (!mentor) {
      return NextResponse.json({ error: 'Mentor not found' }, { status: 404 });
    }

    // Get student progress data
    const students = mentor.assignedStudents.map((student: any) => ({
      _id: student._id,
      name: student.name,
      email: student.email,
      studentId: student.studentId,
      progress: Math.floor(Math.random() * 100), // This should come from actual progress tracking
      lastActivity: new Date().toISOString(), // This should come from actual activity tracking
      status: 'active' // This should come from actual status tracking
    }));

    return NextResponse.json({
      message: 'Mentor retrieved successfully',
      data: {
        mentor,
        students
      }
    });

  } catch (error) {
    console.error('Error retrieving mentor:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ mentorId: string }> }
) {
  try {
    const me = await getAuthUserFromRequest(request);
    if (!me) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { mentorId } = await params;
    if (!mentorId) {
      return NextResponse.json({ error: 'Mentor ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { role, maxStudents, specialization, notes, status } = body;

    await connectToDatabase();

    const mentor = await MissionMentor.findById(mentorId);
    if (!mentor) {
      return NextResponse.json({ error: 'Mentor not found' }, { status: 404 });
    }

    // Update mentor fields
    mentor.role = role || mentor.role;
    mentor.maxStudents = maxStudents !== undefined ? maxStudents : mentor.maxStudents;
    mentor.specialization = specialization || mentor.specialization;
    mentor.notes = notes !== undefined ? notes : mentor.notes;
    mentor.status = status || mentor.status;

    // Auto-update status based on workload if maxStudents is set
    if (mentor.maxStudents > 0) {
      if (mentor.currentWorkload >= mentor.maxStudents) {
        mentor.status = 'overloaded';
      } else if (mentor.currentWorkload > 0) {
        mentor.status = 'active';
      }
    }

    await mentor.save();

    return NextResponse.json({
      message: 'Mentor updated successfully',
      data: { mentor }
    });

  } catch (error) {
    console.error('Error updating mentor:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ mentorId: string }> }
) {
  try {
    const me = await getAuthUserFromRequest(request);
    if (!me) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { mentorId } = await params;
    if (!mentorId) {
      return NextResponse.json({ error: 'Mentor ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { status } = body;

    if (!status || !['active', 'inactive'].includes(status)) {
      return NextResponse.json({ error: 'Valid status is required' }, { status: 400 });
    }

    await connectToDatabase();

    const mentor = await MissionMentor.findById(mentorId);
    if (!mentor) {
      return NextResponse.json({ error: 'Mentor not found' }, { status: 404 });
    }

    mentor.status = status;
    await mentor.save();

    return NextResponse.json({
      message: 'Mentor status updated successfully',
      data: { mentor }
    });

  } catch (error) {
    console.error('Error updating mentor status:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
