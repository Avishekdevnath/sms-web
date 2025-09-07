import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MissionMentorV2, MissionV2 } from '@/models/v2';
import { getAuthUserFromRequest } from '@/lib/rbac';

// ✅ V2 MISSION MENTOR BY ID API
// GET: Get mission mentor by ID
// PUT: Update mission mentor
// DELETE: Remove mission mentor

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Mission mentor ID is required' },
        { status: 400 }
      );
    }

    // Find mission mentor with populated references
    const missionMentor = await MissionMentorV2.findById(id)
      .populate('mentorId', 'name email role profilePicture')
      .populate('batchId', 'name code')
      .populate('assignedGroups', 'name status studentCount')
      .lean();

    if (!missionMentor) {
      return NextResponse.json(
        { success: false, error: 'Mission mentor not found' },
        { status: 404 }
      );
    }

    // Manually populate mission data if missionId exists
    if (missionMentor.missionId) {
      const mission = await MissionV2.findById(missionMentor.missionId).lean();
      if (mission) {
        missionMentor.missionId = mission;
      }
    }

    return NextResponse.json({
      success: true,
      data: missionMentor
    });
    
  } catch (error: unknown) {
    console.error('V2 Mission Mentor GET Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch mission mentor';
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
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Mission mentor ID is required' },
        { status: 400 }
      );
    }

    // Find and update mission mentor
    const updatedMentor = await MissionMentorV2.findByIdAndUpdate(
      id,
      {
        ...body,
        updatedAt: new Date(),
        updatedBy: user._id
      },
      { new: true }
    )
    .populate('mentorId', 'name email role profilePicture')
    .populate('missionId', 'title code status')
    .populate('batchId', 'name code')
    .populate('assignedGroups', 'name status studentCount');

    if (!updatedMentor) {
      return NextResponse.json(
        { success: false, error: 'Mission mentor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedMentor,
      message: 'Mission mentor updated successfully'
    });
    
  } catch (error: unknown) {
    console.error('V2 Mission Mentor PUT Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update mission mentor';
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
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Mission mentor ID is required' },
        { status: 400 }
      );
    }

    // Find the mission mentor first to get references
    const missionMentor = await MissionMentorV2.findById(id);
    
    if (!missionMentor) {
      return NextResponse.json(
        { success: false, error: 'Mission mentor not found' },
        { status: 404 }
      );
    }

    // Delete the mission mentor record
    await MissionMentorV2.findByIdAndDelete(id);

    // Update the mission to remove this mentor from arrays
    try {
      const { MissionV2 } = await import('@/models/v2');
      const mission = await MissionV2.findById(missionMentor.missionId);
      if (mission) {
        await mission.removeMentor(missionMentor.mentorId);
        console.log(`✅ Removed mentor ${missionMentor.mentorId} from mission ${missionMentor.missionId}`);
      }
    } catch (missionUpdateError) {
      console.error('⚠️ Failed to update mission mentor arrays:', missionUpdateError);
      // Don't fail the request - mentor is already deleted
    }

    return NextResponse.json({
      success: true,
      message: 'Mission mentor removed successfully'
    });
    
  } catch (error: unknown) {
    console.error('V2 Mission Mentor DELETE Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete mission mentor';
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage
      },
      { status: 500 }
    );
  }
}
