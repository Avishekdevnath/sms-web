"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Plus, 
  Users2, 
  UserPlus2, 
  Target,
  CheckCircle,
  AlertCircle,
  User,
  UserCheck2
} from 'lucide-react';

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

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  studentId?: string;
  profilePicture?: string;
}

interface Group {
  _id: string;
  name: string;
  description?: string;
  missionId: string;
  mentors: Array<{
    _id: string;
    name: string;
    email: string;
    role: string;
  }>;
  students: Array<{
    _id: string;
    name: string;
    email: string;
    studentId: string;
  }>;
  maxStudents: number;
  currentStudents: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

export default function AddGroupPage() {
  const [mission, setMission] = useState<Mission | null>(null);
  const [missionMentors, setMissionMentors] = useState<User[]>([]);
  const [missionStudents, setMissionStudents] = useState<User[]>([]);
  const [availableMentors, setAvailableMentors] = useState<User[]>([]);
  const [availableStudents, setAvailableStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [groupData, setGroupData] = useState({
    name: '',
    description: '',
    maxStudents: 0 // 0 = unlimited
  });

  // Selected users
  const [selectedMentors, setSelectedMentors] = useState<Set<string>>(new Set());
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchMission();
  }, []);

  useEffect(() => {
    if (mission) {
      fetchMissionUsers();
    }
  }, [mission]);

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
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get auth token
  const getAuthHeaders = () => {
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('token='))
      ?.split('=')[1];
    
    console.log('🔑 Auth token found:', !!token, 'Length:', token?.length);
    
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  const fetchMissionUsers = async () => {
    if (!mission) return;
    
    try {
      // Fetch mission mentors
      const mentorsResponse = await fetch(`/api/mission-mentors/mission/${mission._id}`, {
        headers: getAuthHeaders()
      });
      let mentors: any[] = [];
      if (mentorsResponse.ok) {
        const mentorsData = await mentorsResponse.json();
        console.log('📊 Mentors API response:', mentorsData);
        if (mentorsData.data?.mentors) {
          mentors = mentorsData.data.mentors.map((m: any) => m.mentorId);
          console.log('👥 Extracted mentors:', mentors);
          setMissionMentors(mentors);
        } else {
          console.warn('⚠️ No mentors data found in response');
        }
      } else {
        console.error('❌ Mentors API failed:', mentorsResponse.status, mentorsResponse.statusText);
      }

      // Fetch mission students
      const studentsResponse = await fetch(`/api/mission-hub/students?missionId=${mission._id}`, {
        headers: getAuthHeaders()
      });
      let students: any[] = [];
      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json();
        console.log('📊 Students API response:', studentsData);
        if (studentsData.data) {
          students = studentsData.data;
          console.log('👨‍🎓 Extracted students:', students);
          setMissionStudents(students);
        } else {
          console.warn('⚠️ No students data found in response');
        }
      } else {
        console.error('❌ Students API failed:', studentsResponse.status, studentsResponse.statusText);
      }

      // Fetch existing groups to filter out already assigned users
      const groupsResponse = await fetch(`/api/mission-hub/groups?missionId=${mission._id}`, {
        headers: getAuthHeaders()
      });
      if (groupsResponse.ok) {
        const groupsData = await groupsResponse.json();
        const groups = groupsData.groups || [];
        
        // Extract assigned user IDs
        const assignedMentorIds = new Set();
        const assignedStudentIds = new Set();
        
        groups.forEach((group: Group) => {
          group.mentors.forEach(mentor => assignedMentorIds.add(mentor._id));
          group.students.forEach(student => assignedStudentIds.add(student._id));
        });
        
        // Filter available users using the local variables
        const availableMentors = mentors.filter(mentor => !assignedMentorIds.has(mentor._id));
        const availableStudents = students.filter(student => !assignedStudentIds.has(student._id));
        
        setAvailableMentors(availableMentors);
        setAvailableStudents(availableStudents);
      }
    } catch (error) {
      console.error('Failed to fetch mission users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mission) return;

    setSubmitting(true);
    setError('');

    try {
      // Create the group
      const groupResponse = await fetch('/api/mission-hub/groups', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...groupData,
          missionId: mission._id
        }),
      });

      if (!groupResponse.ok) {
        const errorData = await groupResponse.json();
        throw new Error(errorData.error || 'Failed to create group');
      }

      const groupData = await groupResponse.json();
      const groupId = groupData.group._id;

      // Add selected mentors to the group
      if (selectedMentors.size > 0) {
        const mentorsResponse = await fetch(`/api/mission-hub/groups/${groupId}/mentors`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            mentorIds: Array.from(selectedMentors)
          }),
        });

        if (!mentorsResponse.ok) {
          console.error('Failed to add mentors to group');
        }
      }

      // Add selected students to the group
      if (selectedStudents.size > 0) {
        const studentsResponse = await fetch(`/api/mission-hub/groups/${groupId}/students`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            studentIds: Array.from(selectedStudents)
          }),
        });

        if (!studentsResponse.ok) {
          console.error('Failed to add students to group');
        }
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/mission-hub/groups';
      }, 2000);

    } catch (error) {
      console.error('Error creating group:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMentorSelection = (mentorId: string) => {
    setSelectedMentors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(mentorId)) {
        newSet.delete(mentorId);
      } else {
        newSet.add(mentorId);
      }
      return newSet;
    });
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

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
        <p className="text-gray-600">Please select a mission to create groups.</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Group Created Successfully!</h3>
        <p className="text-gray-600 mb-6">Redirecting to Group Management...</p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href="/mission-hub/groups"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Group Management
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Group</h1>
          <p className="text-gray-600 mt-1">Add a new mentorship group for {mission.code} - {mission.title}</p>
        </div>
      </div>

      {/* Mission Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Target className="h-6 w-6 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Mission Overview</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Mission Code</label>
            <p className="text-lg font-semibold text-purple-600">{mission.code}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Mission Title</label>
            <p className="text-lg font-semibold text-gray-900">{mission.title}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Batch</label>
            <p className="text-lg font-semibold text-gray-900">{mission.batch?.code || 'No Batch'}</p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Create Group Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Group Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Group Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Group Name *</label>
              <input
                type="text"
                required
                value={groupData.name}
                onChange={(e) => setGroupData({ ...groupData, name: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter group name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Max Students</label>
              <input
                type="number"
                min="0"
                value={groupData.maxStudents}
                onChange={(e) => setGroupData({ ...groupData, maxStudents: parseInt(e.target.value) })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="0 for unlimited"
              />
              <p className="text-xs text-gray-500 mt-1">Enter 0 for unlimited students</p>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={groupData.description}
              onChange={(e) => setGroupData({ ...groupData, description: e.target.value })}
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter group description (optional)"
            />
          </div>
        </div>

        {/* Select Mentors */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Mentors</h3>
          <p className="text-sm text-gray-600 mb-4">
            Choose mentors from mission mentors who are not already assigned to other groups
          </p>
          
          {availableMentors.length === 0 ? (
            <div className="text-center py-8">
              <UserCheck2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">No available mentors found</p>
              <p className="text-sm text-gray-500">All mission mentors are already assigned to groups</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableMentors.map((mentor) => (
                <label
                  key={mentor._id}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedMentors.has(mentor._id)
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedMentors.has(mentor._id)}
                    onChange={() => toggleMentorSelection(mentor._id)}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 mr-3"
                  />
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{mentor.name}</div>
                      <div className="text-xs text-gray-500">{mentor.email}</div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Select Students */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Students</h3>
          <p className="text-sm text-gray-600 mb-4">
            Choose students from mission students who are not already assigned to other groups
          </p>
          
          {availableStudents.length === 0 ? (
            <div className="text-center py-8">
              <Users2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">No available students found</p>
              <p className="text-sm text-gray-500">All mission students are already assigned to groups</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableStudents.map((student) => (
                <label
                  key={student._id}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedStudents.has(student._id)
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedStudents.has(student._id)}
                    onChange={() => toggleStudentSelection(student._id)}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500 mr-3"
                  />
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{student.name}</div>
                      <div className="text-xs text-gray-500">{student.email}</div>
                      {student.studentId && (
                        <div className="text-xs text-gray-400">ID: {student.studentId}</div>
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{selectedMentors.size}</span> mentors and{' '}
              <span className="font-medium">{selectedStudents.size}</span> students selected
            </div>
            <div className="flex space-x-3">
              <Link
                href="/mission-hub/groups"
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting || !groupData.name}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Group...
                  </>
                ) : (
                  <>
                    <Plus size={16} className="mr-2" />
                    Create Group
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        {/* Debug Button */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => {
              console.log('🔍 Debug: Testing mission data fetch...');
              console.log('🔍 Mission ID:', mission._id);
              fetchMissionUsers();
            }}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
          >
            🔍 Debug: Test Mission Data Fetch
          </button>
        </div>
      </form>
    </div>
  );
}
