import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MissionMentor, Mission } from '@/models';
import { getAuthUserFromRequest } from '@/lib/rbac';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission (admin, SRE, or dev)
    const userRole = user.role;
    if (!['admin', 'sre', 'dev'].includes(userRole)) {
      return NextResponse.json({ success: false, message: 'Insufficient permissions' }, { status: 403 });
    }

    const { 
      missionId, 
      studentIds, 
      fromMentorId, 
      toMentorId, 
      isPrimaryMentor = false 
    } = await request.json();

    if (!missionId || !studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Mission ID and student IDs array are required' 
      }, { status: 400 });
    }

    if (!fromMentorId || !toMentorId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Both from and to mentor IDs are required' 
      }, { status: 400 });
    }

    if (fromMentorId === toMentorId) {
      return NextResponse.json({ 
        success: false, 
        message: 'From and to mentor IDs must be different' 
      }, { status: 400 });
    }

    await connectToDatabase();

    // Verify both mentors exist in the mission
    const fromMentor = await MissionMentor.findOne({ missionId, mentorId: fromMentorId });
    const toMentor = await MissionMentor.findOne({ missionId, mentorId: toMentorId });

    if (!fromMentor || !toMentor) {
      return NextResponse.json({ 
        success: false, 
        message: 'One or both mentors not found in this mission' 
      }, { status: 404 });
    }

    // Check if toMentor has capacity
    const currentWorkload = toMentor.currentWorkload || 0;
    const maxStudents = toMentor.maxStudents || 10;
    
    if (currentWorkload + studentIds.length > maxStudents) {
      return NextResponse.json({ 
        success: false, 
        message: `Target mentor cannot accommodate ${studentIds.length} more students. Current: ${currentWorkload}/${maxStudents}` 
      }, { status: 400 });
    }

    // Verify students are currently assigned to fromMentor
    const studentsInFromMentor = fromMentor.assignedStudents || [];
    const validStudentIds = studentIds.filter(id => studentsInFromMentor.includes(id));
    
    if (validStudentIds.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'None of the specified students are currently assigned to the source mentor' 
      }, { status: 400 });
    }

    // Start transaction-like operations
    try {
      // Remove students from fromMentor
      await MissionMentor.updateOne(
        { _id: fromMentor._id },
        { 
          $pull: { assignedStudents: { $in: validStudentIds } },
          $inc: { currentWorkload: -validStudentIds.length }
        }
      );

      // Add students to toMentor
      await MissionMentor.updateOne(
        { _id: toMentor._id },
        { 
          $addToSet: { assignedStudents: { $each: validStudentIds } },
          $inc: { currentWorkload: validStudentIds.length }
        }
      );

      // Update Mission model - remove from old mentor, add to new mentor
      await Mission.updateOne(
        { _id: missionId },
        {
          $pull: {
            'students': {
              $or: [
                { primaryMentorId: fromMentorId },
                { mentors: fromMentorId }
              ]
            }
          }
        }
      );

      // Add students to new mentor in Mission model
      for (const studentId of validStudentIds) {
        await Mission.updateOne(
          { 
            _id: missionId,
            'students.studentId': studentId
          },
          {
            $addToSet: { 'students.$.mentors': toMentorId },
            ...(isPrimaryMentor && { $set: { 'students.$.primaryMentorId': toMentorId } })
          }
        );
      }

      // Refresh mentor data
      const updatedFromMentor = await MissionMentor.findById(fromMentor._id);
      const updatedToMentor = await MissionMentor.findById(toMentor._id);

      return NextResponse.json({
        success: true,
        message: `Successfully reassigned ${validStudentIds.length} students`,
        data: {
          reassignedStudents: validStudentIds.length,
          fromMentor: {
            id: fromMentor._id,
            currentWorkload: updatedFromMentor?.currentWorkload || 0
          },
          toMentor: {
            id: toMentor._id,
            currentWorkload: updatedToMentor?.currentWorkload || 0
          }
        }
      });

    } catch (error) {
      // If any operation fails, we should ideally rollback
      console.error('Error during reassignment:', error);
      return NextResponse.json({ 
        success: false, 
        message: 'Error during reassignment. Please try again.' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error reassigning students:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}
