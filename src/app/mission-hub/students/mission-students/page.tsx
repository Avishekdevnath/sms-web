"use client";

import { useState, useEffect } from 'react';
import { Search, UserCog, UserCheck, UserX, Users, UserPlus, Target } from 'lucide-react';
import Link from 'next/link';

interface Student {
  _id: string;
  name: string;
  email: string;
  studentId: string;
  status: string;
  progress: number;
  batch: {
    code: string;
    title: string;
  } | null;
  mentor: {
    _id: string;
    name: string;
    email: string;
  } | null;
  enrolledAt: string;
  isActive?: boolean;
}

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
  students: string[];
  studentCount: number;
}

interface Mentor {
  _id: string;
  name: string;
  email: string;
  studentsCount: number;
  maxStudents: number;
}

export default function MissionStudentsPage() {
  const [mission, setMission] = useState<Mission | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMentorAssignmentModal, setShowMentorAssignmentModal] = useState(false);
  const [mentorAssignmentGroups, setMentorAssignmentGroups] = useState<Array<{
    mentorId: string;
    mentorName: string;
    studentIds: string[];
    count: number;
  }>>([]);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    fetchMissionAndData();
  }, [searchTerm]);

  // Helper function to get auth token
  const getAuthHeaders = () => {
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('token='))
      ?.split('=')[1];
    
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  const fetchMissionAndData = async () => {
    try {
      // Get the current mission
      const missionResponse = await fetch('/api/mission-hub/missions', {
        headers: getAuthHeaders()
      });
      if (missionResponse.ok) {
        const missionData = await missionResponse.json();
        if (missionData.success && missionData.data?.missions?.length > 0) {
          const currentMission = missionData.data.missions[0];
          setMission(currentMission);
          
          // Fetch mentors and students
          await Promise.all([
            fetchMentors(),
            fetchStudents(currentMission)
          ]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch mission and data:', error);
    }
  };

  const fetchMentors = async () => {
    try {
      const response = await fetch('/api/mission-hub/mentors', {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.mentors) {
          setMentors(data.data.mentors || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch mentors:', error);
    }
  };

  const fetchStudents = async (currentMission: Mission) => {
    try {
      setLoading(true);
      
      // Fetch students assigned to this mission
      const params = new URLSearchParams();
      params.append('missionId', currentMission._id);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await fetch(`/api/mission-hub/students?${params}`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.students) {
          setStudents(data.data.students || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromMission = async (studentId: string) => {
    if (!mission) return;

    try {
      console.log('Removing student:', studentId, 'from mission:', mission._id);
      console.log('Request body:', { studentId });
      
      const response = await fetch(`/api/mission-hub/missions/${mission._id}/remove-student`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ studentId })
      });

      console.log('Remove student response status:', response.status);
      
      if (response.ok) {
        // Refresh mission data first
        const updatedMissionResponse = await fetch('/api/mission-hub/missions', {
          headers: getAuthHeaders()
        });
        if (updatedMissionResponse.ok) {
          const missionData = await updatedMissionResponse.json();
          if (missionData.success && missionData.data?.missions?.length > 0) {
            const updatedMission = missionData.data.missions[0];
            setMission(updatedMission);
            
            // Now fetch students with updated mission data
            await fetchStudents(updatedMission);
          }
        }
        alert('Student removed from mission successfully');
      } else {
        // Get error details
        const errorData = await response.json();
        console.error('Remove student error:', errorData);
        alert(`Failed to remove student: ${errorData.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to remove student from mission:', error);
      alert('Failed to remove student from mission');
    }
  };

  const handleDeactivateStudent = async (studentId: string) => {
    try {
      const response = await fetch(`/api/mission-hub/students/${studentId}/deactivate`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        await fetchStudents(mission!);
        alert('Student deactivated successfully');
      }
    } catch (error) {
      console.error('Failed to deactivate student:', error);
      alert('Failed to deactivate student');
    }
  };

  const handleRemoveMentor = async (studentId: string) => {
    if (!mission) return;

    try {
      const response = await fetch('/api/mission-hub/students/remove-mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          studentId,
          missionId: mission._id 
        })
      });

      if (response.ok) {
        await fetchStudents(mission);
        alert('Mentor removed successfully');
      } else {
        const error = await response.json();
        alert(`Failed to remove mentor: ${error.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to remove mentor:', error);
      alert('Failed to remove mentor');
    }
  };

  const openMentorAssignmentModal = () => {
            if (!mission || !students?.length) {
      alert('No students assigned to this mission yet.');
      return;
    }
    
    // Create initial mentor assignment groups with current assignments
    const groups = mentors.map(mentor => {
      // Find students currently assigned to this mentor
      const currentStudentIds = students
        .filter(student => student.mentor?._id === mentor._id)
        .map(student => student._id);
      
      return {
      mentorId: mentor._id,
      mentorName: mentor.name,
        studentIds: currentStudentIds,
        count: currentStudentIds.length
      };
    });
    
    setMentorAssignmentGroups(groups);
    setShowMentorAssignmentModal(true);
  };

  const handleMentorAssignment = async () => {
    try {
      setAssigning(true);
      
      // Process each mentor assignment group
      for (const group of mentorAssignmentGroups) {
        if (group.studentIds.length > 0) {
          const response = await fetch('/api/mission-hub/students/assign-mentor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              studentIds: group.studentIds, 
              mentorId: group.mentorId,
              missionId: mission?._id 
            })
          });

          if (!response.ok) {
            throw new Error(`Failed to assign students to mentor ${group.mentorName}`);
          }
        }
      }

      alert('Mentor assignments completed successfully!');
      setShowMentorAssignmentModal(false);
      await fetchStudents(mission!); // Refresh to show new mentor assignments
      
    } catch (error) {
      console.error('Failed to assign mentors:', error);
      alert('Failed to complete mentor assignments');
    } finally {
      setAssigning(false);
    }
  };

  const updateMentorAssignmentGroup = (mentorId: string, studentIds: string[]) => {
    setMentorAssignmentGroups(prev => 
      prev.map(group => 
        group.mentorId === mentorId 
          ? { ...group, studentIds, count: studentIds.length }
          : group
      )
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading mission students...</p>
        </div>
      </div>
    );
  }

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
        <p className="text-gray-600">Please select a mission to manage students.</p>
      </div>
    );
  }

  if (!students) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mission Students</h1>
          <p className="text-gray-600">Manage students assigned to {mission.code} - {mission.title}</p>
        </div>
        
        <div className="flex space-x-3">
          <Link
            href="/mission-hub/students/add"
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
          >
            <UserPlus size={20} />
            <span>Add More Students</span>
          </Link>
          
          <button
            onClick={openMentorAssignmentModal}
            disabled={!mission.studentCount}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <UserCog size={20} />
            <span>Assign Mentors</span>
          </button>
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Students</dt>
                  <dd className="text-lg font-medium text-gray-900">{students?.length || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserCheck className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">With Mentors</dt>
                  <dd className="text-lg font-medium text-green-900">
                    {students?.filter(s => s.mentor)?.length || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserX className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Need Mentors</dt>
                  <dd className="text-lg font-medium text-yellow-900">
                    {students?.filter(s => !s.mentor)?.length || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserCog className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Mentors</dt>
                  <dd className="text-lg font-medium text-blue-900">
                    {mentors?.filter(m => m.status === 'active')?.length || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Search Students</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, email, or student ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Mentor Status</label>
            <select
              value={searchTerm.includes('mentor:') ? searchTerm.split('mentor:')[1] : 'all'}
              onChange={(e) => {
                if (e.target.value === 'all') {
                  setSearchTerm(searchTerm.replace(/mentor:\w+/, '').trim());
                } else {
                  const newSearch = searchTerm.replace(/mentor:\w+/, '').trim();
                  setSearchTerm(newSearch ? `${newSearch} mentor:${e.target.value}` : `mentor:${e.target.value}`);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Students</option>
              <option value="assigned">With Mentors</option>
              <option value="unassigned">Need Mentors</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Students Assigned to {mission.code}
          </h3>
          <p className="text-sm text-gray-600">
            {students?.length || 0} students found
          </p>
        </div>
        
                    {!students?.length ? (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Assigned</h3>
            <p className="text-gray-600">
              No students have been assigned to this mission yet.
            </p>
            <Link
              href="/mission-hub/students/add"
              className="mt-4 inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              <UserPlus size={16} className="mr-2" />
              Add Students
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mentor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students?.map((student) => (
                  <tr key={student._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-purple-600">
                              {student.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                          <div className="text-sm text-gray-500">{student.email}</div>
                          <div className="text-xs text-gray-400">ID: {student.studentId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{student.batch?.code || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{student.batch?.title || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        student.status === 'active' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full" 
                            style={{ width: `${student.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900">{student.progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {student.mentor ? (
                        <div>
                          <div className="text-sm text-gray-900">{student.mentor.name}</div>
                          <div className="text-sm text-gray-500">{student.mentor.email}</div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">No mentor</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {student.mentor && (
                          <button
                            onClick={() => handleRemoveMentor(student._id)}
                            className="text-orange-600 hover:text-orange-900 flex items-center space-x-1"
                            title="Remove mentor assignment"
                          >
                            <UserCog size={16} />
                            <span>Remove Mentor</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleDeactivateStudent(student._id)}
                          className="text-yellow-600 hover:text-yellow-900 flex items-center space-x-1"
                        >
                          <UserX size={16} />
                          <span>Deactivate</span>
                        </button>
                        <button
                          onClick={() => handleRemoveFromMission(student._id)}
                          className="text-red-600 hover:text-red-900 flex items-center space-x-1"
                        >
                          <UserX size={16} />
                          <span>Remove</span>
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

      {/* Mentor Assignment Modal */}
      {showMentorAssignmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Bulk Mentor Assignment</h3>
              <button
                onClick={() => setShowMentorAssignmentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Mission Information</label>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm font-medium text-blue-800">Mission Code</div>
                    <div className="text-lg font-semibold text-blue-900">{mission?.code}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-blue-800">Title</div>
                    <div className="text-lg font-semibold text-blue-900">{mission?.title}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-blue-800">Batch</div>
                    <div className="text-lg font-semibold text-blue-900">{mission?.batch?.code}</div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-600">
                    <div>
                      Total students: <span className="font-semibold">{students?.length || 0}</span>
                    </div>
                    <div>
                      With mentors: <span className="font-semibold text-green-700">{students?.filter(s => s.mentor)?.length || 0}</span>
                    </div>
                    <div>
                      Need mentors: <span className="font-semibold text-yellow-700">{students?.filter(s => !s.mentor)?.length || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Mentor Assignments Summary */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Mentor Assignments</label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mentors.map(mentor => {
                  const assignedStudents = students?.filter(s => s.mentor?._id === mentor._id) || [];
                  const availableCapacity = mentor.maxStudents === 0 ? Infinity : (mentor.maxStudents || 0) - (mentor.studentsCount || 0);
                  
                  return (
                    <div key={mentor._id} className="p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{mentor.name}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          assignedStudents.length > availableCapacity 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {assignedStudents.length}/{mentor.maxStudents === 0 ? '∞' : mentor.maxStudents}
                    </span>
                      </div>
                      <div className="text-xs text-gray-600">
                        {assignedStudents.length > 0 ? (
                          <div>
                            <div className="font-medium mb-1">Assigned students:</div>
                            {assignedStudents.slice(0, 3).map(student => (
                              <div key={student._id} className="ml-2">• {student.name}</div>
                            ))}
                            {assignedStudents.length > 3 && (
                              <div className="ml-2 text-gray-500">...and {assignedStudents.length - 3} more</div>
                            )}
                          </div>
                        ) : (
                          <div className="text-gray-500">No students assigned</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {mentorAssignmentGroups.map((group) => {
                const mentor = mentors.find(m => m._id === group.mentorId);
                const availableCapacity = mentor?.maxStudents === 0 ? Infinity : (mentor?.maxStudents || 0) - (mentor?.studentsCount || 0);
                const isOverCapacity = group.count > availableCapacity;
                
                return (
                  <div key={group.mentorId} className={`border rounded-lg p-4 ${
                    isOverCapacity ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-gray-900">{group.mentorName}</h4>
                        <p className="text-sm text-gray-600">{mentor?.email}</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${
                          isOverCapacity ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          Capacity: {group.count}/{mentor?.maxStudents === 0 ? '∞' : mentor?.maxStudents}
                        </div>
                        <div className="text-xs text-gray-500">
                          Available: {Math.max(0, availableCapacity)}
                        </div>
                      </div>
                    </div>

                    {/* Student Assignment Interface */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Assign Students to {group.mentorName}
                      </label>
                      
                      {/* Available Students */}
                      <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2">
                        {students?.map((student) => {
                          const isAssigned = group.studentIds.includes(student._id);
                          const isAssignedToOtherMentor = mentorAssignmentGroups.some(g => 
                            g.mentorId !== group.mentorId && g.studentIds.includes(student._id)
                          );
                          
                          return (
                            <label key={student._id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isAssigned}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    // Remove from other mentors first
                                    setMentorAssignmentGroups(prev => 
                                      prev.map(g => ({
                                        ...g,
                                        studentIds: g.mentorId === group.mentorId 
                                          ? [...g.studentIds, student._id]
                                          : g.studentIds.filter(id => id !== student._id)
                                      }))
                                    );
                                  } else {
                                    // Remove from current mentor
                                    setMentorAssignmentGroups(prev => 
                                      prev.map(g => 
                                        g.mentorId === group.mentorId 
                                          ? { ...g, studentIds: g.studentIds.filter(id => id !== student._id) }
                                          : g
                                      )
                                    );
                                  }
                                }}
                                disabled={isAssignedToOtherMentor && !isAssigned}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {student.name}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  {student.studentId} • {student.batch?.code || 'No Batch'}
                                </div>
                              </div>
                              {isAssignedToOtherMentor && !isAssigned && (
                                <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                                  Assigned to other mentor
                                </span>
                              )}
                            </label>
                          );
                        })}
                      </div>

                      {/* Currently Assigned Students */}
                      {group.studentIds.length > 0 && (
                        <div className="mt-3">
                          <div className="text-sm font-medium text-gray-700 mb-2">
                            Currently assigned ({group.count}):
                          </div>
                          <div className="space-y-1">
                            {group.studentIds.map(studentId => {
                              const student = students?.find(s => s._id === studentId);
                              return student ? (
                                <div key={studentId} className="flex items-center justify-between text-sm bg-blue-50 px-3 py-2 rounded">
                                  <span className="text-blue-900">{student.name}</span>
                                  <button
                                    onClick={() => {
                                      setMentorAssignmentGroups(prev => 
                                        prev.map(g => 
                                          g.mentorId === group.mentorId 
                                            ? { ...g, studentIds: g.studentIds.filter(id => id !== studentId) }
                                            : g
                                        )
                                      );
                                    }}
                                    className="text-blue-600 hover:text-blue-800 text-xs"
                                  >
                                    Remove
                                  </button>
                                </div>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Assignment Progress and Warnings */}
            <div className="space-y-4 mb-6">
              {/* Assignment Progress */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Assignment Progress</h4>
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm text-blue-700 mb-1">
                      <span>Students assigned to mentors</span>
                      <span>{(() => {
                        const assignedStudentIds = new Set(
                          mentorAssignmentGroups.flatMap(group => group.studentIds)
                        );
                        return assignedStudentIds.size;
                      })()}/{students?.length || 0}</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ 
                          width: `${(() => {
                            const assignedStudentIds = new Set(
                              mentorAssignmentGroups.flatMap(group => group.studentIds)
                            );
                            return students?.length > 0 ? (assignedStudentIds.size / (students?.length || 1)) * 100 : 0;
                          })()}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-900">
                      {Math.round((() => {
                        const assignedStudentIds = new Set(
                          mentorAssignmentGroups.flatMap(group => group.studentIds)
                        );
                        return students?.length > 0 ? (assignedStudentIds.size / (students?.length || 1)) * 100 : 0;
                      })())}%
                    </div>
                    <div className="text-xs text-blue-600">Complete</div>
                  </div>
                </div>
              </div>

              {/* Unassigned Students Summary */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">Unassigned Students</h4>
                <div className="text-sm text-yellow-700">
                  {(() => {
                    const assignedStudentIds = new Set(
                      mentorAssignmentGroups.flatMap(group => group.studentIds)
                    );
                    const unassignedStudents = students?.filter(student => !assignedStudentIds.has(student._id)) || [];
                    
                    if (unassignedStudents.length === 0) {
                      return "All students have been assigned to mentors! 🎉";
                    }
                    
                    return (
                      <div>
                        <span className="font-medium">{unassignedStudents.length} student(s) still need mentor assignment:</span>
                        <div className="mt-2 space-y-1">
                          {unassignedStudents.map(student => (
                            <div key={student._id} className="text-xs">
                              • {student.name} ({student.studentId})
                </div>
              ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Capacity Warnings */}
              {(() => {
                const overCapacityMentors = mentorAssignmentGroups.filter(group => {
                  const mentor = mentors.find(m => m._id === group.mentorId);
                  const availableCapacity = (mentor?.maxStudents || 10) - (mentor?.studentsCount || 0);
                  return group.count > availableCapacity;
                });

                if (overCapacityMentors.length === 0) return null;

                return (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-medium text-red-800 mb-2">⚠️ Capacity Warnings</h4>
                    <div className="text-sm text-red-700">
                      The following mentors will exceed their capacity:
                      <div className="mt-2 space-y-1">
                        {overCapacityMentors.map(group => {
                          const mentor = mentors.find(m => m._id === group.mentorId);
                          const availableCapacity = (mentor?.maxStudents || 10) - (mentor?.studentsCount || 0);
                          return (
                            <div key={group.mentorId} className="text-xs">
                              • <span className="font-medium">{mentor?.name}</span>: {group.count} students (exceeds by {group.count - availableCapacity})
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-6">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Total students to assign:</span> {
                  mentorAssignmentGroups.reduce((total, group) => total + group.count, 0)
                } / {students?.length || 0}
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Mentors involved:</span> {
                  mentorAssignmentGroups.filter(group => group.count > 0).length
                }
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Capacity warnings:</span> {
                  mentorAssignmentGroups.filter(group => {
                    const mentor = mentors.find(m => m._id === group.mentorId);
                    const availableCapacity = (mentor?.maxStudents || 10) - (mentor?.studentsCount || 0);
                    return group.count > availableCapacity;
                  }).length
                }
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowMentorAssignmentModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleMentorAssignment}
                disabled={assigning || mentorAssignmentGroups.every(group => group.count === 0)}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {assigning ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Assigning Mentors...
                  </span>
                ) : (
                  'Complete Mentor Assignment'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
