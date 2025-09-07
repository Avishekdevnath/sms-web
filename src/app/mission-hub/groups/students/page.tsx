'use client';

import { useState, useEffect } from 'react';
import { useMissionContext } from '@/context/MissionContext';
import { 
  Users, 
  UserPlus, 
  UserX, 
  Search, 
  Filter, 
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  BarChart3,
  Download
} from 'lucide-react';

interface GroupStudent {
  _id: string;
  studentId: {
    _id: string;
    name: string;
    email: string;
    userId: string;
  };
  mentorshipGroupId?: {
    _id: string;
    name: string;
    description?: string;
  } | null;
  status: 'active' | 'inactive' | 'completed' | 'dropped';
  progress: number;
  attendanceRate: number;
  startedAt: string;
  lastActivity?: string;
  missionNotes?: string;
  // Computed field for group info
  groupInfo?: {
    _id: string;
    name: string;
    description?: string;
  };
}

interface MentorshipGroup {
  _id: string;
  name: string;
  description?: string;
  currentStudents: number;
  maxStudents: number;
  status: 'active' | 'inactive' | 'full' | 'recruiting';
  students: Array<{
    _id: string;
    name: string;
    email: string;
    userId: string;
  }>;
}

export default function GroupStudentManagementPage() {
  const { selectedMission } = useMissionContext();
  const [groupStudents, setGroupStudents] = useState<GroupStudent[]>([]);
  const [groups, setGroups] = useState<MentorshipGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  useEffect(() => {
    if (selectedMission?._id) {
      fetchData();
    }
  }, [selectedMission]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch groups and students in parallel
      const [groupsRes, studentsRes] = await Promise.all([
        fetch(`/api/v2/mentorship-groups?missionId=${selectedMission._id}`),
        fetch(`/api/v2/mission-students?missionId=${selectedMission._id}&populate=group`)
      ]);

      let groupsData = [];
      let studentsData = [];

      if (groupsRes.ok) {
        const groupsResponse = await groupsRes.json();
        groupsData = groupsResponse.data || [];
        setGroups(groupsData);
      }

      if (studentsRes.ok) {
        const studentsResponse = await studentsRes.json();
        studentsData = studentsResponse.data || [];
      }

      // Get students who are in groups (either have mentorshipGroupId or are in group's students array)
      const groupStudents = studentsData.filter((student: any) => {
        // Check if student has mentorshipGroupId set
        if (student.mentorshipGroupId) {
          return true;
        }
        
        // Check if student is in any group's students array
        const isInGroup = groupsData.some((group: any) => 
          group.students.some((groupStudent: any) => 
            groupStudent._id === student.studentId._id
          )
        );
        
        return isInGroup;
      }).map((student: any) => {
        // Add group info for students who don't have mentorshipGroupId set
        if (!student.mentorshipGroupId) {
          const group = groupsData.find((group: any) => 
            group.students.some((groupStudent: any) => 
              groupStudent._id === student.studentId._id
            )
          );
          
          if (group) {
            student.groupInfo = {
              _id: group._id,
              name: group.name,
              description: group.description
            };
          }
        }
        
        return student;
      });
      
      setGroupStudents(groupStudents);
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = groupStudents.filter(student => {
    const matchesSearch = 
      student.studentId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.userId.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Get the group ID (either from mentorshipGroupId or groupInfo)
    const groupId = student.mentorshipGroupId?._id || student.groupInfo?._id;
    const matchesGroup = !filterGroup || groupId === filterGroup;
    const matchesStatus = !filterStatus || student.status === filterStatus;

    return matchesSearch && matchesGroup && matchesStatus;
  });

  const handleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s._id));
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedStudents.length === 0) return;

    try {
      const response = await fetch('/api/v2/mission-students/bulk-update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentIds: selectedStudents,
          updates: { status: newStatus }
        }),
      });

      if (response.ok) {
        await fetchData();
        setSelectedStudents([]);
        setShowBulkActions(false);
      } else {
        setError('Failed to update students');
      }
    } catch (err) {
      setError('Network error occurred');
    }
  };

  const handleRemoveFromGroup = async (studentId: string) => {
    if (!confirm('Are you sure you want to remove this student from their group?')) {
      return;
    }

    try {
      const response = await fetch(`/api/v2/mission-students/${studentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mentorshipGroupId: null
        }),
      });

      if (response.ok) {
        await fetchData();
      } else {
        setError('Failed to remove student from group');
      }
    } catch (err) {
      setError('Network error occurred');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'dropped':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'text-green-600';
    if (progress >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading group students...</p>
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
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Group Student Management</h1>
                <p className="mt-1 text-sm text-gray-500">
                  {selectedMission?.title} • Manage students across mentorship groups
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={fetchData}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </button>
                <button
                  onClick={() => setShowBulkActions(!showBulkActions)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Bulk Actions
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Students</dt>
                    <dd className="text-lg font-medium text-gray-900">{groupStudents.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Students</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {groupStudents.filter(s => s.status === 'active').length}
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
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Groups</dt>
                    <dd className="text-lg font-medium text-gray-900">{groups.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BarChart3 className="h-6 w-6 text-purple-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Avg Progress</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {groupStudents.length > 0 
                        ? Math.round(groupStudents.reduce((sum, s) => sum + s.progress, 0) / groupStudents.length)
                        : 0}%
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search students..."
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Group</label>
              <select
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">All Groups</option>
                {groups.map(group => (
                  <option key={group._id} value={group._id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="completed">Completed</option>
                <option value="dropped">Dropped</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterGroup('');
                  setFilterStatus('');
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {showBulkActions && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-yellow-400 mr-2" />
                <span className="text-sm font-medium text-yellow-800">
                  {selectedStudents.length} student(s) selected
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleBulkStatusChange('active')}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Mark Active
                </button>
                <button
                  onClick={() => handleBulkStatusChange('inactive')}
                  className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Mark Inactive
                </button>
                <button
                  onClick={() => handleBulkStatusChange('completed')}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Mark Completed
                </button>
                <button
                  onClick={() => setSelectedStudents([])}
                  className="px-3 py-1 text-xs bg-gray-400 text-white rounded hover:bg-gray-500"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Students Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Group Students ({filteredStudents.length})
              </h3>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-500">Select All</span>
              </div>
            </div>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {groupStudents.length === 0 
                  ? 'No students are assigned to groups yet.'
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredStudents.map((student) => (
                <li key={student._id} className="px-4 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student._id)}
                        onChange={() => handleStudentSelection(student._id)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded mr-4"
                      />
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-purple-600">
                            {student.studentId.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-gray-900">
                            {student.studentId.name}
                          </p>
                          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(student.status)}`}>
                            {student.status}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <span>{student.studentId.email}</span>
                          <span className="mx-2">•</span>
                          <span>ID: {student.studentId.userId}</span>
                        </div>
                                                 <div className="mt-1 flex items-center text-sm text-gray-500">
                           <span>Group: {student.mentorshipGroupId?.name || student.groupInfo?.name || 'Unknown'}</span>
                           <span className="mx-2">•</span>
                           <span className={`font-medium ${getProgressColor(student.progress)}`}>
                             Progress: {student.progress}%
                           </span>
                           <span className="mx-2">•</span>
                           <span>Attendance: {student.attendanceRate}%</span>
                         </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleRemoveFromGroup(student._id)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                        title="Remove from group"
                      >
                        <UserX className="h-4 w-4" />
                      </button>
                      <button
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
