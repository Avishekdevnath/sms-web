import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MissionMentor } from '@/models/MissionMentor';
import { Mission } from '@/models/Mission';
import { User } from '@/models/User';
import { getAuthUserFromRequest } from '@/lib/rbac';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission (admin, sre, dev)
    if (!['admin', 'sre', 'developer'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { missionId, mentorId, studentIds, assignmentType = 'direct' } = body;

    // Validate required fields
    if (!missionId || !mentorId || !studentIds || !Array.isArray(studentIds)) {
      return NextResponse.json({ 
        error: 'Missing required fields: missionId, mentorId, studentIds (array)' 
      }, { status: 400 });
    }

    if (studentIds.length === 0) {
      return NextResponse.json({ 
        error: 'At least one student ID is required' 
      }, { status: 400 });
    }

    await connectToDatabase();

    // Check if mission exists
    const mission = await Mission.findById(missionId);
    if (!mission) {
      return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
    }

    // Check if mentor is assigned to this mission
    const missionMentor = await MissionMentor.findOne({ 
      missionId, 
      mentorId 
    });

    if (!missionMentor) {
      return NextResponse.json({ 
        error: 'Mentor is not assigned to this mission' 
      }, { status: 404 });
    }

    // Check if mentor has capacity
    const availableCapacity = missionMentor.maxStudents - missionMentor.currentWorkload;
    if (studentIds.length > availableCapacity) {
      return NextResponse.json({ 
        error: `Mentor can only accept ${availableCapacity} more students. Requested: ${studentIds.length}` 
      }, { status: 400 });
    }

    // Validate that all students exist and are part of the mission
    const students = await User.find({ 
      _id: { $in: studentIds },
      role: 'student'
    });

    if (students.length !== studentIds.length) {
      return NextResponse.json({ 
        error: 'Some students not found or invalid role' 
      }, { status: 404 });
    }

    // Check if students are already in the mission
    const missionStudentIds = mission.students.map(s => s.studentId.toString());
    const invalidStudents = studentIds.filter(id => !missionStudentIds.includes(id));
    
    if (invalidStudents.length > 0) {
      return NextResponse.json({ 
        error: `Students not enrolled in mission: ${invalidStudents.join(', ')}` 
      }, { status: 400 });
    }

    // Check for existing assignments to prevent duplicates
    const existingAssignments = await MissionMentor.find({
      missionId,
      assignedStudents: { $in: studentIds }
    });

    const duplicateStudents = existingAssignments.flatMap(ma => 
      ma.assignedStudents.filter(id => studentIds.includes(id.toString()))
    );

    if (duplicateStudents.length > 0) {
      return NextResponse.json({ 
        error: `Students already assigned to mentors: ${[...new Set(duplicateStudents)].join(', ')}` 
      }, { status: 409 });
    }

    // Assign students to mentor
    await MissionMentor.findByIdAndUpdate(missionMentor._id, {
      $push: { assignedStudents: { $each: studentIds } },
      $inc: { currentWorkload: studentIds.length }
    });

    // Update mission students with mentor assignment
    for (const studentId of studentIds) {
      await Mission.findByIdAndUpdate(missionId, {
        $addToSet: { 
          'students.$[student].mentors': mentorId 
        }
      }, {
        arrayFilters: [{ 'student.studentId': studentId }]
      });

      // Set as primary mentor if this is the first assignment
      const studentInMission = mission.students.find(s => s.studentId.toString() === studentId);
      if (studentInMission && (!studentInMission.mentors || studentInMission.mentors.length === 0)) {
        await Mission.findByIdAndUpdate(missionId, {
          $set: { 
            'students.$[student].primaryMentorId': mentorId 
          }
        }, {
          arrayFilters: [{ 'student.studentId': studentId }]
        });
      }
    }

    // Get updated mentor data
    const updatedMentor = await MissionMentor.findById(missionMentor._id)
      .populate('mentorId', 'name email role')
      .populate('assignedStudents', 'name email studentId');

    return NextResponse.json({
      message: `Successfully assigned ${studentIds.length} students to mentor`,
      data: {
        mentor: updatedMentor,
        assignedStudents: students.map(s => ({
          id: s._id,
          name: s.name,
          email: s.email,
          studentId: s.studentId
        }))
      }
    });

  } catch (error) {
    console.error('Error assigning students to mentor:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
