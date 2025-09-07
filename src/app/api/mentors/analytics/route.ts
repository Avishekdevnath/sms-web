import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MissionMentor, Mission, MentorMeeting } from '@/models';
import { getAuthUserFromRequest } from '@/lib/rbac';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const missionId = searchParams.get('missionId');
    const mentorId = searchParams.get('mentorId');
    const timeRange = searchParams.get('timeRange') || '30'; // days

    if (!missionId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Mission ID is required' 
      }, { status: 400 });
    }

    await connectToDatabase();

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeRange));

    // Build query
    const query: any = { missionId };
    if (mentorId) {
      query.mentorId = mentorId;
    }

    // Get mentor data
    const mentors = await MissionMentor.find(query)
      .populate('mentorId', 'name email role')
      .lean();

    // Get mission data for student progress
    const mission = await Mission.findById(missionId)
      .select('students')
      .lean();

    // Get meeting data for the time range
    const meetingQuery: any = {
      missionId,
      scheduledAt: { $gte: startDate, $lte: endDate }
    };
    if (mentorId) {
      meetingQuery.mentorId = mentorId;
    }

    const meetings = await MentorMeeting.find(meetingQuery).lean();

    // Calculate analytics for each mentor
    const mentorAnalytics = mentors.map(mentor => {
      const mentorMeetings = meetings.filter(m => m.mentorId.toString() === mentor.mentorId._id.toString());
      
      // Student progress analysis
      const mentorStudents = mission?.students?.filter(s => 
        s.mentors?.includes(mentor.mentorId._id) || s.primaryMentorId?.toString() === mentor.mentorId._id.toString()
      ) || [];

      const totalStudents = mentorStudents.length;
      const activeStudents = mentorStudents.filter(s => s.status === 'active').length;
      const completedStudents = mentorStudents.filter(s => s.status === 'completed').length;
      const failedStudents = mentorStudents.filter(s => s.status === 'failed').length;

      // Calculate average progress
      const totalProgress = mentorStudents.reduce((sum, s) => sum + (s.progress || 0), 0);
      const averageProgress = totalStudents > 0 ? totalProgress / totalStudents : 0;

      // Meeting analysis
      const totalMeetings = mentorMeetings.length;
      const completedMeetings = mentorMeetings.filter(m => m.status === 'completed').length;
      const cancelledMeetings = mentorMeetings.filter(m => m.status === 'cancelled').length;
      const noShowMeetings = mentorMeetings.filter(m => m.status === 'no-show').length;

      // Calculate meeting success rate
      const meetingSuccessRate = totalMeetings > 0 ? (completedMeetings / totalMeetings) * 100 : 0;

      // Workload efficiency
      const workloadEfficiency = mentor.maxStudents > 0 ? 
        (mentor.currentWorkload / mentor.maxStudents) * 100 : 0;

      // Response time analysis (if meeting data includes creation/scheduling times)
      const responseTimes = mentorMeetings
        .filter(m => m.createdAt && m.scheduledAt)
        .map(m => {
          const created = new Date(m.createdAt);
          const scheduled = new Date(m.scheduledAt);
          return Math.abs(scheduled.getTime() - created.getTime()) / (1000 * 60 * 60); // hours
        });

      const averageResponseTime = responseTimes.length > 0 ? 
        responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length : 0;

      return {
        mentorId: mentor.mentorId._id,
        mentorName: mentor.mentorId.name,
        mentorEmail: mentor.mentorId.email,
        role: mentor.role,
        status: mentor.status,
        
        // Student metrics
        totalStudents,
        activeStudents,
        completedStudents,
        failedStudents,
        averageProgress: Math.round(averageProgress * 100) / 100,
        studentSuccessRate: totalStudents > 0 ? (completedStudents / totalStudents) * 100 : 0,
        
        // Meeting metrics
        totalMeetings,
        completedMeetings,
        cancelledMeetings,
        noShowMeetings,
        meetingSuccessRate: Math.round(meetingSuccessRate * 100) / 100,
        averageResponseTime: Math.round(averageResponseTime * 100) / 100,
        
        // Workload metrics
        currentWorkload: mentor.currentWorkload,
        maxStudents: mentor.maxStudents,
        workloadEfficiency: Math.round(workloadEfficiency * 100) / 100,
        workloadStatus: mentor.status,
        
        // Specialization
        specialization: mentor.specialization || [],
        
        // Performance score (weighted average)
        performanceScore: calculatePerformanceScore({
          studentSuccessRate,
          meetingSuccessRate,
          workloadEfficiency,
          averageProgress: averageProgress * 100
        })
      };
    });

    // Calculate overall mission statistics
    const overallStats = {
      totalMentors: mentorAnalytics.length,
      averageStudentSuccessRate: mentorAnalytics.length > 0 ? 
        mentorAnalytics.reduce((sum, m) => sum + m.studentSuccessRate, 0) / mentorAnalytics.length : 0,
      averageMeetingSuccessRate: mentorAnalytics.length > 0 ? 
        mentorAnalytics.reduce((sum, m) => sum + m.meetingSuccessRate, 0) / mentorAnalytics.length : 0,
      averagePerformanceScore: mentorAnalytics.length > 0 ? 
        mentorAnalytics.reduce((sum, m) => sum + m.performanceScore, 0) / mentorAnalytics.length : 0,
      totalStudents: mentorAnalytics.reduce((sum, m) => sum + m.totalStudents, 0),
      totalMeetings: mentorAnalytics.reduce((sum, m) => sum + m.totalMeetings, 0)
    };

    // Top performers
    const topPerformers = [...mentorAnalytics]
      .sort((a, b) => b.performanceScore - a.performanceScore)
      .slice(0, 5);

    // Mentors needing attention (low performance or overloaded)
    const mentorsNeedingAttention = mentorAnalytics.filter(m => 
      m.performanceScore < 60 || m.workloadStatus === 'overloaded'
    );

    return NextResponse.json({
      success: true,
      data: {
        mentorAnalytics,
        overallStats: {
          ...overallStats,
          averageStudentSuccessRate: Math.round(overallStats.averageStudentSuccessRate * 100) / 100,
          averageMeetingSuccessRate: Math.round(overallStats.averageMeetingSuccessRate * 100) / 100,
          averagePerformanceScore: Math.round(overallStats.averagePerformanceScore * 100) / 100
        },
        topPerformers,
        mentorsNeedingAttention,
        timeRange: parseInt(timeRange),
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error generating mentor analytics:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}

function calculatePerformanceScore(metrics: {
  studentSuccessRate: number;
  meetingSuccessRate: number;
  workloadEfficiency: number;
  averageProgress: number;
}): number {
  // Weighted scoring system
  const weights = {
    studentSuccess: 0.4,    // 40% - most important
    meetingSuccess: 0.3,    // 30% - important for engagement
    workloadEfficiency: 0.2, // 20% - efficiency indicator
    progress: 0.1           // 10% - progress tracking
  };

  const score = 
    (metrics.studentSuccessRate * weights.studentSuccess) +
    (metrics.meetingSuccessRate * weights.meetingSuccess) +
    (Math.min(metrics.workloadEfficiency, 100) * weights.workloadEfficiency) +
    (metrics.averageProgress * weights.progress);

  return Math.round(score * 100) / 100;
}
