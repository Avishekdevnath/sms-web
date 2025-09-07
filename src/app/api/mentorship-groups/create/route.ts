import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MentorshipGroup } from '@/models/MentorshipGroup';
import { Mission } from '@/models/Mission';
import { MissionMentor } from '@/models/MissionMentor';
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
    const { 
      missionId, 
      groupName, 
      mentors, 
      students, 
      meetingSchedule, 
      description, 
      maxStudents 
    } = body;

    // Validate required fields
    if (!missionId || !groupName || !mentors || !Array.isArray(mentors)) {
      return NextResponse.json({ 
        error: 'Missing required fields: missionId, groupName, mentors (array)' 
      }, { status: 400 });
    }

    if (mentors.length === 0) {
      return NextResponse.json({ 
        error: 'At least one mentor is required' 
      }, { status: 400 });
    }

    // Validate mentors structure
    for (const mentor of mentors) {
      if (!mentor.mentorId || !mentor.role) {
        return NextResponse.json({ 
          error: 'Each mentor must have mentorId and role' 
        }, { status: 400 });
      }
      
      if (!['primary', 'secondary', 'moderator'].includes(mentor.role)) {
        return NextResponse.json({ 
          error: 'Invalid mentor role. Must be primary, secondary, or moderator' 
        }, { status: 400 });
      }
    }

    // Validate meeting schedule if provided
    if (meetingSchedule && Array.isArray(meetingSchedule)) {
      for (const schedule of meetingSchedule) {
        if (typeof schedule.dayOfWeek !== 'number' || schedule.dayOfWeek < 0 || schedule.dayOfWeek > 6) {
          return NextResponse.json({ 
            error: 'Invalid dayOfWeek. Must be 0-6 (Sunday-Saturday)' 
          }, { status: 400 });
        }
        
        if (!schedule.time || !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(schedule.time)) {
          return NextResponse.json({ 
            error: 'Invalid time format. Must be HH:MM' 
          }, { status: 400 });
        }
        
        if (typeof schedule.duration !== 'number' || schedule.duration < 15 || schedule.duration > 480) {
          return NextResponse.json({ 
            error: 'Invalid duration. Must be 15-480 minutes' 
          }, { status: 400 });
        }
      }
    }

    await connectToDatabase();

    // Check if mission exists
    const mission = await Mission.findById(missionId);
    if (!mission) {
      return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
    }

    // Validate that all mentors exist and are assigned to this mission
    const mentorIds = mentors.map(m => m.mentorId);
    const missionMentors = await MissionMentor.find({
      missionId,
      mentorId: { $in: mentorIds }
    });

    if (missionMentors.length !== mentorIds.length) {
      return NextResponse.json({ 
        error: 'Some mentors are not assigned to this mission' 
      }, { status: 400 });
    }

    // Validate that all mentors have mentor role
    const mentorUsers = await User.find({
      _id: { $in: mentorIds },
      role: 'mentor'
    });

    if (mentorUsers.length !== mentorIds.length) {
      return NextResponse.json({ 
        error: 'Some users are not mentors' 
      }, { status: 400 });
    }

    // Validate students if provided
    if (students && Array.isArray(students) && students.length > 0) {
      // Check if students are enrolled in the mission
      const missionStudentIds = mission.students.map(s => s.studentId.toString());
      const invalidStudents = students.filter(id => !missionStudentIds.includes(id));
      
      if (invalidStudents.length > 0) {
        return NextResponse.json({ 
          error: `Students not enrolled in mission: ${invalidStudents.join(', ')}` 
        }, { status: 400 });
      }

      // Check if students are already in other groups
      const existingGroups = await MentorshipGroup.find({
        missionId,
        status: 'active',
        students: { $in: students }
      });

      if (existingGroups.length > 0) {
        return NextResponse.json({ 
          error: 'Some students are already assigned to other mentorship groups' 
        }, { status: 409 });
      }
    }

    // Check if group name is unique for this mission
    const existingGroup = await MentorshipGroup.findOne({
      missionId,
      groupName,
      status: 'active'
    });

    if (existingGroup) {
      return NextResponse.json({ 
        error: 'A group with this name already exists in this mission' 
      }, { status: 409 });
    }

    // Create the mentorship group
    const mentorshipGroup = new MentorshipGroup({
      missionId,
      groupName,
      mentors,
      students: students || [],
      meetingSchedule: meetingSchedule || [],
      description,
      maxStudents,
      currentStudentCount: students ? students.length : 0
    });

    await mentorshipGroup.save();

    // Update mission with the new group
    await Mission.findByIdAndUpdate(missionId, {
      $push: { mentorshipGroups: mentorshipGroup._id }
    });

    // Update mission students with group assignment
    if (students && students.length > 0) {
      for (const studentId of students) {
        await Mission.findByIdAndUpdate(missionId, {
          $set: { 
            'students.$[student].mentorshipGroupId': mentorshipGroup._id 
          }
        }, {
          arrayFilters: [{ 'student.studentId': studentId }]
        });
      }
    }

    // Populate the created group for response
    const populatedGroup = await MentorshipGroup.findById(mentorshipGroup._id)
      .populate('mentors.mentorId', 'name email role')
      .populate('students', 'name email studentId')
      .populate('missionId', 'code title');

    return NextResponse.json({
      message: 'Mentorship group created successfully',
      data: populatedGroup
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating mentorship group:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
