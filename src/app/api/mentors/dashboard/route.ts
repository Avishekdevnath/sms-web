import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MissionMentor } from '@/models/MissionMentor';
import { Mission } from '@/models/Mission';
import { MentorshipGroup } from '@/models/MentorshipGroup';
import { MentorMeeting } from '@/models/MentorMeeting';
import { getAuthUserFromRequest } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const me = await getAuthUserFromRequest(request);
    if (!me) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a mentor
    if (me.role !== 'mentor') {
      return NextResponse.json({ error: 'Access denied. Mentor role required.' }, { status: 403 });
    }

    const mentorId = me._id;

    await connectToDatabase();

    // Get all mission assignments for this mentor
    const missionAssignments = await MissionMentor.find({ 
      mentorId,
      status: { $ne: 'inactive' }
    })
    .populate('missionId', 'code title status startDate endDate')
    .populate('assignedStudents', 'name email studentId profilePicture')
    .sort({ role: 1, currentWorkload: -1 });

    // Get mentorship groups where this mentor is involved
    const mentorshipGroups = await MentorshipGroup.find({
      'mentors.mentorId': mentorId,
      status: 'active'
    })
    .populate('missionId', 'code title status')
    .populate('mentors.mentorId', 'name email role')
    .populate('students', 'name email studentId profilePicture');

    // Get upcoming meetings for this mentor
    const upcomingMeetings = await MentorMeeting.find({
      mentorId,
      meetingDate: { $gte: new Date() },
      status: { $in: ['scheduled', 'in-progress'] }
    })
    .populate('studentIds', 'name email studentId')
    .populate('batchId', 'name')
    .sort({ meetingDate: 1 })
    .limit(10);

    // Calculate statistics
    const totalStudents = missionAssignments.reduce((sum, ma) => sum + ma.currentWorkload, 0);
    const totalMissions = missionAssignments.length;
    const totalGroups = mentorshipGroups.length;
    const upcomingMeetingsCount = upcomingMeetings.length;

    // Get workload distribution
    const workloadDistribution = missionAssignments.map(ma => ({
      missionCode: ma.missionId.code,
      missionTitle: ma.missionId.title,
      role: ma.role,
      currentWorkload: ma.currentWorkload,
      maxStudents: ma.maxStudents,
      workloadPercentage: ma.workloadPercentage,
      status: ma.status
    }));

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentMeetings = await MentorMeeting.find({
      mentorId,
      meetingDate: { $gte: sevenDaysAgo },
      status: 'completed'
    })
    .populate('studentIds', 'name email studentId')
    .populate('batchId', 'name')
    .sort({ meetingDate: -1 })
    .limit(5);

    // Get students needing attention (no recent meetings)
    const studentsNeedingAttention = [];
    for (const assignment of missionAssignments) {
      for (const student of assignment.assignedStudents) {
        const lastMeeting = await MentorMeeting.findOne({
          mentorId,
          studentIds: student._id,
          status: 'completed'
        }).sort({ meetingDate: -1 });

        if (!lastMeeting || lastMeeting.meetingDate < sevenDaysAgo) {
          studentsNeedingAttention.push({
            studentId: student._id,
            name: student.name,
            email: student.email,
            studentId: student.studentId,
            missionCode: assignment.missionId.code,
            daysSinceLastMeeting: lastMeeting 
              ? Math.floor((Date.now() - lastMeeting.meetingDate.getTime()) / (1000 * 60 * 60 * 24))
              : null
          });
        }
      }
    }

    // Sort students by urgency (those without meetings first, then by days since last meeting)
    studentsNeedingAttention.sort((a, b) => {
      if (a.daysSinceLastMeeting === null && b.daysSinceLastMeeting !== null) return -1;
      if (a.daysSinceLastMeeting !== null && b.daysSinceLastMeeting === null) return 1;
      if (a.daysSinceLastMeeting === null && b.daysSinceLastMeeting === null) return 0;
      return (b.daysSinceLastMeeting || 0) - (a.daysSinceLastMeeting || 0);
    });

    return NextResponse.json({
      message: 'Mentor dashboard data retrieved successfully',
      data: {
        overview: {
          totalStudents,
          totalMissions,
          totalGroups,
          upcomingMeetingsCount
        },
        missionAssignments,
        mentorshipGroups,
        upcomingMeetings,
        workloadDistribution,
        recentActivity: {
          meetings: recentMeetings,
          studentsNeedingAttention: studentsNeedingAttention.slice(0, 10) // Top 10 urgent cases
        }
      }
    });

  } catch (error) {
    console.error('Error retrieving mentor dashboard:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
