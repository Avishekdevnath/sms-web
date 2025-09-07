import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MissionStudentV2 } from '@/models/v2';
import { getAuthUserFromRequest } from '@/lib/rbac';

// ✅ V2 MISSION STUDENTS BULK UPDATE API ROUTE
// PUT: Bulk update multiple mission students

export async function PUT(request: NextRequest) {
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
    
    // Parse and validate request body
    const body = await request.json();
    const { studentIds, updates } = body;

    // Validate required fields
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid studentIds array' },
        { status: 400 }
      );
    }

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid updates object' },
        { status: 400 }
      );
    }

    // Validate update fields
    const allowedFields = ['status', 'progress', 'attendanceRate', 'notes', 'mentorshipGroupId'];
    const updateFields = Object.keys(updates);
    const invalidFields = updateFields.filter(field => !allowedFields.includes(field));
    
    if (invalidFields.length > 0) {
      return NextResponse.json(
        { success: false, error: `Invalid update fields: ${invalidFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (updates.status && !['active', 'inactive', 'completed', 'dropped', 'on-hold'].includes(updates.status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Validate progress if provided
    if (updates.progress !== undefined) {
      const progress = Number(updates.progress);
      if (isNaN(progress) || progress < 0 || progress > 100) {
        return NextResponse.json(
          { success: false, error: 'Progress must be a number between 0 and 100' },
          { status: 400 }
        );
      }
    }

    // Validate attendance rate if provided
    if (updates.attendanceRate !== undefined) {
      const attendanceRate = Number(updates.attendanceRate);
      if (isNaN(attendanceRate) || attendanceRate < 0 || attendanceRate > 100) {
        return NextResponse.json(
          { success: false, error: 'Attendance rate must be a number between 0 and 100' },
          { status: 400 }
        );
      }
    }

    // Check if all students exist
    const existingStudents = await MissionStudentV2.find({
      _id: { $in: studentIds }
    });

    if (existingStudents.length !== studentIds.length) {
      return NextResponse.json(
        { success: false, error: 'Some students not found' },
        { status: 404 }
      );
    }

    // Prepare update data with audit fields
    const updateData = {
      ...updates,
      updatedAt: new Date(),
      updatedBy: user._id
    };

    // Perform bulk update
    const result = await MissionStudentV2.updateMany(
      { _id: { $in: studentIds } },
      { $set: updateData }
    );

    // Fetch updated students for response
    const updatedStudents = await MissionStudentV2.find({
      _id: { $in: studentIds }
    }).populate('studentId', 'name email userId')
      .populate('mentorshipGroupId', 'name')
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        updatedStudents: updatedStudents
      },
      message: `Successfully updated ${result.modifiedCount} student(s)`
    }, { status: 200 });
    
  } catch (error: unknown) {
    console.error('V2 Mission Students Bulk Update Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to bulk update students';
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage
      },
      { status: 500 }
    );
  }
}
