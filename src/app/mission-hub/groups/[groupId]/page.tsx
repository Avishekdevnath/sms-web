'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMissionContext } from '@/context/MissionContext';

interface GroupDetails {
  _id: string;
  name: string;
  description?: string;
  missionId: string;
  batchId: string;
  students: Array<{
    _id: string;
    name: string;
    email: string;
    userId: string;
  }>;
  mentors: Array<{
    _id: string;
    name: string;
    email: string;
    userId: string;
  }>;
  primaryMentorId?: string;
  maxStudents: number;
  currentStudents: number;
  status: 'active' | 'inactive' | 'full' | 'recruiting';
  groupType: 'study' | 'project' | 'mentorship' | 'collaborative';
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'mixed';
  meetingSchedule: {
    frequency: 'weekly' | 'biweekly' | 'monthly' | 'on-demand';
    dayOfWeek?: number;
    time?: string;
    duration: number;
    timezone: string;
  };
  groupProgress: {
    overallProgress: number;
    lastMeetingDate?: string;
    totalMeetings: number;
    averageAttendance: number;
  };
  communicationChannel: {
    type: 'discord' | 'slack' | 'telegram' | 'whatsapp';
    channelId?: string;
    inviteLink?: string;
  };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export default function GroupDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { selectedMission } = useMissionContext();
  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddStudents, setShowAddStudents] = useState(false);
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [addingStudents, setAddingStudents] = useState(false);

  const groupId = params.groupId as string;

  useEffect(() => {
    if (groupId) {
      fetchGroupDetails();
    }
  }, [groupId]);

  useEffect(() => {
    if (showAddStudents) {
      fetchAvailableStudents();
    }
  }, [showAddStudents, selectedMission]);

  const fetchGroupDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v2/mentorship-groups/${groupId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Group not found');
        } else {
          setError('Failed to load group details');
        }
        return;
      }

      const data = await response.json();
      if (data.success) {
        setGroup(data.data);
      } else {
        setError(data.error || 'Failed to load group details');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'full': return 'bg-blue-100 text-blue-800';
      case 'recruiting': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getGroupTypeColor = (type: string) => {
    switch (type) {
      case 'mentorship': return 'bg-purple-100 text-purple-800';
      case 'study': return 'bg-blue-100 text-blue-800';
      case 'project': return 'bg-green-100 text-green-800';
      case 'collaborative': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCapacityPercentage = () => {
    if (group?.maxStudents === 0) return 100; // Unlimited
    if (!group?.maxStudents) return 0;
    return Math.round((group.currentStudents / group.maxStudents) * 100);
  };

  const fetchAvailableStudents = async () => {
    if (!selectedMission?._id) return;
    
    try {
      setLoadingStudents(true);
      const response = await fetch(`/api/v2/mission-students/available?missionId=${selectedMission._id}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAvailableStudents(data.data || []);
        }
      }
    } catch (err) {
      console.error('Error fetching available students:', err);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleAddStudents = async () => {
    if (selectedStudents.length === 0) return;
    
    try {
      setAddingStudents(true);
      const response = await fetch('/api/v2/mentorship-groups/assign-students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupId: groupId,
          studentIds: selectedStudents
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Refresh group data
          await fetchGroupDetails();
          setShowAddStudents(false);
          setSelectedStudents([]);
        } else {
          setError(data.error || 'Failed to add students');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to add students');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setAddingStudents(false);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!confirm('Are you sure you want to remove this student from the group?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/v2/mentorship-groups/${groupId}?studentId=${studentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Refresh group data
          await fetchGroupDetails();
        } else {
          setError(data.error || 'Failed to remove student');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to remove student');
      }
    } catch (err) {
      setError('Network error occurred');
    }
  };

  const handleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading group details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-6xl mb-4">📝</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">No Group Found</h1>
          <p className="text-gray-600 mb-4">The requested group could not be found.</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.back()}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
                  <p className="text-sm text-gray-500">
                    {selectedMission?.title} • Group Details
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(group.status)}`}>
                  {group.status.charAt(0).toUpperCase() + group.status.slice(1)}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getGroupTypeColor(group.groupType)}`}>
                  {group.groupType.charAt(0).toUpperCase() + group.groupType.slice(1)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Group Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Group Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {group.description || 'No description provided'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Skill Level</label>
                    <p className="mt-1 text-sm text-gray-900 capitalize">{group.skillLevel}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(group.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Capacity & Progress */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Capacity & Progress</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                    <span>Student Capacity</span>
                    <span>
                      {group.currentStudents}/{group.maxStudents === 0 ? '∞' : group.maxStudents}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getCapacityPercentage()}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {group.maxStudents === 0 ? 'Unlimited capacity' : `${getCapacityPercentage()}% utilized`}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Overall Progress</label>
                  <div className="mt-2 flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2 mr-3">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${group.groupProgress.overallProgress}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {group.groupProgress.overallProgress}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Meeting Schedule */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Meeting Schedule</h2>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Frequency</label>
                    <p className="mt-1 text-sm text-gray-900 capitalize">
                      {group.meetingSchedule.frequency.replace('-', ' ')}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Duration</label>
                    <p className="mt-1 text-sm text-gray-900">{group.meetingSchedule.duration} minutes</p>
                  </div>
                </div>
                {group.meetingSchedule.dayOfWeek !== undefined && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Day & Time</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {group.meetingSchedule.time ? `${group.meetingSchedule.time} ` : ''}
                      {group.meetingSchedule.dayOfWeek !== undefined && (
                        <span>
                          on {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][group.meetingSchedule.dayOfWeek]}
                        </span>
                      )}
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Timezone</label>
                  <p className="mt-1 text-sm text-gray-900">{group.meetingSchedule.timezone}</p>
                </div>
                {group.groupProgress.lastMeetingDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Meeting</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {formatDate(group.groupProgress.lastMeetingDate)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Communication Channel */}
            {group.communicationChannel && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Communication</h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Platform</label>
                    <p className="mt-1 text-sm text-gray-900 capitalize">
                      {group.communicationChannel.type}
                    </p>
                  </div>
                  {group.communicationChannel.channelId && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Channel ID</label>
                      <p className="mt-1 text-sm text-gray-900 font-mono">
                        {group.communicationChannel.channelId}
                      </p>
                    </div>
                  )}
                  {group.communicationChannel.inviteLink && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Invite Link</label>
                      <a
                        href={group.communicationChannel.inviteLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 text-sm text-purple-600 hover:text-purple-700 underline"
                      >
                        Join Channel
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Mentors */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Mentors ({group.mentors.length})</h3>
              {group.mentors.length > 0 ? (
                <div className="space-y-3">
                  {group.mentors.map((mentor) => (
                    <div key={mentor._id} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-purple-600">
                          {mentor.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{mentor.name}</p>
                        <p className="text-xs text-gray-500 truncate">{mentor.email}</p>
                      </div>
                      {group.primaryMentorId === mentor._id && (
                        <span className="px-2 py-1 text-xs font-medium text-purple-600 bg-purple-100 rounded-full">
                          Primary
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No mentors assigned</p>
              )}
            </div>

            {/* Students */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Students ({group.students.length})</h3>
                <button
                  onClick={() => setShowAddStudents(true)}
                  className="px-3 py-1 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                >
                  Add Students
                </button>
              </div>
              {group.students.length > 0 ? (
                <div className="space-y-3">
                  {group.students.map((student) => (
                    <div key={student._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-green-600">
                            {student.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{student.name}</p>
                          <p className="text-xs text-gray-500 truncate">{student.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveStudent(student._id)}
                        className="p-1 text-red-500 hover:text-red-700 transition-colors"
                        title="Remove student"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-500 mb-3">No students assigned</p>
                  <button
                    onClick={() => setShowAddStudents(true)}
                    className="px-4 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                  >
                    Add Students
                  </button>
                </div>
              )}
            </div>

            {/* Group Stats */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Group Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Meetings</span>
                  <span className="text-sm font-medium text-gray-900">
                    {group.groupProgress.totalMeetings}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Average Attendance</span>
                  <span className="text-sm font-medium text-gray-900">
                    {group.groupProgress.averageAttendance}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Last Updated</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatDate(group.updatedAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Students Modal */}
      {showAddStudents && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Add Students to Group</h2>
                <button
                  onClick={() => {
                    setShowAddStudents(false);
                    setSelectedStudents([]);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {loadingStudents ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading available students...</p>
                </div>
              ) : availableStudents.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No available students to add to this group.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableStudents.map((student) => (
                    <div
                      key={student._id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedStudents.includes(student._id)
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleStudentSelection(student._id)}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student._id)}
                          onChange={() => handleStudentSelection(student._id)}
                          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-green-600">
                            {student.studentId?.name?.charAt(0).toUpperCase() || 'S'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {student.studentId?.name || 'Unknown Student'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {student.studentId?.email || 'No email'}
                          </p>
                        </div>
                        <div className="text-xs text-gray-500">
                          Progress: {student.progress || 0}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {selectedStudents.length} student(s) selected
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowAddStudents(false);
                      setSelectedStudents([]);
                    }}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddStudents}
                    disabled={selectedStudents.length === 0 || addingStudents}
                    className="px-4 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {addingStudents ? 'Adding...' : `Add ${selectedStudents.length} Student(s)`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
