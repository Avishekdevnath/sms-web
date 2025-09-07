import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthUserFromRequest } from '@/lib/rbac';
import { Mission } from '@/models/Mission';
import { StudentMission } from '@/models/StudentMission'; // Add StudentMission import
import { StudentBatchMembership } from '@/models/StudentBatchMembership'; // Add for batch validation
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/utils/apiHelpers';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ missionId: string }> }
) {
  try {
    await connectToDatabase();
    
    const me = await getAuthUserFromRequest(req);
    if (!me) {
      return createErrorResponse('Unauthorized', 401);
    }

    // Only admins, SREs, and mentors can assign students
    if (!['admin', 'sre', 'mentor'].includes(me.role)) {
      return createErrorResponse('Insufficient permissions', 403);
    }

    const { missionId } = await params;
    const { studentIds } = await req.json();

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return createErrorResponse('Student IDs are required', 400);
    }

    // Find the mission
    const mission = await Mission.findById(missionId);
    if (!mission) {
      return createErrorResponse('Mission not found', 404);
    }

    // Check if user has permission to modify this mission
    if (me.role !== 'admin' && me.role !== 'sre' && mission.createdBy.toString() !== me._id) {
      return createErrorResponse('Insufficient permissions to modify this mission', 403);
    }

    // Check current student count using StudentMission model
    const currentStudentCount = await StudentMission.countDocuments({
      missionId: missionId,
      status: { $ne: 'dropped' }
    });

    // Check if adding these students would exceed maxStudents limit
    const newStudentCount = currentStudentCount + studentIds.length;
    
    if (newStudentCount > mission.maxStudents) {
      return createErrorResponse(
        `Adding ${studentIds.length} students would exceed the maximum limit of ${mission.maxStudents} students. Current: ${currentStudentCount}`,
        400
      );
    }

    // Verify all students belong to the mission's batch
    const batchMemberships = await StudentBatchMembership.find({
      studentId: { $in: studentIds },
      batchId: mission.batchId,
      status: "approved"
    }).lean();

    const validStudentIds = batchMemberships.map(m => m.studentId.toString());
    const invalidStudentIds = studentIds.filter(id => !validStudentIds.includes(id));

    if (invalidStudentIds.length > 0) {
      return createErrorResponse(
        `Students ${invalidStudentIds.join(', ')} do not belong to this mission's batch`,
        400
      );
    }

    // Check for existing enrollments to avoid duplicates
    const existingStudentMissions = await StudentMission.find({
      missionId: missionId,
      studentId: { $in: studentIds }
    }).lean();

    const existingStudentIds = existingStudentMissions.map(sm => sm.studentId.toString());
    const newStudentIds = studentIds.filter(id => !existingStudentIds.includes(id));
    
    if (newStudentIds.length === 0) {
      return createSuccessResponse({ 
        message: 'All students are already enrolled in this mission',
        totalStudents: currentStudentCount
      });
    }

    // Create new StudentMission records for each student
    const newStudentMissions = newStudentIds.map(studentId => ({
      studentId: studentId,
      missionId: missionId,
      batchId: mission.batchId,
      mentorId: null,
      status: 'active',
      progress: 0,
      startedAt: new Date(),
      lastActivity: new Date(),
      courseProgress: []
    }));

    // Insert new StudentMission records
    await StudentMission.insertMany(newStudentMissions);

    // Get updated student count
    const updatedStudentCount = await StudentMission.countDocuments({
      missionId: missionId,
      status: { $ne: 'dropped' }
    });

    return createSuccessResponse(
      { 
        missionId: missionId,
        addedStudents: newStudentIds.length,
        totalStudents: updatedStudentCount
      },
      `Successfully enrolled ${newStudentIds.length} students in mission`
    );

  } catch (error) {
    return handleApiError(error);
  }
}
