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
  focusArea?: string[];
  meetingSchedule: {
    frequency: 'weekly' | 'biweekly' | 'monthly' | 'on-demand';
    dayOfWeek?: number;
    time?: string;
    duration: number;
    timezone: string;
  };
  communicationChannel?: {
    type: 'discord' | 'slack' | 'telegram' | 'whatsapp';
    channelId?: string;
    inviteLink?: string;
  };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  name: string;
  description: string;
  maxStudents: number;
  status: 'active' | 'inactive' | 'full' | 'recruiting';
  groupType: 'study' | 'project' | 'mentorship' | 'collaborative';
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'mixed';
  focusArea: string[];
  meetingSchedule: {
    frequency: 'weekly' | 'biweekly' | 'monthly' | 'on-demand';
    dayOfWeek?: number;
    time?: string;
    duration: number;
    timezone: string;
  };
  communicationChannel: {
    type: 'discord' | 'slack' | 'telegram' | 'whatsapp';
    channelId: string;
    inviteLink: string;
  };
  primaryMentorId: string;
}

export default function EditGroupPage() {
  const params = useParams();
  const router = useRouter();
  const { selectedMission } = useMissionContext();
  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    maxStudents: 0,
    status: 'active',
    groupType: 'mentorship',
    skillLevel: 'beginner',
    focusArea: [],
    meetingSchedule: {
      frequency: 'weekly',
      dayOfWeek: 1,
      time: '14:00',
      duration: 60,
      timezone: 'Asia/Dhaka'
    },
    communicationChannel: {
      type: 'discord',
      channelId: '',
      inviteLink: ''
    },
    primaryMentorId: ''
  });

  const groupId = params.groupId as string;

  useEffect(() => {
    if (groupId) {
      fetchGroupDetails();
    }
  }, [groupId]);

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
        const groupData = data.data;
        setGroup(groupData);
        
        // Populate form with existing data
        setFormData({
          name: groupData.name || '',
          description: groupData.description || '',
          maxStudents: groupData.maxStudents || 0,
          status: groupData.status || 'active',
          groupType: groupData.groupType || 'mentorship',
          skillLevel: groupData.skillLevel || 'beginner',
          focusArea: groupData.focusArea || [],
          meetingSchedule: {
            frequency: groupData.meetingSchedule?.frequency || 'weekly',
            dayOfWeek: groupData.meetingSchedule?.dayOfWeek,
            time: groupData.meetingSchedule?.time || '14:00',
            duration: groupData.meetingSchedule?.duration || 60,
            timezone: groupData.meetingSchedule?.timezone || 'Asia/Dhaka'
          },
          communicationChannel: {
            type: groupData.communicationChannel?.type || 'discord',
            channelId: groupData.communicationChannel?.channelId || '',
            inviteLink: groupData.communicationChannel?.inviteLink || ''
          },
          primaryMentorId: groupData.primaryMentorId || ''
        });
      } else {
        setError(data.error || 'Failed to load group details');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof FormData],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleFocusAreaChange = (value: string) => {
    const areas = value.split(',').map(area => area.trim()).filter(area => area);
    setFormData(prev => ({
      ...prev,
      focusArea: areas
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/v2/mentorship-groups/${groupId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update group');
        return;
      }

      const data = await response.json();
      if (data.success) {
        // Redirect back to group details
        router.push(`/mission-hub/groups/${groupId}`);
      } else {
        setError(data.error || 'Failed to update group');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setSaving(false);
    }
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

  if (error && !group) {
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
                  <h1 className="text-2xl font-bold text-gray-900">Edit Group</h1>
                  <p className="text-sm text-gray-500">
                    {selectedMission?.title} • {group?.name}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group Type *
                </label>
                <select
                  value={formData.groupType}
                  onChange={(e) => handleInputChange('groupType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="mentorship">Mentorship</option>
                  <option value="study">Study</option>
                  <option value="project">Project</option>
                  <option value="collaborative">Collaborative</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skill Level *
                </label>
                <select
                  value={formData.skillLevel}
                  onChange={(e) => handleInputChange('skillLevel', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Students (0 = unlimited)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.maxStudents}
                  onChange={(e) => handleInputChange('maxStudents', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="full">Full</option>
                  <option value="recruiting">Recruiting</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Focus Areas (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.focusArea.join(', ')}
                  onChange={(e) => handleFocusAreaChange(e.target.value)}
                  placeholder="e.g., frontend, react, state-management"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Meeting Schedule */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Meeting Schedule</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frequency *
                </label>
                <select
                  value={formData.meetingSchedule.frequency}
                  onChange={(e) => handleInputChange('meetingSchedule.frequency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="on-demand">On-demand</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  min="15"
                  max="240"
                  value={formData.meetingSchedule.duration}
                  onChange={(e) => handleInputChange('meetingSchedule.duration', parseInt(e.target.value) || 60)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Day of Week
                </label>
                <select
                  value={formData.meetingSchedule.dayOfWeek || ''}
                  onChange={(e) => handleInputChange('meetingSchedule.dayOfWeek', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select day</option>
                  <option value="0">Sunday</option>
                  <option value="1">Monday</option>
                  <option value="2">Tuesday</option>
                  <option value="3">Wednesday</option>
                  <option value="4">Thursday</option>
                  <option value="5">Friday</option>
                  <option value="6">Saturday</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time
                </label>
                <input
                  type="time"
                  value={formData.meetingSchedule.time}
                  onChange={(e) => handleInputChange('meetingSchedule.time', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timezone *
                </label>
                <select
                  value={formData.meetingSchedule.timezone}
                  onChange={(e) => handleInputChange('meetingSchedule.timezone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="Asia/Dhaka">Asia/Dhaka</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="Asia/Tokyo">Asia/Tokyo</option>
                </select>
              </div>
            </div>
          </div>

          {/* Communication Channel */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Communication Channel</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Platform
                </label>
                <select
                  value={formData.communicationChannel.type}
                  onChange={(e) => handleInputChange('communicationChannel.type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="discord">Discord</option>
                  <option value="slack">Slack</option>
                  <option value="telegram">Telegram</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Channel ID
                </label>
                <input
                  type="text"
                  value={formData.communicationChannel.channelId}
                  onChange={(e) => handleInputChange('communicationChannel.channelId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invite Link
                </label>
                <input
                  type="url"
                  value={formData.communicationChannel.inviteLink}
                  onChange={(e) => handleInputChange('communicationChannel.inviteLink', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Primary Mentor */}
          {group && group.mentors.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Primary Mentor</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Primary Mentor
                </label>
                <select
                  value={formData.primaryMentorId}
                  onChange={(e) => handleInputChange('primaryMentorId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">No primary mentor</option>
                  {group.mentors.map((mentor) => (
                    <option key={mentor._id} value={mentor._id}>
                      {mentor.name} ({mentor.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
