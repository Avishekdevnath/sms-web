import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MissionMentorV2 } from '@/models/v2';
import { getAuthUserFromRequest } from '@/lib/rbac';

// ✅ V2 MISSION MENTOR STATUS API
// PATCH: Update mission mentor status

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    
    const { id } = await params;
    const body = await request.json();
    const { status } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Mission mentor ID is required' },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['active', 'inactive', 'overloaded', 'unavailable'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status. Must be one of: active, inactive, overloaded, unavailable' },
        { status: 400 }
      );
    }

    // Find and update mission mentor status
    const updatedMentor = await MissionMentorV2.findByIdAndUpdate(
      id,
      {
        status,
        statusChangedAt: new Date(),
        statusChangedBy: user._id,
        updatedAt: new Date(),
        updatedBy: user._id
      },
      { new: true }
    )
    .populate('mentorId', 'name email role profilePicture')
    .populate('missionId', 'title code status')
    .populate('batchId', 'name code')
    .populate('assignedStudentIds', 'name email studentId progress lastActivity status');

    if (!updatedMentor) {
      return NextResponse.json(
        { success: false, error: 'Mission mentor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedMentor,
      message: `Mission mentor status updated to ${status}`
    });
    
  } catch (error: unknown) {
    console.error('V2 Mission Mentor Status PATCH Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update mission mentor status';
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage
      },
      { status: 500 }
    );
  }
}
