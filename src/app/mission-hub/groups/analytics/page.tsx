"use client";

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  Target, 
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Award,
  Clock,
  CheckCircle,
  AlertCircle,
  UserCheck,
  UserX
} from 'lucide-react';

interface GroupAnalytics {
  totalGroups: number;
  activeGroups: number;
  totalStudents: number;
  totalMentors: number;
  averageGroupSize: number;
  capacityUtilization: number;
  groupTypes: {
    mentorship: number;
    study: number;
    project: number;
    collaborative: number;
  };
  statusDistribution: {
    active: number;
    inactive: number;
    full: number;
    recruiting: number;
  };
  recentActivity: Array<{
    _id: string;
    type: string;
    description: string;
    timestamp: string;
    groupName: string;
  }>;
  topPerformingGroups: Array<{
    _id: string;
    name: string;
    missionId: {
      code: string;
      title: string;
    };
    currentStudents: number;
    maxStudents: number;
    mentors: number;
    status: string;
    capacityPercentage: number;
  }>;
  missionBreakdown: Array<{
    missionId: {
      _id: string;
      code: string;
      title: string;
    };
    groupCount: number;
    studentCount: number;
    mentorCount: number;
  }>;
}

export default function GroupAnalyticsPage() {
  const [analytics, setAnalytics] = useState<GroupAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v2/analytics?timeRange=${timeRange}&type=groups`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setAnalytics(data.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-xs text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-sm font-medium text-gray-900 mb-2">No Analytics Data</h3>
        <p className="text-xs text-gray-600">Analytics data is not available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Group Analytics</h1>
          <p className="text-xs text-gray-600 mt-1">Insights and performance metrics for mentorship groups</p>
        </div>
        
        {/* Time Range Selector */}
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-3 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">{analytics.totalGroups}</div>
              <div className="text-xs text-gray-600">Total Groups</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserCheck className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">{analytics.activeGroups}</div>
              <div className="text-xs text-gray-600">Active Groups</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Target className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">{analytics.totalStudents}</div>
              <div className="text-xs text-gray-600">Total Students</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Award className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">{analytics.totalMentors}</div>
              <div className="text-xs text-gray-600">Total Mentors</div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Performance Metrics</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Average Group Size</span>
              <span className="text-sm font-semibold text-gray-900">{analytics.averageGroupSize.toFixed(1)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Capacity Utilization</span>
              <span className="text-sm font-semibold text-gray-900">{analytics.capacityUtilization.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all"
                style={{ width: `${analytics.capacityUtilization}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Group Types Distribution</h3>
          <div className="space-y-2">
            {Object.entries(analytics.groupTypes).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-xs text-gray-600 capitalize">{type}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-purple-600 h-1.5 rounded-full"
                      style={{ width: `${(count / analytics.totalGroups) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-medium text-gray-900 w-6 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status Distribution */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Status Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(analytics.statusDistribution).map(([status, count]) => (
            <div key={status} className="text-center">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-2 ${
                status === 'active' ? 'bg-green-100' :
                status === 'inactive' ? 'bg-gray-100' :
                status === 'full' ? 'bg-blue-100' :
                'bg-yellow-100'
              }`}>
                {status === 'active' ? <CheckCircle className="h-6 w-6 text-green-600" /> :
                 status === 'inactive' ? <UserX className="h-6 w-6 text-gray-600" /> :
                 status === 'full' ? <Users className="h-6 w-6 text-blue-600" /> :
                 <AlertCircle className="h-6 w-6 text-yellow-600" />}
              </div>
              <div className="text-lg font-semibold text-gray-900">{count}</div>
              <div className="text-xs text-gray-600 capitalize">{status}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Performing Groups */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Top Performing Groups</h3>
        <div className="space-y-3">
          {analytics.topPerformingGroups.slice(0, 5).map((group, index) => (
            <div key={group._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-6 h-6 bg-purple-100 rounded-full">
                  <span className="text-xs font-semibold text-purple-600">{index + 1}</span>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-900">{group.name}</div>
                  <div className="text-xs text-gray-500">{group.missionId.code}</div>
                </div>
              </div>
              <div className="flex items-center space-x-4 text-xs">
                <div className="text-center">
                  <div className="font-semibold text-gray-900">{group.currentStudents}</div>
                  <div className="text-gray-500">Students</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900">{group.mentors}</div>
                  <div className="text-gray-500">Mentors</div>
                </div>
                <div className="text-center">
                  <div className={`font-semibold ${
                    group.capacityPercentage >= 90 ? 'text-red-600' :
                    group.capacityPercentage >= 70 ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {group.capacityPercentage}%
                  </div>
                  <div className="text-gray-500">Capacity</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mission Breakdown */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Mission Breakdown</h3>
        <div className="space-y-3">
          {analytics.missionBreakdown.map((mission) => (
            <div key={mission.missionId._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div>
                <div className="text-xs font-medium text-gray-900">{mission.missionId.code}</div>
                <div className="text-xs text-gray-500">{mission.missionId.title}</div>
              </div>
              <div className="flex items-center space-x-4 text-xs">
                <div className="text-center">
                  <div className="font-semibold text-gray-900">{mission.groupCount}</div>
                  <div className="text-gray-500">Groups</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900">{mission.studentCount}</div>
                  <div className="text-gray-500">Students</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900">{mission.mentorCount}</div>
                  <div className="text-gray-500">Mentors</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent Activity</h3>
        <div className="space-y-3">
          {analytics.recentActivity.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-4">No recent activity</p>
          ) : (
            analytics.recentActivity.map((activity) => (
              <div key={activity._id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                <div className="p-1 bg-blue-100 rounded">
                  <Activity className="h-3 w-3 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-900">{activity.description}</div>
                  <div className="text-xs text-gray-500">{activity.groupName}</div>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(activity.timestamp).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
