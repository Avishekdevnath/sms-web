"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Target, Users, Calendar, BookOpen } from 'lucide-react';
import Link from 'next/link';

interface Mission {
  _id: string;
  code: string;
  title: string;
  description: string;
  status: string;
  batch: {
    code: string;
    title: string;
  } | null;
  maxStudents: number;
  students: string[];
  startDate: string;
  endDate: string;
  requirements: string[];
  rewards: string[];
  courses: Array<{
    courseOfferingId: {
      _id: string;
      courseId: {
        title: string;
        code: string;
      };
    };
    weight: number;
    minProgress: number;
  }>;
}

export default function MissionViewPage() {
  const params = useParams();
  const router = useRouter();
  const missionId = params.missionId as string;
  
  const [mission, setMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (missionId) {
      fetchMission();
    }
  }, [missionId]);

  const fetchMission = async () => {
    try {
      const response = await fetch(`/api/mission-hub/missions/${missionId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.mission) {
          setMission(data.data.mission);
        }
      }
    } catch (error) {
      console.error('Failed to fetch mission:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-gray-200 rounded mb-6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Mission not found</h3>
            <p className="text-gray-500 mb-4">The mission you're looking for doesn't exist.</p>
            <Link
              href="/mission-hub/missions"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Missions
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/mission-hub/missions"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Missions
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{mission.title}</h1>
              <p className="text-lg text-gray-600 mt-1">{mission.code}</p>
            </div>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(mission.status)}`}>
              {mission.status}
            </span>
          </div>
        </div>

        {/* Mission Details */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Mission Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-600 mb-4">{mission.description}</p>
              {mission.batch && (
                <div className="flex items-center text-gray-600 mb-2">
                  <BookOpen className="h-4 w-4 mr-2" />
                  <span>Batch: {mission.batch.title} ({mission.batch.code})</span>
                </div>
              )}
              <div className="flex items-center text-gray-600 mb-2">
                <Users className="h-4 w-4 mr-2" />
                <span>Students: {mission.students.length}/{mission.maxStudents}</span>
              </div>
            </div>
            <div>
              {mission.startDate && (
                <div className="flex items-center text-gray-600 mb-2">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Start: {new Date(mission.startDate).toLocaleDateString()}</span>
                </div>
              )}
              {mission.endDate && (
                <div className="flex items-center text-gray-600 mb-2">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>End: {new Date(mission.endDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Requirements and Rewards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Requirements</h3>
            {mission.requirements.length > 0 ? (
              <ul className="space-y-2">
                {mission.requirements.map((req, index) => (
                  <li key={index} className="flex items-start">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span className="text-gray-600">{req}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No requirements specified</p>
            )}
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Rewards</h3>
            {mission.rewards.length > 0 ? (
              <ul className="space-y-2">
                {mission.rewards.map((reward, index) => (
                  <li key={index} className="flex items-start">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span className="text-gray-600">{reward}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No rewards specified</p>
            )}
          </div>
        </div>

        {/* Courses */}
        {mission.courses.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Required Courses</h3>
            <div className="space-y-3">
              {mission.courses.map((course, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{course.courseOfferingId.courseId.title}</h4>
                    <p className="text-sm text-gray-600">{course.courseOfferingId.courseId.code}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Weight: {course.weight}%</p>
                    <p className="text-sm text-gray-600">Min Progress: {course.minProgress}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3">
          <Link
            href={`/mission-hub/missions/${missionId}/students`}
            className="flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            <Users className="h-4 w-4 mr-2" />
            Manage Students
          </Link>
          <Link
            href={`/mission-hub/missions/${missionId}/edit`}
            className="flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
          >
            Edit Mission
          </Link>
        </div>
      </div>
    </div>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 text-gray-800';
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'paused':
      return 'bg-yellow-100 text-yellow-800';
    case 'completed':
      return 'bg-blue-100 text-blue-800';
    case 'archived':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
