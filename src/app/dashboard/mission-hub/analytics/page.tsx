"use client";

import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Users, Target, Calendar, Award, Clock, CheckCircle } from "lucide-react";

interface AnalyticsData {
  totalMissions: number;
  activeMissions: number;
  completedMissions: number;
  totalStudents: number;
  totalMentors: number;
  avgCompletionRate: number;
  avgStudentProgress: number;
  missionTrends: {
    month: string;
    started: number;
    completed: number;
  }[];
  topPerformingMissions: {
    name: string;
    progress: number;
    students: number;
    completionRate: number;
  }[];
  studentProgressDistribution: {
    range: string;
    count: number;
    percentage: number;
  }[];
}

export default function MissionHubAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with actual API call
    // For now, using mock data
    setAnalytics({
      totalMissions: 24,
      activeMissions: 18,
      completedMissions: 6,
      totalStudents: 156,
      totalMentors: 24,
      avgCompletionRate: 78.5,
      avgStudentProgress: 67.3,
      missionTrends: [
        { month: 'Jan', started: 5, completed: 2 },
        { month: 'Feb', started: 8, completed: 3 },
        { month: 'Mar', started: 12, completed: 5 },
        { month: 'Apr', started: 15, completed: 7 },
        { month: 'May', started: 18, completed: 9 },
        { month: 'Jun', started: 24, completed: 12 }
      ],
      topPerformingMissions: [
        { name: 'Web Development Fundamentals', progress: 95, students: 25, completionRate: 88 },
        { name: 'Data Science Basics', progress: 87, students: 18, completionRate: 82 },
        { name: 'Mobile App Development', progress: 79, students: 22, completionRate: 75 },
        { name: 'Cloud Computing', progress: 72, students: 15, completionRate: 68 }
      ],
      studentProgressDistribution: [
        { range: '0-20%', count: 15, percentage: 9.6 },
        { range: '21-40%', count: 28, percentage: 17.9 },
        { range: '41-60%', count: 45, percentage: 28.8 },
        { range: '61-80%', count: 38, percentage: 24.4 },
        { range: '81-100%', count: 30, percentage: 19.2 }
      ]
    });
    setLoading(false);
  }, []);

  if (loading || !analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mission Hub Analytics</h1>
          <p className="text-gray-600">Comprehensive insights into mission performance and student progress</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Calendar className="h-4 w-4" />
          <span>Last updated: {new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Missions</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalMissions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Missions</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.activeMissions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalStudents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Award className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.avgCompletionRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mission Status Distribution */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Mission Status Distribution</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-700">Active Missions</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{analytics.activeMissions}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-700">Completed Missions</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{analytics.completedMissions}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-700">Draft Missions</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{analytics.totalMissions - analytics.activeMissions - analytics.completedMissions}</span>
            </div>
          </div>
        </div>

        {/* Student Progress Overview */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Progress Overview</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Average Progress</span>
              <span className="text-sm font-medium text-gray-900">{analytics.avgStudentProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${analytics.avgStudentProgress}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500">
              Based on {analytics.totalStudents} active students
            </div>
          </div>
        </div>
      </div>

      {/* Top Performing Missions */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Missions</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mission Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Students
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completion Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics.topPerformingMissions.map((mission, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{mission.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-1 mr-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${mission.progress}%` }}
                          ></div>
                        </div>
                      </div>
                      <span className="text-sm text-gray-900">{mission.progress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {mission.students}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      {mission.completionRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Progress Distribution */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Progress Distribution</h3>
        <div className="space-y-4">
          {analytics.studentProgressDistribution.map((range, index) => (
            <div key={index} className="flex items-center">
              <div className="w-24 text-sm text-gray-700">{range.range}</div>
              <div className="flex-1 mx-4">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${range.percentage}%` }}
                  ></div>
                </div>
              </div>
              <div className="w-16 text-right text-sm text-gray-900">
                {range.count} ({range.percentage}%)
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mission Trends Chart */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Mission Trends (Last 6 Months)</h3>
        <div className="grid grid-cols-6 gap-4">
          {analytics.missionTrends.map((trend, index) => (
            <div key={index} className="text-center">
              <div className="text-sm font-medium text-gray-900 mb-2">{trend.month}</div>
              <div className="space-y-2">
                <div className="flex items-center justify-center space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-xs text-gray-600">{trend.started}</span>
                </div>
                <div className="flex items-center justify-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-600">{trend.completed}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center space-x-4 mt-4 text-xs text-gray-500">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
            Started
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
            Completed
          </div>
        </div>
      </div>
    </div>
  );
}
