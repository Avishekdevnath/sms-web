"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, UserPlus, UserCheck, UserX, Target, ArrowRight, BookOpen, TrendingUp } from 'lucide-react';
import { useAppSelector } from '@/hooks/useAppSelector';
import { selectSelectedMission } from '@/store/missionHubSlice';

interface Mission {
  _id: string;
  code: string;
  title: string;
  status: string;
  batch: {
    code: string;
    title: string;
  } | null;
  maxStudents: number;
  students?: string[];
  studentCount?: number;
}

export default function StudentsPage() {
  // Use Redux store instead of local state
  const selectedMission = useAppSelector(selectSelectedMission);
  const [loading, setLoading] = useState(false);

  // Transform Redux mission data to match the expected interface
  const mission: Mission | null = selectedMission ? {
    _id: selectedMission._id,
    code: selectedMission.code,
    title: selectedMission.title,
    status: selectedMission.status,
    batch: selectedMission.batchId ? {
      code: selectedMission.batchId.code,
      title: selectedMission.batchId.name
    } : null,
    maxStudents: selectedMission.maxStudents || 0,
    students: [],
    studentCount: selectedMission.totalStudents || 0
  } : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="text-center py-12">
        <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Mission Selected</h3>
        <p className="text-gray-600">Please select a mission from the sidebar to manage students.</p>
        <div className="mt-4">
          <Link 
            href="/dashboard/admin/missions/create" 
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Create Mission
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
        </div>
      </div>

      {/* Mission Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{mission.studentCount || 0}</div>
            <div className="text-sm text-gray-600">Students Assigned</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{mission.maxStudents === 0 ? '∞' : mission.maxStudents}</div>
            <div className="text-sm text-gray-600">Maximum Capacity</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {mission.maxStudents > 0 
                ? Math.round(((mission.studentCount || 0) / mission.maxStudents) * 100)
                : '∞'
              }%
            </div>
            <div className="text-sm text-gray-600">Capacity Used</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          href="/mission-hub/students/add"
          className="group p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <UserPlus className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Add Students</h3>
              <p className="text-sm text-gray-500">Enroll new students to this mission</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 ml-auto mt-4 transition-colors" />
        </Link>

        <Link
          href="/mission-hub/students/manage"
          className="group p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <UserCheck className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Manage Students</h3>
              <p className="text-sm text-gray-500">Update status and track progress</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 ml-auto mt-4 transition-colors" />
        </Link>

        <Link
          href="/mission-hub/students/deactivated"
          className="group p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-red-100 rounded-lg">
              <UserX className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Deactivated Students</h3>
              <p className="text-sm text-gray-500">View and reactivate inactive students</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 ml-auto mt-4 transition-colors" />
        </Link>
      </div>
    </div>
  );
}
