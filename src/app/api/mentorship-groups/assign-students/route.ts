import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MentorshipGroup } from '@/models/MentorshipGroup';
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
    const { groupId, studentIds } = body;

    // Validate required fields
    if (!groupId || !studentIds || !Array.isArray(studentIds)) {
      return NextResponse.json({ 
        error: 'Missing required fields: groupId, studentIds (array)' 
      }, { status: 400 });
    }

    if (studentIds.length === 0) {
      return NextResponse.json({ 
        error: 'At least one student ID is required' 
      }, { status: 400 });
    }

    await connectToDatabase();

    // Check if group exists
    const group = await MentorshipGroup.findById(groupId);
    if (!group) {
      return NextResponse.json({ error: 'Mentorship group not found' }, { status: 404 });
    }

    // Check if group is active
    if (group.status !== 'active') {
      return NextResponse.json({ error: 'Group is not active' }, { status: 400 });
    }

    // Check capacity if maxStudents is set
    if (group.maxStudents && (group.currentStudentCount + studentIds.length > group.maxStudents)) {
      return NextResponse.json({ 
        error: `Group can only accept ${group.maxStudents - group.currentStudentCount} more students. Requested: ${studentIds.length}` 
      }, { status: 400 });
    }

    // Validate that all students exist and have student role
    const students = await User.find({ 
      _id: { $in: studentIds },
      role: 'student'
    });

    if (students.length !== studentIds.length) {
      return NextResponse.json({ 
        error: 'Some students not found or invalid role' 
      }, { status: 404 });
    }

    // Check if students are already in other groups for this mission
    const existingGroups = await MentorshipGroup.find({
      missionId: group.missionId,
      status: 'active',
      students: { $in: studentIds }
    });

    const duplicateStudents = existingGroups.flatMap(g => 
      g.students.filter(id => studentIds.includes(id.toString()))
    );

    if (duplicateStudents.length > 0) {
      return NextResponse.json({ 
        error: `Students already in other groups: ${[...new Set(duplicateStudents)].join(', ')}` 
      }, { status: 409 });
    }

    // Add students to group
    await MentorshipGroup.findByIdAndUpdate(groupId, {
      $addToSet: { students: { $each: studentIds } }
    });

    // Update mission students with group assignment
    await Mission.findByIdAndUpdate(group.missionId, {
      $set: { 
        'students.$[student].mentorshipGroupId': groupId 
      }
    }, {
      arrayFilters: [{ 'student.studentId': { $in: studentIds } }]
    });

    // Get updated group data
    const updatedGroup = await MentorshipGroup.findById(groupId)
      .populate('mentors.mentorId', 'name email role')
      .populate('students', 'name email studentId');

    return NextResponse.json({
      success: true,
      message: `Successfully assigned ${studentIds.length} students to group`,
      data: {
        group: updatedGroup,
        assignedStudents: students.map(s => ({
          id: s._id,
          name: s.name,
          email: s.email,
          studentId: s.studentId
        }))
      }
    });

  } catch (error) {
    console.error('Error assigning students to group:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
