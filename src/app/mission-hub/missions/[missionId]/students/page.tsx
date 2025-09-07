"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Search, UserCog, UserCheck, UserX, Target, ArrowLeft, Users, UserPlus } from 'lucide-react';
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
    name: string;
    email: string;
  } | null;
  enrolledAt: string;
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
}

interface Mentor {
  _id: string;
  name: string;
  email: string;
  studentsCount: number;
  maxStudents: number;
}

export default function MissionStudentsPage() {
  const params = useParams();
  const router = useRouter();
  const missionId = params.missionId as string;
  
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
    if (missionId) {
      fetchMission();
      fetchMentors();
    }
  }, [missionId]);

  useEffect(() => {
    if (mission) {
      fetchStudents();
    }
  }, [mission, searchTerm]);

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
    }
  };

  const fetchMentors = async () => {
    try {
      const response = await fetch('/api/mission-hub/mentors');
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

  const fetchStudents = async () => {
    try {
      setLoading(true);
      
      // Fetch students assigned to this mission
      const params = new URLSearchParams();
      params.append('missionId', missionId);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await fetch(`/api/mission-hub/students?${params}`);
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
    try {
      const response = await fetch(`/api/mission-hub/missions/${missionId}/remove-student`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId })
      });

      if (response.ok) {
        fetchStudents();
        alert('Student removed from mission successfully');
      }
    } catch (error) {
      console.error('Failed to remove student from mission:', error);
      alert('Failed to remove student from mission');
    }
  };

  const openMentorAssignmentModal = () => {
    if (!mission || mission.students.length === 0) {
      alert('No students assigned to this mission yet.');
      return;
    }
    
    // Create initial mentor assignment groups
    const groups = mentors.map(mentor => ({
      mentorId: mentor._id,
      mentorName: mentor.name,
      studentIds: [],
      count: 0
    }));
    
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
              missionId: missionId
            })
          });

          if (!response.ok) {
            throw new Error(`Failed to assign students to mentor ${group.mentorName}`);
          }
        }
      }

      alert('Mentor assignments completed successfully!');
      setShowMentorAssignmentModal(false);
      fetchStudents(); // Refresh to show new mentor assignments
      
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

  if (!mission) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Mission not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/mission-hub/missions"
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mission Students</h1>
            <p className="text-gray-600">
              {mission.code} - {mission.title} ({mission.batch?.code})
            </p>
          </div>
        </div>
        
        <button
          onClick={openMentorAssignmentModal}
          disabled={!mission.students.length}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          <UserCog size={20} />
          <span>Assign Mentors</span>
        </button>
      </div>

      {/* Mission Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{mission.students.length}</div>
            <div className="text-sm text-gray-600">Students Assigned</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{mission.maxStudents}</div>
            <div className="text-sm text-gray-600">Maximum Capacity</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {Math.round((mission.students.length / mission.maxStudents) * 100)}%
            </div>
            <div className="text-sm text-gray-600">Capacity Used</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex-1">
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
      </div>

      {/* Students List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Students Assigned to {mission.code}
          </h3>
          <p className="text-sm text-gray-600">
            {students.length} students found
          </p>
        </div>
        
        {students.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Assigned</h3>
            <p className="text-gray-600">
              No students have been assigned to this mission yet.
            </p>
            <Link
              href="/mission-hub/students"
              className="mt-4 inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              <UserPlus size={16} className="mr-2" />
              Assign Students
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
                {students.map((student) => (
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
                      <button
                        onClick={() => handleRemoveFromMission(student._id)}
                        className="text-red-600 hover:text-red-900 flex items-center space-x-1"
                      >
                        <UserX size={16} />
                        <span>Remove</span>
                      </button>
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
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Bulk Mentor Assignment</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Mission</label>
              <div className="p-3 bg-gray-50 rounded-md">
                <div className="font-medium">{mission?.code} - {mission?.title}</div>
                <div className="text-sm text-gray-600">{mission?.batch?.code}</div>
                <div className="text-sm text-gray-600">Total students: {mission?.students.length}</div>
              </div>
            </div>

            <div className="space-y-4">
              {mentorAssignmentGroups.map((group) => (
                <div key={group.mentorId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">{group.mentorName}</h4>
                    <span className="text-sm text-gray-600">
                      Capacity: {group.count}/{mentors.find(m => m._id === group.mentorId)?.maxStudents || 10}
                    </span>
                  </div>
                  
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assign students to {group.mentorName}
                    </label>
                    <select
                      multiple
                      value={group.studentIds}
                      onChange={(e) => {
                        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                        updateMentorAssignmentGroup(group.mentorId, selectedOptions);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                    >
                      {students.map((student) => (
                        <option key={student._id} value={student._id}>
                          {student.name} ({student.studentId})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    {group.count} student(s) selected for {group.mentorName}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowMentorAssignmentModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleMentorAssignment}
                disabled={assigning}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {assigning ? 'Assigning Mentors...' : 'Complete Mentor Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
