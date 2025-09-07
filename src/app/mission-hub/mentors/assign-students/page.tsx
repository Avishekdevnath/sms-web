"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserPlus2, Target, ArrowLeft, Users, UserCheck2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

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
  studentId?: string;
  role: string;
}

interface MissionMentor {
  _id: string;
  mentorId: {
    _id: string;
    name: string;
    email: string;
  };
  role: 'primary' | 'secondary' | 'moderator';
  maxStudents: number;
  currentWorkload: number;
  status: 'active' | 'inactive' | 'overloaded';
}

interface MentorshipGroup {
  _id: string;
  groupName: string;
  maxStudents?: number;
  currentStudentCount: number;
  status: 'active' | 'inactive';
}

export default function AssignStudentsPage() {
  const [mission, setMission] = useState<Mission | null>(null);
  const [mentors, setMentors] = useState<MissionMentor[]>([]);
  const [groups, setGroups] = useState<MentorshipGroup[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [assignmentType, setAssignmentType] = useState<'mentor' | 'group'>('mentor');
  const [selectedMentor, setSelectedMentor] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isPrimaryMentor, setIsPrimaryMentor] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMission();
  }, []);

  useEffect(() => {
    if (mission) {
      fetchMentors();
      fetchGroups();
      fetchStudents();
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
      setError('Failed to fetch mission data');
    } finally {
      setLoading(false);
    }
  };

  const fetchMentors = async () => {
    if (!mission) return;
    
    try {
      const response = await fetch(`/api/v2/mission-mentors?missionId=${mission._id}&status=active`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          // Transform V2 data to match expected format
          const transformedMentors = data.data.map((mentor: any) => ({
            _id: mentor._id,
            mentorId: {
              _id: mentor.mentorId._id,
              name: mentor.mentorId.name,
              email: mentor.mentorId.email
            },
            role: mentor.role,
            maxStudents: mentor.maxStudents,
            currentWorkload: mentor.currentStudents || 0,
            status: mentor.status
          }));
          setMentors(transformedMentors);
        }
      }
    } catch (error) {
      console.error('Failed to fetch mentors:', error);
    }
  };

  const fetchGroups = async () => {
    if (!mission) return;
    
    try {
      const response = await fetch(`/api/v2/mentorship-groups?missionId=${mission._id}&status=active`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          // Transform V2 data to match expected format
          const transformedGroups = data.data.map((group: any) => ({
            _id: group._id,
            groupName: group.name,
            description: group.description,
            mentors: group.mentorIds?.map((mentorId: any) => ({
              mentorId: {
                _id: mentorId._id,
                name: mentorId.name,
                email: mentorId.email
              },
              role: 'primary' // Default role, could be enhanced
            })) || [],
            students: group.studentIds?.map((studentId: any) => ({
              _id: studentId._id,
              name: studentId.name,
              email: studentId.email
            })) || [],
            status: group.status,
            currentStudentCount: group.studentIds?.length || 0
          }));
          setGroups(transformedGroups);
        }
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    }
  };

  const fetchStudents = async () => {
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
            studentId: student.studentId?.studentId || 'Unknown',
            role: 'student'
          }));
          setStudents(transformedStudents);
        }
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
    }
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
    
    if (selectedStudents.length === 0) {
      setError('Please select at least one student');
      return;
    }

    if (assignmentType === 'mentor' && !selectedMentor) {
      setError('Please select a mentor');
      return;
    }

    if (assignmentType === 'group' && !selectedGroup) {
      setError('Please select a group');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      let response;
      
      if (assignmentType === 'mentor') {
        // Use V2 API for mentor assignment
        response = await fetch('/api/v2/mission-mentors/assign-students', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            missionId: mission?._id,
            mentorId: selectedMentor,
            studentIds: selectedStudents,
            isPrimaryMentor
          }),
        });
      } else {
        // Use V2 API for group assignment
        response = await fetch('/api/v2/mentorship-groups/assign-students', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            groupId: selectedGroup,
            studentIds: selectedStudents,
          }),
        });
      }

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSuccess(`Successfully assigned ${selectedStudents.length} student(s)`);
          setSelectedStudents([]);
          setSelectedMentor('');
          setSelectedGroup('');
          setIsPrimaryMentor(false);
          
          // Refresh data
          fetchMentors();
          fetchGroups();
        } else {
          setError(data.message || 'Failed to assign students');
        }
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to assign students');
      }
    } catch (error) {
      console.error('Failed to assign students:', error);
      setError('Failed to assign students');
    } finally {
      setSubmitting(false);
    }
  };

  const getAvailableStudents = () => {
    return students.filter(student => 
      student.role === 'student' && 
      !selectedStudents.includes(student._id)
    );
  };

  const getSelectedStudentsInfo = () => {
    return students.filter(student => selectedStudents.includes(student._id));
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
        <p className="text-gray-600">Please select a mission to assign students.</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Assign Students</h1>
            <p className="text-gray-600 mt-1">Assign students to mentors or groups in {mission.code} - {mission.title}</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assignment Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignment Details</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Assignment Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assignment Type
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="mentor"
                    checked={assignmentType === 'mentor'}
                    onChange={(e) => setAssignmentType(e.target.value as 'mentor' | 'group')}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Individual Mentor</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="group"
                    checked={assignmentType === 'group'}
                    onChange={(e) => setAssignmentType(e.target.value as 'mentor' | 'group')}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Mentorship Group</span>
                </label>
              </div>
            </div>

            {/* Mentor Selection */}
            {assignmentType === 'mentor' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Mentor
                  </label>
                  <select
                    value={selectedMentor}
                    onChange={(e) => setSelectedMentor(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="">Choose a mentor...</option>
                    {mentors
                      .filter(mentor => mentor.status === 'active')
                      .map(mentor => (
                        <option key={mentor._id} value={mentor._id}>
                          {mentor.mentorId.name} ({mentor.role}) - {mentor.currentWorkload}/{mentor.maxStudents} students
                        </option>
                      ))}
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPrimaryMentor"
                    checked={isPrimaryMentor}
                    onChange={(e) => setIsPrimaryMentor(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="isPrimaryMentor" className="text-sm text-gray-700">
                    Set as primary mentor for these students
                  </label>
                </div>
              </>
            )}

            {/* Group Selection */}
            {assignmentType === 'group' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Group
                </label>
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="">Choose a group...</option>
                  {groups
                    .filter(group => group.status === 'active')
                    .map(group => (
                      <option key={group._id} value={group._id}>
                        {group.groupName} - {group.currentStudentCount}/{group.maxStudents || '∞'} students
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || selectedStudents.length === 0}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Assigning...' : `Assign ${selectedStudents.length} Student(s)`}
            </button>
          </form>
        </div>

        {/* Student Selection */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Students</h3>
          
          {/* Selected Students */}
          {selectedStudents.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Selected Students ({selectedStudents.length})
              </h4>
              <div className="space-y-2">
                {getSelectedStudentsInfo().map(student => (
                  <div key={student._id} className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-900">{student.name}</span>
                      <span className="text-xs text-gray-500 ml-2">({student.studentId || student.email})</span>
                    </div>
                    <button
                      onClick={() => handleStudentToggle(student._id)}
                      className="text-purple-600 hover:text-purple-800"
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available Students */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Available Students ({getAvailableStudents().length})
            </h4>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {getAvailableStudents().map(student => (
                <label key={student._id} className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student._id)}
                    onChange={() => handleStudentToggle(student._id)}
                    className="mr-3"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">{student.name}</span>
                    <span className="text-xs text-gray-500 ml-2">({student.studentId || student.email})</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Summary */}
      {selectedStudents.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <UserCheck2 className="h-5 w-5 text-blue-600" />
            <h4 className="text-sm font-medium text-blue-900">Assignment Summary</h4>
          </div>
          <p className="text-sm text-blue-800">
            Ready to assign {selectedStudents.length} student(s) to{' '}
            {assignmentType === 'mentor' 
              ? mentors.find(m => m._id === selectedMentor)?.mentorId.name || 'selected mentor'
              : groups.find(g => g._id === selectedGroup)?.groupName || 'selected group'
            }
            {isPrimaryMentor && assignmentType === 'mentor' && ' as primary mentor'}
          </p>
        </div>
      )}
    </div>
  );
}
