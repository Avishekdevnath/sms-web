"use client";

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/hooks/useAppSelector';
import { selectSelectedMission } from '@/store/missionHubSlice';
import { Users, UserCheck, UserX, Target, Search, Filter, MoreVertical, Edit, Trash2 } from 'lucide-react';

interface MissionStudent {
  _id: string;
  studentId: string;
  missionId: string;
  status: 'active' | 'deactive' | 'irregular' | 'completed' | 'dropped' | 'on-hold';
  enrollmentDate: string;
  progress: number;
  student: {
    _id: string;
    name: string;
    email: string;
    studentId: string;
    batchId?: {
      _id: string;
      code: string;
      name: string;
    };
  };
}

export default function ManageStudentsPage() {
  const selectedMission = useAppSelector(selectSelectedMission);
  const [students, setStudents] = useState<MissionStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingStudent, setEditingStudent] = useState<string | null>(null);
  const [statusUpdate, setStatusUpdate] = useState('active');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    if (selectedMission) {
      fetchMissionStudents();
    }
  }, [selectedMission]);

  const fetchMissionStudents = async () => {
    try {
      setLoading(true);
      // Fetch only students enrolled in this specific mission
      const response = await fetch(`/api/v2/missions/${selectedMission?._id}/students`);
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
      } else {
        console.error('Failed to fetch mission students:', response.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch mission students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (studentId: string, newStatus: string) => {
    try {
      setUpdatingStatus(studentId);
      console.log('Mission Hub UI: Updating student status:', { studentId, newStatus, missionId: selectedMission?._id });
      
      const response = await fetch(`/api/mission-hub/students/${selectedMission?._id}/${studentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      console.log('Mission Hub UI: Response:', data);

      if (response.ok) {
        // Update local state immediately for better UX
        setStudents(prev => prev.map(student => 
          student.student._id === studentId 
            ? { ...student, status: newStatus as any }
            : student
        ));
        setEditingStudent(null);
        
        // Show success message
        alert('✅ Student status updated successfully!');
        
        // Refresh data from server
        fetchMissionStudents();
      } else {
        alert(`❌ Failed to update status: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to update student status:', error);
      alert('❌ Failed to update student status - Network error');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!confirm('Are you sure you want to remove this student from the mission?')) return;

    try {
      const response = await fetch(`/api/v2/missions/${selectedMission?._id}/students?studentId=${studentId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchMissionStudents();
        alert('Student removed from mission successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to remove student: ${error.message}`);
      }
    } catch (error) {
      console.error('Failed to remove student:', error);
      alert('Failed to remove student');
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.student.studentId.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || student.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'deactive': return 'bg-red-100 text-red-800';
      case 'irregular': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'dropped': return 'bg-gray-100 text-gray-800';
      case 'on-hold': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'text-green-600';
    if (progress >= 60) return 'text-blue-600';
    if (progress >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!selectedMission) {
    return (
      <div className="text-center py-12">
        <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Mission Selected</h3>
        <p className="text-gray-600">Please select a mission from the sidebar to manage students.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Mission Students</h1>
          <p className="text-gray-600 mt-1">
            Mission: {selectedMission.code} - {selectedMission.title}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-purple-600">{students.length}</div>
          <div className="text-sm text-gray-600">Total Students</div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {students.filter(s => s.status === 'active').length}
          </div>
          <div className="text-sm text-gray-600">Active</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {students.filter(s => s.status === 'completed').length}
          </div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {students.filter(s => s.status === 'irregular').length}
          </div>
          <div className="text-sm text-gray-600">Irregular</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-red-600">
            {students.filter(s => s.status === 'deactive').length}
          </div>
          <div className="text-sm text-gray-600">Deactive</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-gray-600">
            {students.filter(s => s.status === 'on-hold').length}
          </div>
          <div className="text-sm text-gray-600">On Hold</div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search students by name, email, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="deactive">Deactive</option>
              <option value="irregular">Irregular</option>
              <option value="completed">Completed</option>
              <option value="dropped">Dropped</option>
              <option value="on-hold">On Hold</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Enrolled Students ({filteredStudents.length})
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage student status and progress for this mission
          </p>
        </div>
        
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading students...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No students found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Batch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enrollment Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{student.student.name}</div>
                        <div className="text-sm text-gray-500">{student.student.email}</div>
                        <div className="text-xs text-gray-400">ID: {student.student.studentId}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.student.batchId?.code || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(student.status)}`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className={`h-2 rounded-full ${getProgressColor(student.progress)}`}
                            style={{ width: `${student.progress}%` }}
                          ></div>
                        </div>
                        <span className={`text-sm font-medium ${getProgressColor(student.progress)}`}>
                          {student.progress}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(student.enrollmentDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        {editingStudent === student._id ? (
                          <div className="flex items-center space-x-2">
                            <select
                              value={statusUpdate}
                              onChange={(e) => setStatusUpdate(e.target.value)}
                              disabled={updatingStatus === student.student._id}
                              className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:opacity-50"
                            >
                              <option value="active">Active</option>
                              <option value="deactive">Deactive</option>
                              <option value="irregular">Irregular</option>
                              <option value="completed">Completed</option>
                              <option value="dropped">Dropped</option>
                              <option value="on-hold">On Hold</option>
                            </select>
                            <button
                              onClick={() => handleStatusUpdate(student.student._id, statusUpdate)}
                              disabled={updatingStatus === student.student._id}
                              className="text-green-600 hover:text-green-900 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Save changes"
                            >
                              {updatingStatus === student.student._id ? (
                                <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                '✓'
                              )}
                            </button>
                            <button
                              onClick={() => setEditingStudent(null)}
                              disabled={updatingStatus === student.student._id}
                              className="text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Cancel"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingStudent(student._id);
                                setStatusUpdate(student.status);
                              }}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Edit status"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRemoveStudent(student._id)}
                              className="text-red-600 hover:text-red-900"
                              title="Remove from mission"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
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
  );
}
