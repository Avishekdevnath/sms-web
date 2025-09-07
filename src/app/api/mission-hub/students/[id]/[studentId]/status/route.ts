import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MissionStudentV2 } from '@/models/v2';
import { getAuthUserFromRequest, requireRoles } from '@/lib/rbac';

// PATCH: Update student status in mission hub
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; studentId: string }> }
) {
  try {
    await connectToDatabase();
    
    // Check authentication and authorization
    const me = await getAuthUserFromRequest(request);
    requireRoles(me, ["admin", "manager", "mentor"]);

    const { id: missionId, studentId } = await params;
    const body = await request.json();
    const { status } = body;

    console.log('Mission Hub PATCH: Updating student status:', { missionId, studentId, status });

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['active', 'deactive', 'irregular', 'completed', 'dropped', 'on-hold'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // First, try to find the student by studentId (User._id)
    let updated = await MissionStudentV2.findOneAndUpdate(
      { missionId, studentId },
      { status, lastActivity: new Date() },
      { new: true, populate: { path: 'studentId', select: 'name email studentId' } }
    );

    console.log('Mission Hub PATCH: Direct lookup result:', updated);

    // If not found, try to find by the populated studentId._id (in case of reference mismatch)
    if (!updated) {
      // Get all students in the mission and find by the actual user ID
      const allStudentsInMission = await MissionStudentV2.find({ missionId })
        .populate('studentId', 'name email studentId');
      
      console.log('Mission Hub PATCH: All students in mission:', allStudentsInMission.length);
      console.log('Mission Hub PATCH: Looking for studentId:', studentId);
      
      // Find student by the populated studentId._id
      const targetStudent = allStudentsInMission.find(s => s.studentId._id.toString() === studentId);
      console.log('Mission Hub PATCH: Found target student:', !!targetStudent);
      
      if (targetStudent) {
        updated = await MissionStudentV2.findByIdAndUpdate(
          targetStudent._id,
          { status, lastActivity: new Date() },
          { new: true, populate: { path: 'studentId', select: 'name email studentId' } }
        );
        console.log('Mission Hub PATCH: Updated via _id lookup:', !!updated);
      }
    }

    if (!updated) {
      console.log('Mission Hub PATCH: Student not found in mission');
      return NextResponse.json(
        { success: false, error: 'Student not found in this mission' },
        { status: 404 }
      );
    }

    console.log('Mission Hub PATCH: Successfully updated student status');

    return NextResponse.json({
      success: true,
      message: 'Student status updated successfully',
      student: {
        _id: updated._id,
        studentId: updated.studentId._id,
        missionId: updated.missionId,
        status: updated.status,
        progress: updated.progress,
        student: {
          _id: updated.studentId._id,
          name: updated.studentId.name,
          email: updated.studentId.email,
          studentId: updated.studentId.studentId
        }
      }
    });

  } catch (error) {
    console.error('Mission Hub PATCH: Error updating student status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update student status' },
      { status: 500 }
    );
  }
}
