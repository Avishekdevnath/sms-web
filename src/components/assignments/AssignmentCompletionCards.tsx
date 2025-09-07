"use client";

import { useState, useEffect } from "react";
import { 
  CheckCircle, 
  Clock, 
  Users, 
  TrendingUp, 
  BarChart3,
  Calendar,
  Mail,
  Target,
  Award,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from "lucide-react";
import Link from "next/link";

interface AssignmentCompletionStats {
  totalAssignments: number;
  publishedAssignments: number;
  totalCompletions: number;
  totalStudents: number;
  averageCompletionRate: number;
  recentCompletions: number;
  completionTrend: 'up' | 'down' | 'stable';
  topPerformingAssignments: Array<{
    _id: string;
    title: string;
    completionRate: number;
    totalCompletions: number;
  }>;
  recentActivity: Array<{
    _id: string;
    assignmentTitle: string;
    studentName: string;
    completedAt: string;
  }>;
}

interface AssignmentCompletionCardsProps {
  missionId?: string;
  courseOfferingId?: string;
  timeRange?: '7d' | '30d' | '90d' | 'all';
  showTrends?: boolean;
  showRecentActivity?: boolean;
  showTopPerformers?: boolean;
}

export default function AssignmentCompletionCards({
  missionId,
  courseOfferingId,
  timeRange = '30d',
  showTrends = true,
  showRecentActivity = true,
  showTopPerformers = true
}: AssignmentCompletionCardsProps) {
  const [stats, setStats] = useState<AssignmentCompletionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, [missionId, courseOfferingId, timeRange]);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (missionId) params.append('missionId', missionId);
      if (courseOfferingId) params.append('courseOfferingId', courseOfferingId);
      if (timeRange) params.append('timeRange', timeRange);
      
      const response = await fetch(`/api/assignments/completion-stats?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setStats(data.data);
      } else {
        setError(data.error?.message || 'Failed to fetch completion stats');
      }
    } catch (error) {
      console.error('Error fetching completion stats:', error);
      setError('Failed to fetch completion stats');
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <ArrowUpRight className="h-4 w-4 text-green-600" />;
      case 'down':
        return <ArrowDownRight className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="border rounded-lg p-6 bg-white animate-pulse">
            <div className="flex items-center">
              <div className="p-2 bg-gray-200 rounded-lg w-12 h-12"></div>
              <div className="ml-4 flex-1">
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="border rounded-lg p-6 bg-white">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading stats</h3>
          <p className="mt-1 text-sm text-gray-500">{error || 'Failed to load completion statistics'}</p>
          <button
            onClick={fetchStats}
            className="mt-4 inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="border rounded-lg p-6 bg-white">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Assignments</p>
              <p className="text-2xl font-bold text-black">{stats.totalAssignments}</p>
              <p className="text-xs text-gray-500">{stats.publishedAssignments} published</p>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-6 bg-white">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Completions</p>
              <p className="text-2xl font-bold text-black">{stats.totalCompletions}</p>
              {showTrends && (
                <div className="flex items-center mt-1">
                  {getTrendIcon(stats.completionTrend)}
                  <span className={`text-xs ml-1 ${getTrendColor(stats.completionTrend)}`}>
                    {stats.completionTrend === 'up' ? 'Increasing' : 
                     stats.completionTrend === 'down' ? 'Decreasing' : 'Stable'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-6 bg-white">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Students</p>
              <p className="text-2xl font-bold text-black">{stats.totalStudents}</p>
              <p className="text-xs text-gray-500">
                {stats.totalStudents > 0 ? 
                  `${((stats.totalCompletions / stats.totalStudents) * 100).toFixed(1)}% completion rate` : 
                  'No students'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-6 bg-white">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Average Rate</p>
              <p className="text-2xl font-bold text-black">{stats.averageCompletionRate.toFixed(1)}%</p>
              <p className="text-xs text-gray-500">{stats.recentCompletions} recent</p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Assignments */}
        {showTopPerformers && stats.topPerformingAssignments.length > 0 && (
          <div className="border rounded-lg p-6 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Top Performing Assignments</h3>
              <Link
                href="/mission-hub/assignments"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {stats.topPerformingAssignments.slice(0, 5).map((assignment) => (
                <div key={assignment._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">{assignment.title}</h4>
                    <p className="text-xs text-gray-500">{assignment.totalCompletions} completions</p>
                  </div>
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-3">
                      <div 
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${assignment.completionRate}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {assignment.completionRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {showRecentActivity && stats.recentActivity.length > 0 && (
          <div className="border rounded-lg p-6 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              <Link
                href="/mission-hub/assignments"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {stats.recentActivity.slice(0, 5).map((activity) => (
                <div key={activity._id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-green-100 rounded-lg mr-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.studentName} completed
                    </p>
                    <p className="text-xs text-gray-500">{activity.assignmentTitle}</p>
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDate(activity.completedAt)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="border rounded-lg p-6 bg-white">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/mission-hub/assignments"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-black transition-colors"
          >
            <div className="p-2 bg-blue-100 rounded-lg mr-3">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900">View All Assignments</h4>
              <p className="text-xs text-gray-500">See detailed assignment statistics</p>
            </div>
          </Link>

          <Link
            href="/dashboard/admin/assignments"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-black transition-colors"
          >
            <div className="p-2 bg-green-100 rounded-lg mr-3">
              <Mail className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900">Submit Emails</h4>
              <p className="text-xs text-gray-500">Mark assignments as complete</p>
            </div>
          </Link>

          <Link
            href="/mission-hub/assignments/duplicates"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-black transition-colors"
          >
            <div className="p-2 bg-yellow-100 rounded-lg mr-3">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900">Manage Duplicates</h4>
              <p className="text-xs text-gray-500">Resolve duplicate email submissions</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
