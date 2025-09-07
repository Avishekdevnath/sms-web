import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MissionV2, MissionStudentV2, MentorshipGroupV2 } from '@/models/v2';
import { Assignment } from '@/models';
import { StudentBatchMembership } from '@/models';

// GET: Get assignment progress for all students in a mission
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id: missionId } = await params;
    const { searchParams } = new URL(request.url);
    const debug = searchParams.get('debug');

    // Verify mission exists
    const mission = await MissionV2.findById(missionId);
    if (!mission) {
      return NextResponse.json(
        { success: false, error: 'Mission not found' },
        { status: 404 }
      );
    }

    // Get all assignments for this mission
    const assignments = await Assignment.find({ 
      courseOfferingId: { $exists: true }
    })
    .populate({
      path: 'courseOfferingId',
      select: 'title code courseId batchId semesterId',
      populate: [
        { path: 'courseId', select: 'title code' },
        { path: 'batchId', select: 'title code' },
        { path: 'semesterId', select: 'title number' }
      ]
    })
    .lean();

    // Filter assignments that match the mission's batch
    const missionAssignments = assignments.filter(assignment => {
      if (!assignment.courseOfferingId) return false;
      return assignment.courseOfferingId.batchId._id.toString() === mission.batchId.toString();
    });

    // Get all students from the mission's batch
    const batchStudents = await StudentBatchMembership.find({
      batchId: mission.batchId,
      status: 'approved'
    })
    .populate('studentId', 'name email studentId')
    .populate('batchId', 'code title')
    .lean();

    // Get mission students to mark which ones are enrolled
    const missionStudents = await MissionStudentV2.find({ missionId })
      .populate('studentId', 'name email studentId')
      .lean();

    // Get mentorship groups for this mission
    const mentorshipGroups = await MentorshipGroupV2.find({ missionId })
      .populate('students', 'name email')
      .lean();

    // Create student progress data
    const studentProgress = batchStudents.map(batchStudent => {
      const student = batchStudent.studentId;
      const missionStudent = missionStudents.find(ms => 
        ms.studentId._id.toString() === student._id.toString()
      );

      // Find which group this student belongs to
      const studentGroup = mentorshipGroups.find(group => 
        group.students.some(groupStudent => 
          groupStudent._id.toString() === student._id.toString()
        )
      );

      // Create assignment progress for this student
      const assignmentProgress = missionAssignments.map(assignment => {
        // Check if student has completed this assignment
        const completedEmail = assignment.completedEmails?.find(
          (email: any) => email.email === student.email || email.studentId === student._id
        );
        
        let status: 'completed' | 'pending' | 'overdue' | 'not_started' = 'not_started';
        if (completedEmail) {
          status = 'completed';
        } else if (assignment.publishedAt) {
          status = 'pending';
        }

        return {
          assignment: {
            _id: assignment._id,
            title: assignment.title,
            courseOfferingId: assignment.courseOfferingId,
            publishedAt: assignment.publishedAt,
            dueAt: assignment.dueAt,
            maxPoints: assignment.maxPoints
          },
          status,
          submittedAt: completedEmail?.addedAt,
          score: undefined
        };
      });

      return {
        student: {
          _id: student._id,
          name: student.name,
          email: student.email,
          studentId: student.studentId || `ST-${student._id.toString().slice(-4)}`,
          courseOfferingId: {
            _id: missionAssignments[0]?.courseOfferingId?._id || 'unknown',
            courseId: missionAssignments[0]?.courseOfferingId?.courseId || { _id: 'unknown', title: 'Unknown Course', code: 'UNK' },
            batchId: missionAssignments[0]?.courseOfferingId?.batchId || { _id: 'unknown', title: 'Unknown Batch', code: 'UNK' },
            semesterId: missionAssignments[0]?.courseOfferingId?.semesterId || { _id: 'unknown', title: 'Unknown Semester', number: 1 }
          }
        },
        assignments: assignmentProgress,
        isMissionEnrolled: !!missionStudent,
        missionStatus: missionStudent?.status || 'not_enrolled',
        missionProgress: missionStudent?.progress || 0,
        groupInfo: studentGroup ? {
          _id: studentGroup._id,
          name: studentGroup.name,
          description: studentGroup.description
        } : null
      };
    });

    // Calculate assignment statistics
    const assignmentStats = missionAssignments.map(assignment => {
      const completedCount = studentProgress.filter(sp => {
        const assignmentProgress = sp.assignments.find(ap => ap.assignment._id === assignment._id);
        return assignmentProgress?.status === 'completed';
      }).length;
      
      const pendingCount = studentProgress.filter(sp => {
        const assignmentProgress = sp.assignments.find(ap => ap.assignment._id === assignment._id);
        return assignmentProgress?.status === 'pending' || assignmentProgress?.status === 'not_started';
      }).length;

      return {
        assignmentId: assignment._id,
        title: assignment.title,
        courseCode: assignment.courseOfferingId?.courseId?.code || 'UNK',
        completedCount,
        pendingCount,
        totalStudents: studentProgress.length
      };
    });

    const response = {
      success: true,
      data: {
        mission: {
          _id: mission._id,
          title: mission.title,
          code: mission.code,
          batchId: mission.batchId
        },
        assignments: missionAssignments,
        studentProgress,
        assignmentStats,
        summary: {
          totalStudents: studentProgress.length,
          missionEnrolledStudents: studentProgress.filter(sp => sp.isMissionEnrolled).length,
          totalAssignments: missionAssignments.length,
          totalCompletions: assignmentStats.reduce((sum, stat) => sum + stat.completedCount, 0)
        }
      }
    };

    // Debug mode
    if (debug === 'true') {
      response.debug = {
        missionId: mission._id,
        batchId: mission.batchId,
        totalAssignments: assignments.length,
        missionAssignments: missionAssignments.length,
        batchStudents: batchStudents.length,
        missionStudents: missionStudents.length,
        studentProgress: studentProgress.length
      };
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching assignment progress:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assignment progress' },
      { status: 500 }
    );
  }
}
