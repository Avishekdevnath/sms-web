import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MeetingAttendance, MentorMeeting, MissionMentor } from '@/models';
import { getAuthUserFromRequest } from '@/lib/rbac';

export async function POST(request: NextRequest) {
  try {
    const me = await getAuthUserFromRequest(request);
    if (!me) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission (admin, SRE, dev, or mentor)
    const userRole = me.role;
    if (!['admin', 'sre', 'dev', 'mentor'].includes(userRole)) {
      return NextResponse.json({ success: false, message: 'Insufficient permissions' }, { status: 403 });
    }

    const { 
      meetingId, 
      missionId, 
      mentorId, 
      studentId, 
      status, 
      joinTime, 
      leaveTime, 
      notes, 
      excusedReason 
    } = await request.json();

    if (!meetingId || !missionId || !mentorId || !studentId || !status) {
      return NextResponse.json({ 
        success: false, 
        message: 'Meeting ID, Mission ID, Mentor ID, Student ID, and Status are required' 
      }, { status: 400 });
    }

    // Validate status
    const validStatuses = ['attended', 'absent', 'late', 'excused', 'pending'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid status. Must be one of: attended, absent, late, excused, pending' 
      }, { status: 400 });
    }

    await connectToDatabase();

    // Verify the meeting exists and the user has access
    const meeting = await MentorMeeting.findById(meetingId);
    if (!meeting) {
      return NextResponse.json({ 
        success: false, 
        message: 'Meeting not found' 
      }, { status: 404 });
    }

    // Verify the mentor is assigned to this mission
    const missionMentor = await MissionMentor.findOne({ missionId, mentorId });
    if (!missionMentor) {
      return NextResponse.json({ 
        success: false, 
        message: 'Mentor not found in this mission' 
      }, { status: 404 });
    }

    // Check if attendance record already exists
    const existingAttendance = await MeetingAttendance.findOne({ meetingId, studentId });
    
    if (existingAttendance) {
      // Update existing record
      const updateData: any = { status };
      
      if (joinTime) updateData.joinTime = new Date(joinTime);
      if (leaveTime) updateData.leaveTime = new Date(leaveTime);
      if (notes !== undefined) updateData.notes = notes;
      if (excusedReason !== undefined) updateData.excusedReason = excusedReason;

      const updatedAttendance = await MeetingAttendance.findByIdAndUpdate(
        existingAttendance._id,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      return NextResponse.json({
        success: true,
        message: 'Attendance updated successfully',
        data: updatedAttendance
      });
    } else {
      // Create new attendance record
      const attendanceData = {
        meetingId,
        missionId,
        mentorId,
        studentId,
        status,
        notes,
        excusedReason
      };

      if (joinTime) attendanceData.joinTime = new Date(joinTime);
      if (leaveTime) attendanceData.leaveTime = new Date(leaveTime);

      const newAttendance = await MeetingAttendance.create(attendanceData);

      return NextResponse.json({
        success: true,
        message: 'Attendance recorded successfully',
        data: newAttendance
      });
    }

  } catch (error) {
    console.error('Error managing meeting attendance:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const me = await getAuthUserFromRequest(request);
    if (!me) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const meetingId = searchParams.get('meetingId');
    const missionId = searchParams.get('missionId');
    const mentorId = searchParams.get('mentorId');
    const studentId = searchParams.get('studentId');
    const status = searchParams.get('status');

    if (!meetingId && !missionId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Either meetingId or missionId is required' 
      }, { status: 400 });
    }

    await connectToDatabase();

    // Build query
    const query: any = {};
    if (meetingId) query.meetingId = meetingId;
    if (missionId) query.missionId = missionId;
    if (mentorId) query.mentorId = mentorId;
    if (studentId) query.studentId = studentId;
    if (status) query.status = status;

    // Get attendance records
    const attendanceRecords = await MeetingAttendance.find(query)
      .populate('meetingId', 'title scheduledAt duration')
      .populate('mentorId', 'name email')
      .populate('studentId', 'name email studentId')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: attendanceRecords
    });

  } catch (error) {
    console.error('Error fetching meeting attendance:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}
