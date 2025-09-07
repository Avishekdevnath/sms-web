import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MissionMentor } from '@/models/MissionMentor';
import { getAuthUserFromRequest } from '@/lib/rbac';

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

    // Update status
    mentor.status = status;
    
    // If setting to inactive, ensure no students are assigned
    if (status === 'inactive' && mentor.currentWorkload > 0) {
      return NextResponse.json({ 
        error: 'Cannot deactivate mentor with assigned students' 
      }, { status: 400 });
    }

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
