"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, Users, Target, Calendar, BookOpen } from "lucide-react";

interface Mission {
  _id: string;
  code: string;
  title: string;
  description?: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  batchId?: {
    _id: string;
    code: string;
    title: string;
  };
  students: Array<{
    studentId: {
      _id: string;
      name: string;
      email: string;
    };
    status: string;
    progress: number;
  }>;
  courses: Array<{
    courseOfferingId: {
      _id: string;
      courseId: {
        title: string;
        code: string;
      };
    };
    weight: number;
  }>;
  startDate?: string;
  endDate?: string;
  maxStudents?: number;
  requirements?: string[];
  rewards?: string[];
  createdAt: string;
}

export default function MissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [mission, setMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchMission(params.id as string);
    }
  }, [params.id]);

  const fetchMission = async (missionId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/missions/${missionId}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMission(data.data);
        } else {
          setError('Failed to load mission data');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error?.message || 'Failed to load mission');
      }
    } catch (error) {
      console.error('Error fetching mission:', error);
      setError('Failed to load mission');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'archived': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading mission...</p>
        </div>
      </div>
    );
  }

  if (error || !mission) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/admin/missions"
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Missions
          </Link>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800">Error</h2>
          <p className="text-red-600">{error || 'Mission not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/admin/missions"
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Missions
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{mission.title}</h1>
            <p className="mt-2 text-gray-600">Mission Code: {mission.code}</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Link
            href={`/dashboard/admin/missions/${mission._id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Mission
          </Link>
          <Link
            href={`/dashboard/admin/missions/${mission._id}/students`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Users className="w-4 h-4 mr-2" />
            Manage Students
          </Link>
        </div>
      </div>

      {/* Mission Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Status</p>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(mission.status)}`}>
                {mission.status.charAt(0).toUpperCase() + mission.status.slice(1)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Students</p>
              <p className="text-2xl font-bold text-gray-900">{mission.students.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Courses</p>
              <p className="text-2xl font-bold text-gray-900">{mission.courses.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Created</p>
              <p className="text-sm font-medium text-gray-900">{formatDate(mission.createdAt)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mission Details */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Mission Details</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <p className="mt-1 text-sm text-gray-900">
                {mission.description || 'No description provided'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Batch</label>
              <p className="mt-1 text-sm text-gray-900">
                {mission.batchId ? `${mission.batchId.code} - ${mission.batchId.title}` : 'No batch assigned'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <p className="mt-1 text-sm text-gray-900">
                  {mission.startDate ? formatDate(mission.startDate) : 'Not set'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <p className="mt-1 text-sm text-gray-900">
                  {mission.endDate ? formatDate(mission.endDate) : 'Not set'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Max Students</label>
              <p className="mt-1 text-sm text-gray-900">
                {mission.maxStudents || 'No limit'}
              </p>
            </div>
          </div>
        </div>

        {/* Requirements & Rewards */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Requirements & Rewards</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Requirements</label>
              {mission.requirements && mission.requirements.length > 0 ? (
                <ul className="mt-1 space-y-1">
                  {mission.requirements.map((req, index) => (
                    <li key={index} className="text-sm text-gray-900 flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      {req}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-sm text-gray-500">No requirements specified</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Rewards</label>
              {mission.rewards && mission.rewards.length > 0 ? (
                <ul className="mt-1 space-y-1">
                  {mission.rewards.map((reward, index) => (
                    <li key={index} className="text-sm text-gray-900 flex items-start">
                      <span className="text-green-600 mr-2">•</span>
                      {reward}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-sm text-gray-500">No rewards specified</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Courses */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Courses</h2>
        
        {mission.courses.length > 0 ? (
          <div className="space-y-3">
            {mission.courses.map((course, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">
                    {course.courseOfferingId.courseId.code} - {course.courseOfferingId.courseId.title}
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  Weight: {course.weight}%
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No courses assigned to this mission</p>
        )}
      </div>

      {/* Students */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Enrolled Students</h2>
        
        {mission.students.length > 0 ? (
          <div className="space-y-3">
            {mission.students.map((student, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{student.studentId.name}</p>
                  <p className="text-sm text-gray-500">{student.studentId.email}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    student.status === 'active' ? 'bg-green-100 text-green-800' :
                    student.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                  </span>
                  <p className="text-sm text-gray-500 mt-1">Progress: {student.progress}%</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No students enrolled in this mission</p>
        )}
      </div>
    </div>
  );
}
