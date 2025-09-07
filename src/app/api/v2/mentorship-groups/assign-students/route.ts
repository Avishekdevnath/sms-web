import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MentorshipGroupV2, MissionStudentV2 } from '@/models/v2';
import { getAuthUserFromRequest } from '@/lib/rbac';

// ✅ V2 MENTORSHIP GROUPS ASSIGN STUDENTS API
// POST: Assign students to a mentorship group

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Check authentication using the same method as V1 APIs
    const user = await getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has permission (admin, sre, dev)
    if (!['admin', 'sre', 'developer'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    const { groupId, studentIds } = body;

    // Validate required fields
    if (!groupId || !studentIds || !Array.isArray(studentIds)) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: groupId, studentIds' },
        { status: 400 }
      );
    }

    // Check if group exists
    const group = await MentorshipGroupV2.findById(groupId);

    if (!group) {
      return NextResponse.json(
        { success: false, error: 'Mentorship group not found' },
        { status: 404 }
      );
    }

    // Check if students exist in the same mission
    const missionStudents = await MissionStudentV2.find({
      _id: { $in: studentIds },
      missionId: group.missionId
    });

    if (missionStudents.length !== studentIds.length) {
      return NextResponse.json(
        { success: false, error: 'Some students not found in this mission' },
        { status: 404 }
      );
    }

    // Extract user IDs from mission students
    const userIds = missionStudents.map(ms => ms.studentId);

    // Check group capacity if specified
    if (group.maxStudents && group.maxStudents > 0) {
      const currentStudents = group.students?.length || 0;
      if (currentStudents + userIds.length > group.maxStudents) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Group capacity exceeded. Current: ${currentStudents}, Max: ${group.maxStudents}, Trying to add: ${userIds.length}` 
          },
          { status: 400 }
        );
      }
    }

    // Update group's assigned students (using user IDs)
    const updatedGroup = await MentorshipGroupV2.findByIdAndUpdate(
      groupId,
      {
        $addToSet: { students: { $each: userIds } }
      },
      { new: true }
    );

    // Update students' assigned group
    await MissionStudentV2.updateMany(
      { _id: { $in: studentIds } },
      {
        $set: {
          mentorshipGroupId: groupId,
          groupAssignedAt: new Date(),
          groupAssignedBy: user._id
        }
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        group: updatedGroup,
        assignedStudents: studentIds.length
      },
      message: `Successfully assigned ${studentIds.length} student(s) to group`
    }, { status: 200 });
    
  } catch (error: unknown) {
    console.error('V2 Mentorship Groups Assign Students Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to assign students to group';
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage
      },
      { status: 500 }
    );
  }
}
