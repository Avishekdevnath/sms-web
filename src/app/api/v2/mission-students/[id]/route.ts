import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MissionStudentV2 } from '@/models/v2';
import { getAuthUserFromRequest } from '@/lib/rbac';

// ✅ V2 MISSION STUDENT BY ID API ROUTE
// GET: Get single mission student
// PUT: Update mission student
// DELETE: Remove mission student

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Student ID is required' },
        { status: 400 }
      );
    }
    
    const missionStudent = await MissionStudentV2.findById(id)
      .populate('studentId', 'name email studentId')
      .populate('missionId', 'title code status')
      .populate('batchId', 'name code')
      .populate('mentorshipGroupId', 'name status')
      .lean();
    
    if (!missionStudent) {
      return NextResponse.json(
        { success: false, error: 'Mission student not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: missionStudent
    });
    
  } catch (error: unknown) {
    console.error('V2 Mission Student GET Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch mission student';
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
    const body = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Student ID is required' },
        { status: 400 }
      );
    }
    
    // Find the mission student
    const missionStudent = await MissionStudentV2.findById(id);
    if (!missionStudent) {
      return NextResponse.json(
        { success: false, error: 'Mission student not found' },
        { status: 404 }
      );
    }
    
    // Validate update fields
    const allowedFields = ['status', 'progress', 'attendanceRate', 'notes', 'mentorshipGroupId', 'isRegular'];
    const updateFields = Object.keys(body);
    const invalidFields = updateFields.filter(field => !allowedFields.includes(field));
    
    if (invalidFields.length > 0) {
      return NextResponse.json(
        { success: false, error: `Invalid update fields: ${invalidFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (body.status && !['active', 'inactive', 'completed', 'dropped', 'on-hold'].includes(body.status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Validate progress if provided
    if (body.progress !== undefined) {
      const progress = Number(body.progress);
      if (isNaN(progress) || progress < 0 || progress > 100) {
        return NextResponse.json(
          { success: false, error: 'Progress must be a number between 0 and 100' },
          { status: 400 }
        );
      }
    }

    // Validate attendance rate if provided
    if (body.attendanceRate !== undefined) {
      const attendanceRate = Number(body.attendanceRate);
      if (isNaN(attendanceRate) || attendanceRate < 0 || attendanceRate > 100) {
        return NextResponse.json(
          { success: false, error: 'Attendance rate must be a number between 0 and 100' },
          { status: 400 }
        );
      }
    }
    
    // Update the mission student
    const updatedMissionStudent = await MissionStudentV2.findByIdAndUpdate(
      id,
      {
        ...body,
        updatedAt: new Date(),
        updatedBy: user._id
      },
      { new: true }
    ).populate('studentId', 'name email studentId')
     .populate('missionId', 'title code status')
     .populate('batchId', 'name code')
     .populate('mentorshipGroupId', 'name status');
    
    return NextResponse.json({
      success: true,
      data: updatedMissionStudent,
      message: 'Mission student updated successfully'
    });
    
  } catch (error: unknown) {
    console.error('V2 Mission Student PUT Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update mission student';
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
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Student ID is required' },
        { status: 400 }
      );
    }
    
    // Find and delete the mission student
    const missionStudent = await MissionStudentV2.findByIdAndDelete(id);
    
    if (!missionStudent) {
      return NextResponse.json(
        { success: false, error: 'Mission student not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Mission student removed successfully'
    });
    
  } catch (error: unknown) {
    console.error('V2 Mission Student DELETE Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete mission student';
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage
      },
      { status: 500 }
    );
  }
}
