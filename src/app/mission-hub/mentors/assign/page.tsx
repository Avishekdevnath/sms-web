"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Target, ArrowLeft, Plus, CheckCircle, AlertCircle, CheckSquare, Square } from 'lucide-react';
import Link from 'next/link';

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

interface User {
  _id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

export default function AssignMentorsPage() {
  const router = useRouter();
  const [mission, setMission] = useState<Mission | null>(null);
  const [availableMentors, setAvailableMentors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [bulkAssigning, setBulkAssigning] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState('');
  
  // Selection state
  const [selectedMentors, setSelectedMentors] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    fetchMission();
  }, []);

  useEffect(() => {
    if (mission) {
      fetchAvailableMentors();
    }
  }, [mission]);

  // Update select all when individual selections change
  useEffect(() => {
    if (selectedMentors.size === 0) {
      setSelectAll(false);
    } else if (selectedMentors.size === availableMentors.length) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedMentors, availableMentors.length]);

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
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableMentors = async () => {
    try {
      // First get all mentors
      const mentorsResponse = await fetch('/api/users?role=mentor&isActive=true');
      if (mentorsResponse.ok) {
        const mentorsData = await mentorsResponse.json();
        if (mentorsData.success && mentorsData.data?.users) {
          const allMentors = mentorsData.data.users;
          
          // Then get already assigned mentors for this mission
          if (mission) {
            const assignedResponse = await fetch(`/api/v2/mission-mentors?missionId=${mission._id}`);
            if (assignedResponse.ok) {
              const assignedData = await assignedResponse.json();
              if (assignedData.success && assignedData.data) {
                // Fixed: Use mentorId._id or mentorId string properly
                const assignedMentorIds = assignedData.data.map((m: any) => 
                  typeof m.mentorId === 'string' ? m.mentorId : m.mentorId._id
                );
                console.log('Assigned mentor IDs:', assignedMentorIds);
                // Filter out already assigned mentors
                const availableMentors = allMentors.filter((mentor: any) => 
                  !assignedMentorIds.includes(mentor._id)
                );
                console.log('Available mentors after filtering:', availableMentors.length);
                setAvailableMentors(availableMentors);
                return;
              }
            }
          }
          
          // If no mission or error fetching assigned mentors, show all mentors
          setAvailableMentors(allMentors);
        }
      }
    } catch (error) {
      console.error('Failed to fetch mentors:', error);
    }
  };

  const handleSelectMentor = (mentorId: string) => {
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

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedMentors(new Set());
    } else {
      setSelectedMentors(new Set(availableMentors.map(m => m._id)));
    }
  };

  const handleAssignMentor = async (mentorId: string) => {
    if (!mission) return;
    
    setAssigning(mentorId);
    setError('');

    try {
      const response = await fetch('/api/v2/mission-mentors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          missionId: mission._id,
          mentorId,
          role: 'advisor',
          maxStudents: 0, // Unlimited capacity by default
          specialization: [],
          responsibilities: []
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(mentorId);
        // Remove the mentor from the list after successful assignment
        setAvailableMentors(prev => prev.filter(m => m._id !== mentorId));
        // Remove from selected mentors
        setSelectedMentors(prev => {
          const newSet = new Set(prev);
          newSet.delete(mentorId);
          return newSet;
        });
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
        // Refresh the available mentors list to ensure it's up to date
        setTimeout(() => fetchAvailableMentors(), 1000);
      } else {
        setError(data.error || 'Failed to assign mentor');
      }
    } catch (error) {
      console.error('Error assigning mentor:', error);
      setError('An unexpected error occurred');
    } finally {
      setAssigning(null);
    }
  };

  const handleBulkAssign = async () => {
    if (!mission || selectedMentors.size === 0) return;
    
    setBulkAssigning(true);
    setError('');

    try {
      const mentorIds = Array.from(selectedMentors);
      let successCount = 0;
      let errorCount = 0;

      // Assign mentors one by one
      for (const mentorId of mentorIds) {
        try {
          const response = await fetch('/api/v2/mission-mentors', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              missionId: mission._id,
              mentorId,
              role: 'advisor',
              maxStudents: 0, // Unlimited capacity by default
              specialization: [],
              responsibilities: []
            }),
          });

          if (response.ok) {
            successCount++;
            // Remove the mentor from the list
            setAvailableMentors(prev => prev.filter(m => m._id !== mentorId));
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
        }
      }

      // Clear selection
      setSelectedMentors(new Set());
      
      if (errorCount === 0) {
        setSuccess('bulk');
        setTimeout(() => setSuccess(null), 3000);
      } else if (successCount > 0) {
        setError(`${successCount} mentors assigned successfully, ${errorCount} failed`);
      } else {
        setError('Failed to assign any mentors');
      }
    } catch (error) {
      console.error('Error in bulk assignment:', error);
      setError('An unexpected error occurred during bulk assignment');
    } finally {
      setBulkAssigning(false);
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
        <p className="text-gray-600">Please select a mission to assign mentors.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/mission-hub/mentors/mission-mentors"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Mission Mentors
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Assign Mentors to Mission</h1>
            <p className="text-gray-600 mt-1">Add mentors to {mission.code} - {mission.title}</p>
          </div>
        </div>
      </div>

      {/* Mission Summary - Simplified */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Target className="h-5 w-5 text-purple-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{mission.code} - {mission.title}</h3>
              <p className="text-sm text-gray-600">Batch: {mission.batchId?.code || 'No Batch'}</p>
            </div>
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

      {/* Success Display */}
      {success === 'bulk' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-green-800">All selected mentors assigned successfully!</p>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {availableMentors.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-semibold text-gray-900">Bulk Actions</h3>
              <span className="text-sm text-gray-600">
                {selectedMentors.size} of {availableMentors.length} mentors selected
              </span>
            </div>
            {selectedMentors.size > 0 && (
              <button
                onClick={handleBulkAssign}
                disabled={bulkAssigning}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {bulkAssigning ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Assigning {selectedMentors.size} Mentors...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Assign {selectedMentors.size} Mentors
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mentors Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Available Mentors ({availableMentors.length})</h3>
              <p className="text-sm text-gray-600 mt-1">Select mentors and add them to this mission</p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">
                {selectedMentors.size} of {availableMentors.length} selected
              </span>
              <button
                onClick={handleSelectAll}
                className="inline-flex items-center space-x-2 px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                {selectAll ? (
                  <CheckSquare className="h-4 w-4 text-purple-600" />
                ) : (
                  <Square className="h-4 w-4 text-gray-400" />
                )}
                <span className="text-gray-700">
                  {selectAll ? 'Deselect All' : 'Select All'}
                </span>
              </button>
            </div>
          </div>
        </div>
        
        {availableMentors.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">🎉</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">All Mentors Assigned!</h3>
            <p className="text-gray-600">All available mentors have been assigned to this mission.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-12 px-3 py-3 text-center">
                    <span className="sr-only">Select</span>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mentor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {availableMentors.map((mentor) => (
                  <tr key={mentor._id} className="hover:bg-gray-50">
                    <td className="w-12 px-3 py-4 text-center">
                      <button
                        onClick={() => handleSelectMentor(mentor._id)}
                        className="flex items-center justify-center w-5 h-5 hover:bg-gray-100 rounded"
                      >
                        {selectedMentors.has(mentor._id) ? (
                          <CheckSquare className="h-5 w-5 text-purple-600" />
                        ) : (
                          <Square className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-purple-600">
                              {mentor.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{mentor.name}</div>
                          <div className="text-sm text-gray-500">{mentor.role}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{mentor.userId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{mentor.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        mentor.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {mentor.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {success === mentor._id ? (
                        <span className="inline-flex items-center px-3 py-1 text-sm font-medium text-green-800 bg-green-100 rounded-full">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Added!
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAssignMentor(mentor._id)}
                          disabled={assigning === mentor._id}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {assigning === mentor._id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Adding...
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-1" />
                              Add to Mission
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={async () => {
              setRefreshing(true);
              setError('');
              setSuccess(null);
              await fetchAvailableMentors();
              setRefreshing(false);
            }}
            disabled={refreshing}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {refreshing ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Refreshing...
              </>
            ) : (
              'Refresh List'
            )}
          </button>
          <Link
            href="/mission-hub/mentors/mission-mentors"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            View Mission Mentors
          </Link>
          <Link
            href="/mission-hub/groups"
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            Group Management
          </Link>
        </div>
      </div>
    </div>
  );
}
