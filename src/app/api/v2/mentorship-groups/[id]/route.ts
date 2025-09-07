import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MentorshipGroupV2, MissionV2, MissionStudentV2 } from '@/models/v2';
import { getAuthUserFromRequest } from '@/lib/rbac';

// ✅ V2 MENTORSHIP GROUP BY ID API ROUTE
// GET: Get single mentorship group
// PUT: Update mentorship group
// DELETE: Delete mentorship group

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Group ID is required' },
        { status: 400 }
      );
    }
    
    const group = await MentorshipGroupV2.findById(id)
      .populate('missionId', 'code title status')
      .populate('primaryMentorId', 'name email role')
      .populate('students', 'name email studentId')
      .populate('mentors', 'name email role')
      .lean();
    
    if (!group) {
      return NextResponse.json(
        { success: false, error: 'Mentorship group not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: group
    });
    
  } catch (error: unknown) {
    console.error('V2 Mentorship Group GET Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch mentorship group';
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    
    // Check authentication
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
    
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Group ID is required' },
        { status: 400 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    console.log('V2 Mentorship Group PUT - Raw body received:', JSON.stringify(body, null, 2));
    
    // Find the group
    const group = await MentorshipGroupV2.findById(id);
    if (!group) {
      return NextResponse.json(
        { success: false, error: 'Mentorship group not found' },
        { status: 404 }
      );
    }
    
    // Check if group name already exists in this mission (if name is being changed)
    if (body.name && body.name !== group.name) {
      const existingGroup = await MentorshipGroupV2.findOne({
        name: body.name,
        missionId: group.missionId,
        _id: { $ne: id }
      });
      
      if (existingGroup) {
        return NextResponse.json(
          { success: false, error: 'Group name already exists in this mission' },
          { status: 400 }
        );
      }
    }
    
    // Update the group
    const updateData: Record<string, unknown> = {};
    
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.primaryMentorId !== undefined) updateData.primaryMentorId = body.primaryMentorId;
    if (body.studentIds !== undefined) updateData.students = body.studentIds;
    if (body.mentorIds !== undefined) updateData.mentors = body.mentorIds;
    if (body.maxStudents !== undefined) updateData.maxStudents = body.maxStudents;
    if (body.groupType !== undefined) updateData.groupType = body.groupType;
    if (body.focusArea !== undefined) updateData.focusArea = body.focusArea || [];
    if (body.skillLevel !== undefined) updateData.skillLevel = body.skillLevel;
    if (body.status !== undefined) updateData.status = body.status;
    
    // Handle meeting schedule updates
    if (body.meetingSchedule !== undefined) {
      updateData.meetingSchedule = {
        ...group.meetingSchedule,
        ...body.meetingSchedule
      };
    }
    
    // Handle communication channel updates
    if (body.communicationChannel !== undefined) {
      updateData.communicationChannel = {
        ...group.communicationChannel,
        ...body.communicationChannel
      };
    }
    
    updateData.updatedBy = user._id;
    
    const updatedGroup = await MentorshipGroupV2.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('missionId', 'code title status')
      .populate('primaryMentorId', 'name email role')
      .populate('students', 'name email studentId')
      .populate('mentors', 'name email role');
    
    if (!updatedGroup) {
      return NextResponse.json(
        { success: false, error: 'Failed to update mentorship group' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: updatedGroup,
      message: 'Mentorship group updated successfully'
    });
    
  } catch (error: unknown) {
    console.error('V2 Mentorship Group PUT Error:', error);
    
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ValidationError') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed', 
          details: (error as { errors: unknown }).errors 
        },
        { status: 400 }
      );
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to update mentorship group';
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    
    // Check authentication
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
    
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Group ID is required' },
        { status: 400 }
      );
    }
    
    // Find the group
    const group = await MentorshipGroupV2.findById(id);
    if (!group) {
      return NextResponse.json(
        { success: false, error: 'Mentorship group not found' },
        { status: 404 }
      );
    }
    
    // If studentId is provided, remove specific student from group
    if (studentId) {
      // Remove student from group
      const updatedGroup = await MentorshipGroupV2.findByIdAndUpdate(
        id,
        { $pull: { students: studentId } },
        { new: true }
      );
      
      // Update student's group assignment
      await MissionStudentV2.updateMany(
        { studentId: studentId, missionId: group.missionId },
        {
          $unset: {
            mentorshipGroupId: 1,
            groupAssignedAt: 1,
            groupAssignedBy: 1
          }
        }
      );
      
      return NextResponse.json({
        success: true,
        data: updatedGroup,
        message: 'Student removed from group successfully'
      });
    }
    
    // Otherwise, delete the entire group
    // Remove group from mission
    await MissionV2.findByIdAndUpdate(
      group.missionId,
      { $pull: { groupIds: group._id } }
    );
    
    // Remove group assignment from all students
    await MissionStudentV2.updateMany(
      { mentorshipGroupId: group._id },
      {
        $unset: {
          mentorshipGroupId: 1,
          groupAssignedAt: 1,
          groupAssignedBy: 1
        }
      }
    );
    
    // Delete the group
    await MentorshipGroupV2.findByIdAndDelete(id);
    
    return NextResponse.json({
      success: true,
      message: 'Mentorship group deleted successfully'
    });
    
  } catch (error: unknown) {
    console.error('V2 Mentorship Group DELETE Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete mentorship group';
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage
      },
      { status: 500 }
    );
  }
}
