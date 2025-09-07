import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MissionMentorV2, MentorshipGroupV2 } from '@/models/v2';
import { getAuthUserFromRequest } from '@/lib/rbac';

// ✅ V2 AVAILABLE MISSION MENTORS API ROUTE
// GET: List mission mentors who are NOT already assigned to any group
// Used specifically for the Create Group page

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const missionId = searchParams.get('missionId');
    
    if (!missionId) {
      return NextResponse.json(
        { success: false, error: 'Mission ID is required' },
        { status: 400 }
      );
    }
    
    // Get all mentors assigned to groups in this mission
    const assignedMentorIds = await MentorshipGroupV2.find(
      { missionId },
      { mentors: 1 }
    ).lean();
    
    // Extract all mentor IDs that are already assigned to groups
    const assignedIds = assignedMentorIds.flatMap(group => group.mentors);
    
    // Find mentors in this mission who are NOT assigned to any group
    const availableMentors = await MissionMentorV2.find({
      missionId,
      status: 'active',
      mentorId: { $nin: assignedIds } // Exclude mentors already in groups
    })
    .populate('mentorId', 'name email role')
    .select('mentorId status role specialization maxStudents currentStudents')
    .lean();
    
    return NextResponse.json({
      success: true,
      data: availableMentors,
      count: availableMentors.length
    });
    
  } catch (error: unknown) {
    console.error('Available Mission Mentors GET Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch available mentors';
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage 
      },
      { status: 500 }
    );
  }
}
