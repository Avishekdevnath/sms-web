"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Users2, Target, ArrowLeft, Plus, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

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
}

export default function CreateMentorGroupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mission, setMission] = useState<Mission | null>(null);
  const [allMentors, setAllMentors] = useState<User[]>([]);
  const [allStudents, setAllStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMentors, setSelectedMentors] = useState<string[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMission();
  }, []);

  useEffect(() => {
    if (mission) {
      fetchAllMentors();
      fetchAllStudents();
    }
  }, [mission]);

  const fetchMission = async () => {
    try {
      const response = await fetch('/api/v2/missions');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.length > 0) {
          setMission(data.data[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch mission:', error);
      setError('Failed to fetch mission data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllMentors = async () => {
    if (!mission) return;
    
    try {
      // Fetch only mentors who are already assigned to this mission
      const response = await fetch(`/api/v2/mission-mentors?missionId=${mission._id}&status=active`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          // Transform V2 data to match expected format
          const transformedMentors = data.data.map((mentor: any) => ({
            _id: mentor._id,
            name: mentor.mentorId.name,
            email: mentor.mentorId.email,
            role: mentor.role
          }));
          setAllMentors(transformedMentors);
        }
      }
    } catch (error) {
      console.error('Failed to fetch mission mentors:', error);
    }
  };

  const fetchAllStudents = async () => {
    if (!mission) return;
    
    try {
      const response = await fetch(`/api/v2/mission-students?missionId=${mission._id}&status=active`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          // Transform V2 data to match expected format
          const transformedStudents = data.data.map((student: any) => ({
            _id: student._id,
            name: student.studentId?.name || 'Unknown',
            email: student.studentId?.email || 'Unknown',
            role: 'student'
          }));
          setAllStudents(transformedStudents);
        }
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
    }
  };

  const handleMentorToggle = (mentorId: string) => {
    setSelectedMentors(prev => 
      prev.includes(mentorId) 
        ? prev.filter(id => id !== mentorId)
        : [...prev, mentorId]
    );
  };

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!groupName.trim()) {
      setError('Group name is required');
      return;
    }

    if (selectedMentors.length === 0) {
      setError('At least one mentor is required');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/v2/mentorship-groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          missionId: mission?._id,
          name: groupName.trim(),
          description: description.trim() || undefined,
          mentorIds: selectedMentors,
          studentIds: selectedStudents,
          groupType: 'study',
          focusArea: [],
          meetingSchedule: []
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSuccess('Mentor group created successfully!');
          setTimeout(() => {
            router.push('/mission-hub/mentors/groups');
          }, 2000);
        } else {
          setError(data.message || 'Failed to create group');
        }
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to create group');
      }
    } catch (error) {
      console.error('Failed to create group:', error);
      setError('Failed to create group');
    } finally {
      setSubmitting(false);
    }
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
        <p className="text-gray-600">Please select a mission to create a mentor group.</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Create Mentor Group</h1>
            <p className="text-gray-600 mt-1">Create a new mentor group for {mission.code} - {mission.title}</p>
            <p className="text-sm text-blue-600 mt-2">
              Note: Only mentors who are already assigned to this mission can be added to groups.
            </p>
          </div>
        </div>
      </div>

      {/* Error/Success Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <XCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-green-800">{success}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Group Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Group Name *
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter group name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Describe the group's purpose or focus area"
              />
            </div>
          </div>
        </div>

        {/* Mentors Selection */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Mentors *</h3>
          <p className="text-sm text-gray-600 mb-4">Choose mentors for this group. At least one mentor is required.</p>
          
          {allMentors.length === 0 ? (
            <div className="text-center py-8 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-yellow-600 mb-2">⚠️ No Mentors Available</div>
              <p className="text-sm text-yellow-700">
                No mentors have been assigned to this mission yet. 
                Please assign mentors to the mission first before creating groups.
              </p>
              <Link
                href="/mission-hub/mentors/assign"
                className="inline-flex items-center mt-3 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
              >
                Go to Assign Mentors
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {allMentors.map(mentor => (
                <label key={mentor._id} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedMentors.includes(mentor._id)}
                    onChange={() => handleMentorToggle(mentor._id)}
                    className="mr-3 text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">{mentor.name}</span>
                    <p className="text-xs text-gray-500">{mentor.email}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
          
          {selectedMentors.length === 0 && allMentors.length > 0 && (
            <p className="text-sm text-red-600 mt-2">Please select at least one mentor</p>
          )}
        </div>

        {/* Students Selection */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Students (Optional)</h3>
          <p className="text-sm text-gray-600 mb-4">Choose students to add to this group. Students can be added later.</p>
          
          <div className="max-h-64 overflow-y-auto space-y-2">
            {allStudents.map(student => (
              <label key={student._id} className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedStudents.includes(student._id)}
                  onChange={() => handleStudentToggle(student._id)}
                  className="mr-3 text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">{student.name}</span>
                  <span className="text-xs text-gray-500 ml-2">({student.email})</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Link
            href="/mission-hub/mentors"
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting || !groupName.trim() || selectedMentors.length === 0}
            className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Creating...' : 'Create Group'}
          </button>
        </div>
      </form>
    </div>
  );
}
