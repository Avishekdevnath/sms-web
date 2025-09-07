"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BarChart3, Target, ArrowLeft, TrendingUp, Users, Clock, AlertTriangle, CheckCircle, XCircle, Calendar } from 'lucide-react';

interface Mission {
  _id: string;
  code: string;
  title: string;
  status: string;
  batch: {
    code: string;
    title: string;
  } | null;
}

interface MentorAnalytics {
  mentorId: string;
  mentorName: string;
  mentorEmail: string;
  role: string;
  status: string;
  totalStudents: number;
  activeStudents: number;
  completedStudents: number;
  failedStudents: number;
  averageProgress: number;
  studentSuccessRate: number;
  totalMeetings: number;
  completedMeetings: number;
  cancelledMeetings: number;
  noShowMeetings: number;
  meetingSuccessRate: number;
  averageResponseTime: number;
  currentWorkload: number;
  maxStudents: number;
  workloadEfficiency: number;
  workloadStatus: string;
  specialization: string[];
  performanceScore: number;
}

interface OverallStats {
  totalMentors: number;
  averageStudentSuccessRate: number;
  averageMeetingSuccessRate: number;
  averagePerformanceScore: number;
  totalStudents: number;
  totalMeetings: number;
}

export default function MentorAnalyticsPage() {
  const [mission, setMission] = useState<Mission | null>(null);
  const [mentorAnalytics, setMentorAnalytics] = useState<MentorAnalytics[]>([]);
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
  const [topPerformers, setTopPerformers] = useState<MentorAnalytics[]>([]);
  const [mentorsNeedingAttention, setMentorsNeedingAttention] = useState<MentorAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState(30);

  useEffect(() => {
    fetchMission();
  }, []);

  useEffect(() => {
    if (mission) {
      fetchAnalytics();
    }
  }, [mission, timeRange]);

  const fetchMission = async () => {
    try {
      const response = await fetch('/api/mission-hub/missions');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.missions?.length > 0) {
          setMission(data.data.missions[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch mission:', error);
      setError('Failed to fetch mission data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    if (!mission) return;
    
    try {
      const response = await fetch(`/api/v2/analytics?missionId=${mission._id}&timeRange=${timeRange}&type=mentors`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          // Transform V2 analytics data to match expected format
          const analyticsData = data.data;
          
          setMentorAnalytics(analyticsData.mentorAnalytics || []);
          setOverallStats(analyticsData.overallStats || {});
          setTopPerformers(analyticsData.topPerformers || []);
          setMentorsNeedingAttention(analyticsData.mentorsNeedingAttention || []);
        }
      } else {
        setError('Failed to fetch analytics data');
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setError('Failed to fetch analytics data');
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'primary':
        return 'bg-purple-100 text-purple-800';
      case 'secondary':
        return 'bg-blue-100 text-blue-800';
      case 'moderator':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="text-center py-12">
        <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Mission Selected</h3>
        <p className="text-gray-600">Please select a mission to view analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/mission-hub/mentors"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Mentors
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mentor Analytics</h1>
            <p className="text-gray-600 mt-1">Performance metrics for {mission.code} - {mission.title}</p>
          </div>
        </div>
        
        {/* Time Range Selector */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Time Range:</label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={180}>Last 6 months</option>
          </select>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <XCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Overall Statistics */}
      {overallStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Mentors</p>
                <p className="text-2xl font-bold text-gray-900">{overallStats.totalMentors}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">{overallStats.averageStudentSuccessRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-3">
              <Clock className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Meeting Success</p>
                <p className="text-2xl font-bold text-gray-900">{overallStats.averageMeetingSuccessRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Performance</p>
                <p className="text-2xl font-bold text-gray-900">{overallStats.averagePerformanceScore.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Performers */}
      {topPerformers.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Top Performers</h3>
            <p className="text-sm text-gray-600">Mentors with highest performance scores</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topPerformers.map((mentor, index) => (
                <div key={mentor.mentorId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-purple-600">#{index + 1}</span>
                      <h4 className="font-semibold text-gray-900">{mentor.mentorName}</h4>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(mentor.role)}`}>
                      {mentor.role}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Performance Score:</span>
                      <span className={`font-semibold ${getPerformanceColor(mentor.performanceScore)}`}>
                        {mentor.performanceScore.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Students:</span>
                      <span className="font-medium">{mentor.totalStudents}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Success Rate:</span>
                      <span className="font-medium">{mentor.studentSuccessRate.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mentors Needing Attention */}
      {mentorsNeedingAttention.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Mentors Needing Attention</h3>
            <p className="text-sm text-gray-600">Mentors with low performance or overloaded status</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {mentorsNeedingAttention.map((mentor) => (
                <div key={mentor.mentorId} className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <h4 className="font-semibold text-gray-900">{mentor.mentorName}</h4>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(mentor.role)}`}>
                        {mentor.role}
                      </span>
                    </div>
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getPerformanceBgColor(mentor.performanceScore)} ${getPerformanceColor(mentor.performanceScore)}`}>
                      {mentor.performanceScore.toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Performance Score: </span>
                      <span className="font-medium">{mentor.performanceScore.toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Workload: </span>
                      <span className="font-medium">{mentor.currentWorkload}/{mentor.maxStudents}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Status: </span>
                      <span className="font-medium capitalize">{mentor.workloadStatus}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Detailed Analytics Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Detailed Mentor Analytics</h3>
          <p className="text-sm text-gray-600">Comprehensive performance metrics for all mentors</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mentor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Success Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meetings</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Workload</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mentorAnalytics.map((mentor) => (
                <tr key={mentor.mentorId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{mentor.mentorName}</div>
                      <div className="text-sm text-gray-500">{mentor.mentorEmail}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(mentor.role)}`}>
                      {mentor.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{mentor.totalStudents}</div>
                    <div className="text-xs text-gray-500">
                      {mentor.activeStudents} active, {mentor.completedStudents} completed
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{mentor.studentSuccessRate.toFixed(1)}%</div>
                    <div className="text-xs text-gray-500">Avg: {mentor.averageProgress.toFixed(1)}%</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{mentor.totalMeetings}</div>
                    <div className="text-xs text-gray-500">{mentor.meetingSuccessRate.toFixed(1)}% success</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{mentor.currentWorkload}/{mentor.maxStudents}</div>
                    <div className="text-xs text-gray-500">{mentor.workloadEfficiency.toFixed(1)}% capacity</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getPerformanceBgColor(mentor.performanceScore)} ${getPerformanceColor(mentor.performanceScore)}`}>
                      {mentor.performanceScore.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}



