"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserCheck2, Target, ArrowLeft, Users, UserPlus2, Eye, Edit, Trash2, AlertTriangle, Plus, User, Mail, Calendar, BookOpen } from 'lucide-react';

interface Mission {
  _id: string;
  code: string;
  title: string;
  status: string;
  batchId: {
    _id: string;
    code: string;
    name: string;
  } | null;
}

interface MissionMentor {
  _id: string;
  mentorId: {
    _id: string;
    name: string;
    email: string;
    role: string;
    profilePicture?: string;
  };
  role: 'mission-lead' | 'coordinator' | 'advisor' | 'supervisor';
  specialization: string[];
  responsibilities: string[];
  maxStudents: number;
  currentStudents: number;
  status: 'active' | 'deactive' | 'irregular' | 'overloaded' | 'unavailable';
  missionNotes?: string;
  availabilityRate: number;
  isRegular: boolean;
}

interface MentorStats {
  totalMentors: number;
  activeMentors: number;
  overloadedMentors: number;
  totalStudents: number;
}

export default function MissionMentorsPage() {
  const [mission, setMission] = useState<Mission | null>(null);
  const [mentors, setMentors] = useState<MissionMentor[]>([]);
  const [mentorStats, setMentorStats] = useState<MentorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [removingMentorId, setRemovingMentorId] = useState<string | null>(null);

  useEffect(() => {
    fetchMission();
  }, []);

  useEffect(() => {
    if (mission) {
      fetchMissionMentors();
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

  const fetchMissionMentors = async () => {
    if (!mission) return;
    
    try {
      console.log('Fetching mentors for mission:', mission._id);
      const response = await fetch(`/api/v2/mission-mentors?missionId=${mission._id}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Mission mentors API response:', data);
        
        if (data.success && data.data) {
          // Transform V2 data to match expected interface format
          const transformedMentors = data.data.map((mentorData: any) => ({
            _id: mentorData._id,
            mentorId: {
              _id: mentorData.mentorId?._id || mentorData.mentorId,
              name: mentorData.mentorId?.name || 'Unknown Mentor',
              email: mentorData.mentorId?.email || 'No email',
              role: mentorData.mentorId?.role || 'mentor',
              profilePicture: mentorData.mentorId?.profilePicture
            },
            role: mentorData.role,
            specialization: mentorData.specialization || [],
            responsibilities: mentorData.responsibilities || [],
            maxStudents: mentorData.maxStudents || 0,
            currentStudents: mentorData.currentStudents || 0,
            status: mentorData.status,
            missionNotes: mentorData.missionNotes,
            availabilityRate: mentorData.availabilityRate || 100,
            isRegular: mentorData.isRegular !== false
          }));
          
          setMentors(transformedMentors);
          
          // Calculate stats from the transformed data
          const totalMentors = transformedMentors.length;
          const activeMentors = transformedMentors.filter((m: any) => m.status === 'active').length;
          const overloadedMentors = transformedMentors.filter((m: any) => m.status === 'overloaded').length;
          const totalStudents = transformedMentors.reduce((sum: number, m: any) => sum + (m.currentStudents || 0), 0);
          
          setMentorStats({
            totalMentors,
            activeMentors,
            overloadedMentors,
            totalStudents
          });
        } else {
          console.error('No data in response:', data);
          setError('No mentor data received');
        }
      } else {
        const errorData = await response.json();
        console.error('API error response:', errorData);
        setError(`Failed to fetch mentor data: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error fetching mission mentors:', error);
      setError('Failed to fetch mentor data');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'mission-lead': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'coordinator': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'advisor': return 'bg-green-100 text-green-800 border-green-200';
      case 'supervisor': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'deactive': return 'bg-gray-100 text-gray-600 border-gray-200';
      case 'irregular': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'overloaded': return 'bg-red-100 text-red-800 border-red-200';
      case 'unavailable': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const toggleMentorStatus = async (mentorId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'deactive' : 'active';
    
    try {
      const response = await fetch(`/api/v2/mission-mentors/${mentorId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Update the local state
        setMentors(prev => prev.map(mentor => 
          mentor._id === mentorId 
            ? { ...mentor, status: newStatus }
            : mentor
        ));
        
        // Update statistics
        if (mentorStats) {
          setMentorStats(prev => {
            if (!prev) return prev;
            if (newStatus === 'active') {
              return {
                ...prev,
                activeMentors: prev.activeMentors + 1,
                overloadedMentors: currentStatus === 'overloaded' ? prev.overloadedMentors - 1 : prev.overloadedMentors
              };
            } else {
              return {
                ...prev,
                activeMentors: prev.activeMentors - 1
              };
            }
          });
        }
      } else {
        const errorData = await response.json();
        console.error('Failed to update status:', errorData);
        // You could add a toast notification here
      }
    } catch (error) {
      console.error('Error updating mentor status:', error);
    }
  };

  const handleRemoveMentor = async (mentorId: string, mentorName: string) => {
    if (!confirm(`Are you sure you want to remove "${mentorName}" from this mission? This action cannot be undone.`)) {
      return;
    }

    try {
      setRemovingMentorId(mentorId);
      
      const response = await fetch(`/api/v2/mission-mentors/${mentorId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Remove mentor from local state
        setMentors(prev => prev.filter(mentor => mentor._id !== mentorId));
        
        // Update statistics
        if (mentorStats) {
          setMentorStats(prev => {
            if (!prev) return prev;
            const removedMentor = mentors.find(m => m._id === mentorId);
            return {
              ...prev,
              totalMentors: prev.totalMentors - 1,
              activeMentors: removedMentor?.status === 'active' ? prev.activeMentors - 1 : prev.activeMentors,
              overloadedMentors: removedMentor?.status === 'overloaded' ? prev.overloadedMentors - 1 : prev.overloadedMentors,
              totalStudents: prev.totalStudents - (removedMentor?.currentStudents || 0)
            };
          });
        }
        
        // Show success message briefly
        alert(`${mentorName} has been successfully removed from the mission.`);
      } else {
        const errorData = await response.json();
        console.error('Failed to remove mentor:', errorData);
        alert(`Failed to remove mentor: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error removing mentor:', error);
      alert('Failed to remove mentor due to network error');
    } finally {
      setRemovingMentorId(null);
    }
  };

  const getWorkloadPercentage = (current: number, max: number) => {
    return max > 0 ? Math.round((current / max) * 100) : 0;
  };

  const getWorkloadColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading mission mentors...</p>
        </div>
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="text-center py-12">
        <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Mission Found</h3>
        <p className="text-gray-600">Please select a mission to view mentors.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Link
                href="/mission-hub/groups"
                className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft size={20} className="mr-2" />
                Back to Group Management
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mission Mentors</h1>
                <p className="text-gray-600 mt-1">Manage mentors for the selected mission</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={async () => {
                  setRefreshing(true);
                  await fetchMissionMentors();
                  setRefreshing(false);
                }}
                disabled={refreshing}
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {refreshing ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Refreshing...
                  </>
                ) : (
                  'Refresh'
                )}
              </button>
              <Link
                href="/mission-hub/mentors/assign"
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
              >
                <Plus size={16} className="mr-2" />
                Assign New Mentor
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mentor Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{mentorStats?.totalMentors || 0}</div>
              <div className="text-sm text-gray-600">Total Mentors</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{mentorStats?.activeMentors || 0}</div>
              <div className="text-sm text-gray-600">Active Mentors</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{mentorStats?.overloadedMentors || 0}</div>
              <div className="text-sm text-gray-600">Overloaded Mentors</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{mentorStats?.totalStudents || 0}</div>
              <div className="text-sm text-gray-600">Students with Mentors</div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Mentors Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Assigned Mentors</h2>
            <p className="text-sm text-gray-600 mt-1">
              {mentors.length === 0 ? 'No mentors assigned yet' : `${mentors.length} mentor${mentors.length !== 1 ? 's' : ''} assigned`}
            </p>
          </div>

          {mentors.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Mentors Assigned</h3>
              <p className="text-gray-600 mb-6">Get started by assigning mentors to this mission.</p>
              <Link
                href="/mission-hub/mentors/assign"
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus size={16} className="mr-2" />
                Assign First Mentor
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Mentor
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                      Role
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                      Status
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                      Email
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Students
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                      Capacity
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Specializations
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mentors.map((mentor) => (
                    <tr key={mentor._id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                            <User className="h-4 w-4 text-purple-600" />
                          </div>
                          <div className="ml-3 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">{mentor.mentorId.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getRoleColor(mentor.role)}`}>
                          {mentor.role.charAt(0).toUpperCase() + mentor.role.slice(1)}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        <button
                          onClick={() => toggleMentorStatus(mentor._id, mentor.status)}
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(mentor.status)}`}
                          title={`Click to ${mentor.status === 'active' ? 'deactivate' : 'activate'} mentor`}
                        >
                          {mentor.status.charAt(0).toUpperCase() + mentor.status.slice(1)}
                        </button>
                      </td>
                      <td className="px-3 py-4">
                        <div className="text-sm text-gray-900 truncate max-w-36" title={mentor.mentorId.email}>
                          {mentor.mentorId.email}
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <div className="text-sm text-gray-900">
                          {mentor.currentStudents} students
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {mentor.availabilityRate}% available
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <div className="text-sm text-gray-900 mb-1">
                          {mentor.currentStudents}/{mentor.maxStudents === 0 ? '∞' : mentor.maxStudents}
                        </div>
                        {mentor.maxStudents > 0 && (
                          <>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  getWorkloadPercentage(mentor.currentStudents, mentor.maxStudents) >= 90
                                    ? 'bg-red-500'
                                    : getWorkloadPercentage(mentor.currentStudents, mentor.maxStudents) >= 70
                                    ? 'bg-yellow-500'
                                    : 'bg-green-500'
                                }`}
                                style={{
                                  width: `${Math.min(getWorkloadPercentage(mentor.currentStudents, mentor.maxStudents), 100)}%`
                                }}
                              ></div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {getWorkloadPercentage(mentor.currentStudents, mentor.maxStudents)}% used
                            </div>
                          </>
                        )}
                        {mentor.maxStudents === 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            Unlimited capacity
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-4">
                        <div className="text-sm text-gray-900 max-w-28">
                          {mentor.specialization.length > 0 ? (
                            <div className="truncate" title={mentor.specialization.join(', ')}>
                              {mentor.specialization.slice(0, 2).join(', ')}
                              {mentor.specialization.length > 2 && (
                                <span className="text-gray-500"> +{mentor.specialization.length - 2}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">None</span>
                          )}
                        </div>
                        {mentor.responsibilities.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1 truncate" title={mentor.responsibilities.join(', ')}>
                            {mentor.responsibilities.slice(0, 1).join(', ')}
                            {mentor.responsibilities.length > 1 && ` +${mentor.responsibilities.length - 1}`}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex items-center space-x-1">
                          <Link
                            href={`/mission-hub/mentors/mission-mentors/${mentor._id}`}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium text-purple-600 bg-purple-50 border border-purple-200 rounded-md hover:bg-purple-100 transition-colors"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Link>
                          <Link
                            href={`/mission-hub/mentors/mission-mentors/${mentor._id}/edit`}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
                          >
                            <Edit className="h-3 w-3" />
                          </Link>
                          <button
                            onClick={() => handleRemoveMentor(mentor._id, mentor.mentorId.name)}
                            disabled={removingMentorId === mentor._id}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Remove mentor from mission"
                          >
                            {removingMentorId === mentor._id ? (
                              <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
