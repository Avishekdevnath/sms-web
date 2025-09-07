"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Users, 
  UserPlus, 
  Target, 
  Save, 
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useMissionContext } from '@/context/MissionContext';

interface Mission {
  _id: string;
  code: string;
  title: string;
  status: string;
  batchId: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  studentId?: string;
  userId?: string;
}

interface GroupFormData {
  name: string;
  description: string;
  missionId: string;
  mentorIds: string[];
  studentIds: string[];
  maxStudents: number;
  groupType: 'study' | 'project' | 'mentorship' | 'collaborative';
}

export default function CreateGroupPage() {
  const router = useRouter();
  const { selectedMission: globalMission, availableMissions } = useMissionContext();
  const [loading, setLoading] = useState(false);
  const [availableMentors, setAvailableMentors] = useState<User[]>([]);
  const [availableStudents, setAvailableStudents] = useState<User[]>([]);
  // Use global mission directly - no need for local state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<GroupFormData>({
    name: '',
    description: '',
    missionId: '',
    mentorIds: [],
    studentIds: [],
    maxStudents: 0, // 0 = unlimited
    groupType: 'mentorship'
  });

  // Fetch available users when global mission changes
  useEffect(() => {
    if (globalMission) {
      fetchAvailableUsers(globalMission._id);
    }
  }, [globalMission]);

  const fetchAvailableUsers = async (missionId: string) => {
    try {
      // Fetch mentors who are NOT already assigned to any group
      const mentorsResponse = await fetch(`/api/v2/mission-mentors/available?missionId=${missionId}`);
      if (mentorsResponse.ok) {
        const mentorsData = await mentorsResponse.json();
        if (mentorsData.success && mentorsData.data) {
          const mentors = mentorsData.data.map((mm: any) => mm.mentorId).filter(Boolean);
          setAvailableMentors(mentors);
        }
      }

      // Fetch students who are NOT already assigned to any group
      const studentsResponse = await fetch(`/api/v2/mission-students/available?missionId=${missionId}`);
      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json();
        if (studentsData.success && studentsData.data) {
          const students = studentsData.data.map((ms: any) => ms.studentId).filter(Boolean);
          setAvailableStudents(students);
        }
      }
    } catch (error) {
      console.error('Failed to fetch available users (not assigned to groups):', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMultiSelect = (type: 'mentorIds' | 'studentIds', userId: string) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].includes(userId)
        ? prev[type].filter(id => id !== userId)
        : [...prev[type], userId]
    }));
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/v2/mentorship-groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          missionId: globalMission?._id
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Group created successfully!');
        setTimeout(() => {
          router.push('/mission-hub/groups');
        }, 1500);
      } else {
        setError(data.error || 'Failed to create group');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      setError('Failed to create group');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-3">
              <Link
                href="/mission-hub/groups"
                className="inline-flex items-center text-xs text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft size={16} className="mr-1" />
                Back to Groups
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Create New Group</h1>
                <p className="text-xs text-gray-600">Set up a new mentorship group</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <p className="text-xs text-red-800">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <p className="text-xs text-green-800">{success}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Group Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter group name"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Group Type *
                </label>
                <select
                  name="groupType"
                  value={formData.groupType}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="mentorship">Mentorship</option>
                  <option value="study">Study Group</option>
                  <option value="project">Project Team</option>
                  <option value="collaborative">Collaborative</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Describe the group's purpose and goals"
              />
            </div>
          </div>

          {/* Mission Assignment */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Mission Assignment</h3>
            
            {globalMission ? (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      {globalMission.code} - {globalMission.title}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      This group will be created for the currently selected mission
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-red-800">No mission selected</p>
                    <p className="text-xs text-red-600 mt-1">
                      Please select a mission from the sidebar to create a group
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mentors Selection */}
          {globalMission && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Assign Mentors</h3>
              
              <div className="mb-3">
                <p className="text-xs text-gray-600">
                  Mission ID: {globalMission._id} | Found {availableMentors.length} mentors
                </p>
              </div>
              
              {availableMentors.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-xs text-gray-500 mb-2">No mentors available for this mission</p>
                  <p className="text-xs text-gray-400">
                    All mentors are already assigned to groups, or no mentors are assigned to this mission.
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-gray-600 mb-3">
                    {availableMentors.length} mentor{availableMentors.length !== 1 ? 's' : ''} available (not assigned to any group)
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {availableMentors.map((mentor) => (
                      <label key={mentor._id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.mentorIds.includes(mentor._id)}
                          onChange={() => handleMultiSelect('mentorIds', mentor._id)}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-gray-900">{mentor.name}</div>
                          <div className="text-xs text-gray-500">{mentor.email}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Students Selection */}
          {globalMission && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Assign Students</h3>
              
              <div className="mb-3">
                <p className="text-xs text-gray-600">
                  Mission ID: {globalMission._id} | Found {availableStudents.length} students (not assigned to any group)
                </p>
              </div>
              
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Maximum Students
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    name="maxStudents"
                    value={formData.maxStudents}
                    onChange={handleInputChange}
                    min="0"
                    className="w-24 px-3 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="0"
                  />
                  <span className="text-xs text-gray-500">
                    {formData.maxStudents === 0 ? '(unlimited)' : 'students'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Enter 0 for unlimited students, or specify a number
                </p>
              </div>

              {availableStudents.length === 0 ? (
                <p className="text-xs text-gray-500">No students available for this mission (all students are already assigned to groups)</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                  {availableStudents.map((student) => (
                    <label key={student._id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.studentIds.includes(student._id)}
                        onChange={() => handleMultiSelect('studentIds', student._id)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-gray-900">{student.name}</div>
                        <div className="text-xs text-gray-500">{student.email}</div>
                        {student.studentId && (
                          <div className="text-xs text-gray-400">ID: {student.studentId}</div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}



          {/* Important Note */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="text-xs font-medium text-yellow-800">Important Note</h4>
                <p className="text-xs text-yellow-700 mt-1">
                  Students can only be part of one group at a time. Make sure students are not already assigned to other groups.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <Link
              href="/mission-hub/groups"
              className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || !globalMission}
              className="px-4 py-2 text-xs font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
