"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Target, Users, UserCheck, BarChart3, Plus, TrendingUp, Clock, CheckCircle,
  BookOpen, Users2, Activity, Star, Zap, ArrowRight
} from "lucide-react";
import { useAppSelector } from "@/hooks/useAppSelector";
import { selectSelectedMission } from "@/store/missionHubSlice";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export default function MissionHubDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Redux hooks
  const selectedMission = useAppSelector(selectSelectedMission);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      setLoading(true);
      
      // Fetch user data
      const userResponse = await fetch('/api/auth/me');
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser(userData.user);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Mission Hub...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Unable to load user data</p>
      </div>
    );
  }

  const isStudent = user.role === "student";
  const canManageMissions = ["admin", "sre", "mentor"].includes(user.role);

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome back, {user.name}! 👋
        </h1>
        <p className="text-gray-600">
          You're logged in as a <span className="font-semibold capitalize">{user.role}</span>
        </p>
        
        {/* Mission Context - Shows selected mission from sidebar */}
        {selectedMission && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Active Mission:</h3>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-800">{selectedMission.code}</div>
                <div className="text-sm text-gray-600">{selectedMission.title}</div>
              </div>
              <div className="text-right">
                <span className={`
                  capitalize px-2 py-1 rounded text-xs font-medium
                  ${selectedMission.status === 'active' ? 'bg-green-100 text-green-800' : 
                    selectedMission.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                    selectedMission.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'}
                `}>
                  {selectedMission.status}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {canManageMissions && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-gray-600" />
              Quick Actions
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link
                href="/dashboard/admin/missions"
                className="group p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Target className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Manage Missions</h3>
                    <p className="text-sm text-gray-500">Create and manage learning missions</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 ml-auto mt-2 transition-colors" />
              </Link>

              <Link
                href="/mission-hub/students"
                className="group p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Users className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Student Management</h3>
                    <p className="text-sm text-gray-500">Assign and track student progress</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 ml-auto mt-2 transition-colors" />
              </Link>

              <Link
                href="/mission-hub/mentors"
                className="group p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <UserCheck className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Mentor Assignment</h3>
                    <p className="text-sm text-gray-500">Manage mentor-student relationships</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 ml-auto mt-2 transition-colors" />
              </Link>

              <Link
                href="/mission-hub/groups"
                className="group p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Users2 className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Mentorship Groups</h3>
                    <p className="text-sm text-gray-500">Manage group formations and meetings</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 ml-auto mt-2 transition-colors" />
              </Link>

              <Link
                href="/mission-hub/analytics"
                className="group p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Analytics</h3>
                    <p className="text-sm text-gray-500">View reports and insights</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 ml-auto mt-2 transition-colors" />
              </Link>

              <Link
                href="/dashboard/admin/missions/create"
                className="group p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Plus className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Create Mission</h3>
                    <p className="text-sm text-gray-500">Start a new learning mission</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 ml-auto mt-2 transition-colors" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Student View */}
      {isStudent && selectedMission && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Star className="w-5 h-5 mr-2 text-gray-600" />
              Your Mission Progress
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <h3 className="font-medium text-gray-900">{selectedMission.title}</h3>
                  <p className="text-sm text-gray-500">Mission {selectedMission.code}</p>
                  {selectedMission.batchId && (
                    <p className="text-sm text-gray-500">Batch: {selectedMission.batchId.code}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-600">75%</div>
                  <div className="text-sm text-gray-500">Complete</div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <Clock className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                  <div className="text-sm text-gray-600">Time Remaining</div>
                  <div className="text-lg font-semibold text-gray-900">12 days</div>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <CheckCircle className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                  <div className="text-sm text-gray-600">Completed Tasks</div>
                  <div className="text-lg font-semibold text-gray-900">6/8</div>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <TrendingUp className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                  <div className="text-sm text-gray-600">Current Streak</div>
                  <div className="text-lg font-semibold text-gray-900">5 days</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
