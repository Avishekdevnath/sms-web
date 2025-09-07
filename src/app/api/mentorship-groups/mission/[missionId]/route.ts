import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MentorshipGroup } from '@/models/MentorshipGroup';
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

    // Get all mentorship groups for this mission
    const mentorshipGroups = await MentorshipGroup.find({ 
      missionId,
      status: { $ne: 'inactive' } // Only active groups
    })
    .populate('mentors.mentorId', 'name email role profilePicture')
    .populate('students', 'name email studentId')
    .sort({ createdAt: -1 }); // Sort by creation date, newest first

    return NextResponse.json({
      success: true,
      message: 'Mentorship groups retrieved successfully',
      data: mentorshipGroups
    });

  } catch (error) {
    console.error('Error retrieving mentorship groups:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
