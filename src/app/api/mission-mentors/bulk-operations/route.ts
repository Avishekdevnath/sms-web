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
      operation, 
      missionId, 
      mentorIds, 
      studentIds, 
      updateData,
      assignmentData 
    } = await request.json();

    if (!operation || !missionId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Operation and Mission ID are required' 
      }, { status: 400 });
    }

    await connectToDatabase();

    let result: any = {};

    switch (operation) {
      case 'bulk_update':
        result = await handleBulkUpdate(missionId, mentorIds, updateData);
        break;
      
      case 'bulk_assign_students':
        result = await handleBulkAssignStudents(missionId, mentorIds, studentIds, assignmentData);
        break;
      
      case 'bulk_reassign_students':
        result = await handleBulkReassignStudents(missionId, mentorIds, studentIds);
        break;
      
      case 'bulk_status_update':
        result = await handleBulkStatusUpdate(missionId, mentorIds, updateData.status);
        break;
      
      case 'bulk_capacity_update':
        result = await handleBulkCapacityUpdate(missionId, mentorIds, updateData.maxStudents);
        break;
      
      default:
        return NextResponse.json({ 
          success: false, 
          message: 'Invalid operation. Supported operations: bulk_update, bulk_assign_students, bulk_reassign_students, bulk_status_update, bulk_capacity_update' 
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Bulk operation '${operation}' completed successfully`,
      data: result
    });

  } catch (error) {
    console.error('Error in bulk operations:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}

async function handleBulkUpdate(missionId: string, mentorIds: string[], updateData: any) {
  if (!mentorIds || mentorIds.length === 0) {
    throw new Error('Mentor IDs are required for bulk update');
  }

  // Filter allowed fields
  const allowedFields = ['specialization', 'notes', 'role'];
  const filteredData: any = {};
  
  allowedFields.forEach(field => {
    if (updateData[field] !== undefined) {
      filteredData[field] = updateData[field];
    }
  });

  if (Object.keys(filteredData).length === 0) {
    throw new Error('No valid fields to update');
  }

  // Update multiple mentors
  const updateResult = await MissionMentor.updateMany(
    { 
      _id: { $in: mentorIds },
      missionId 
    },
    { $set: filteredData }
  );

  // Update Mission model if role changed
  if (filteredData.role) {
    await Mission.updateMany(
      { 
        _id: missionId,
        'mentors.mentorId': { $in: mentorIds }
      },
      {
        $set: {
          'mentors.$.role': filteredData.role
        }
      }
    );
  }

  return {
    updatedMentors: updateResult.modifiedCount,
    totalMentors: mentorIds.length
  };
}

async function handleBulkAssignStudents(missionId: string, mentorIds: string[], studentIds: string[], assignmentData: any) {
  if (!mentorIds || !studentIds || mentorIds.length === 0 || studentIds.length === 0) {
    throw new Error('Both mentor IDs and student IDs are required for bulk assignment');
  }

  const { isPrimaryMentor = false, distributeEvenly = true } = assignmentData || {};

  let assignmentResults: any[] = [];

  if (distributeEvenly) {
    // Distribute students evenly among mentors
    const studentsPerMentor = Math.ceil(studentIds.length / mentorIds.length);
    
    for (let i = 0; i < mentorIds.length; i++) {
      const startIndex = i * studentsPerMentor;
      const endIndex = Math.min(startIndex + studentsPerMentor, studentIds.length);
      const mentorStudentIds = studentIds.slice(startIndex, endIndex);
      
      if (mentorStudentIds.length > 0) {
        const result = await assignStudentsToMentor(missionId, mentorIds[i], mentorStudentIds, isPrimaryMentor);
        assignmentResults.push(result);
      }
    }
  } else {
    // Assign all students to all mentors (for group mentoring scenarios)
    for (const mentorId of mentorIds) {
      const result = await assignStudentsToMentor(missionId, mentorId, studentIds, isPrimaryMentor);
      assignmentResults.push(result);
    }
  }

  return {
    totalStudents: studentIds.length,
    totalMentors: mentorIds.length,
    assignmentResults
  };
}

async function handleBulkReassignStudents(missionId: string, mentorIds: string[], studentIds: string[]) {
  if (!mentorIds || !studentIds || mentorIds.length === 0 || studentIds.length === 0) {
    throw new Error('Both mentor IDs and student IDs are required for bulk reassignment');
  }

  // Get current assignments
  const currentAssignments = await MissionMentor.find({
    missionId,
    'assignedStudents': { $in: studentIds }
  });

  const reassignmentResults: any[] = [];

  for (const studentId of studentIds) {
    // Find current mentor
    const currentMentor = currentAssignments.find(m => 
      m.assignedStudents.includes(studentId)
    );

    if (currentMentor) {
      // Remove from current mentor
      await MissionMentor.updateOne(
        { _id: currentMentor._id },
        { 
          $pull: { assignedStudents: studentId },
          $inc: { currentWorkload: -1 }
        }
      );

      // Update Mission model
      await Mission.updateOne(
        { 
          _id: missionId,
          'students.studentId': studentId
        },
        {
          $pull: { 'students.$.mentors': currentMentor.mentorId },
          $unset: { 'students.$.primaryMentorId': '' }
        }
      );
    }

    // Assign to new mentors
    for (const mentorId of mentorIds) {
      const result = await assignStudentsToMentor(missionId, mentorId, [studentId], false);
      reassignmentResults.push(result);
    }
  }

  return {
    totalStudents: studentIds.length,
    totalMentors: mentorIds.length,
    reassignmentResults
  };
}

async function handleBulkStatusUpdate(missionId: string, mentorIds: string[], status: string) {
  if (!mentorIds || mentorIds.length === 0) {
    throw new Error('Mentor IDs are required for bulk status update');
  }

  if (!['active', 'inactive', 'overloaded'].includes(status)) {
    throw new Error('Invalid status. Must be active, inactive, or overloaded');
  }

  const updateResult = await MissionMentor.updateMany(
    { 
      _id: { $in: mentorIds },
      missionId 
    },
    { $set: { status } }
  );

  return {
    updatedMentors: updateResult.modifiedCount,
    totalMentors: mentorIds.length,
    newStatus: status
  };
}

async function handleBulkCapacityUpdate(missionId: string, mentorIds: string[], maxStudents: number) {
  if (!mentorIds || mentorIds.length === 0) {
    throw new Error('Mentor IDs are required for bulk capacity update');
  }

  if (typeof maxStudents !== 'number' || maxStudents < 1) {
    throw new Error('maxStudents must be a positive number');
  }

  const updateResult = await MissionMentor.updateMany(
    { 
      _id: { $in: mentorIds },
      missionId 
    },
    { $set: { maxStudents } }
  );

  return {
    updatedMentors: updateResult.modifiedCount,
    totalMentors: mentorIds.length,
    newMaxStudents: maxStudents
  };
}

async function assignStudentsToMentor(missionId: string, mentorId: string, studentIds: string[], isPrimaryMentor: boolean) {
  // Check mentor capacity
  const mentor = await MissionMentor.findOne({ missionId, mentorId });
  if (!mentor) {
    throw new Error(`Mentor ${mentorId} not found in mission`);
  }

  const currentWorkload = mentor.currentWorkload || 0;
  const maxStudents = mentor.maxStudents || 10;
  
  if (currentWorkload + studentIds.length > maxStudents) {
    throw new Error(`Mentor ${mentorId} cannot accommodate ${studentIds.length} more students. Current: ${currentWorkload}/${maxStudents}`);
  }

  // Add students to mentor
  await MissionMentor.updateOne(
    { _id: mentor._id },
    { 
      $addToSet: { assignedStudents: { $each: studentIds } },
      $inc: { currentWorkload: studentIds.length }
    }
  );

  // Update Mission model
  for (const studentId of studentIds) {
    await Mission.updateOne(
      { 
        _id: missionId,
        'students.studentId': studentId
      },
      {
        $addToSet: { 'students.$.mentors': mentorId },
        ...(isPrimaryMentor && { $set: { 'students.$.primaryMentorId': mentorId } })
      }
    );
  }

  return {
    mentorId,
    assignedStudents: studentIds.length,
    newWorkload: currentWorkload + studentIds.length
  };
}
