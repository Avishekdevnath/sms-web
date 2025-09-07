"use client";

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/hooks/useAppSelector';
import { selectSelectedMission } from '@/store/missionHubSlice';
import { Users, UserX, Target, Search, Filter, RefreshCw, UserCheck, AlertTriangle } from 'lucide-react';

interface MissionStudent {
  _id: string;
  studentId: string;
  missionId: string;
  status: 'deactive' | 'dropped' | 'on-hold';
  enrollmentDate: string;
  deactivationDate?: string;
  deactivationReason?: string;
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

export default function DeactivatedStudentsPage() {
  const selectedMission = useAppSelector(selectSelectedMission);
  const [students, setStudents] = useState<MissionStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [reactivatingStudent, setReactivatingStudent] = useState<string | null>(null);

  useEffect(() => {
    if (selectedMission) {
      fetchDeactivatedStudents();
    }
  }, [selectedMission]);

  const fetchDeactivatedStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v2/missions/${selectedMission?._id}/students?status=deactive,dropped,on-hold`);
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
      }
    } catch (error) {
      console.error('Failed to fetch deactivated students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReactivateStudent = async (studentId: string) => {
    try {
      setReactivatingStudent(studentId);
      const response = await fetch(`/api/v2/missions/${selectedMission?._id}/students/${studentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' })
      });

      if (response.ok) {
        fetchDeactivatedStudents();
        alert('Student reactivated successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to reactivate student: ${error.message}`);
      }
    } catch (error) {
      console.error('Failed to reactivate student:', error);
      alert('Failed to reactivate student');
    } finally {
      setReactivatingStudent(null);
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
      case 'deactive': return 'bg-red-100 text-red-800';
      case 'dropped': return 'bg-gray-100 text-gray-800';
      case 'on-hold': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'deactive': return <UserX className="w-4 h-4" />;
      case 'dropped': return <AlertTriangle className="w-4 h-4" />;
      case 'on-hold': return <AlertTriangle className="w-4 h-4" />;
      default: return <UserX className="w-4 h-4" />;
    }
  };

  if (!selectedMission) {
    return (
      <div className="text-center py-12">
        <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Mission Selected</h3>
        <p className="text-gray-600">Please select a mission from the sidebar to view deactivated students.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deactivated Students</h1>
          <p className="text-gray-600 mt-1">
            Mission: {selectedMission.code} - {selectedMission.title}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchDeactivatedStudents}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-red-600">
            {students.filter(s => s.status === 'deactive').length}
          </div>
          <div className="text-sm text-gray-600">Deactive</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-gray-600">
            {students.filter(s => s.status === 'dropped').length}
          </div>
          <div className="text-sm text-gray-600">Dropped</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">
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
              <option value="deactive">Deactive</option>
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
            Deactivated Students ({filteredStudents.length})
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            View and manage students who are no longer active in this mission
          </p>
        </div>
        
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading students...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <UserX className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">No Deactivated Students</h3>
            <p className="text-xs text-gray-600">
              All students in this mission are currently active.
            </p>
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
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(student.status)}`}>
                        {getStatusIcon(student.status)}
                        <span className="ml-1">{student.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="h-2 rounded-full bg-gray-400"
                            style={{ width: `${student.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-600">
                          {student.progress}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(student.enrollmentDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleReactivateStudent(student._id)}
                        disabled={reactivatingStudent === student._id}
                        className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full hover:bg-green-200 disabled:opacity-50 transition-colors"
                        title="Reactivate student"
                      >
                        <UserCheck className="w-3 h-3 mr-1" />
                        {reactivatingStudent === student._id ? 'Reactivating...' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Information Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">About Deactivated Students</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Deactive:</strong> Students who are temporarily inactive but can be reactivated</li>
                <li><strong>Dropped:</strong> Students who have left the mission permanently</li>
                <li><strong>On Hold:</strong> Students whose participation is temporarily suspended</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
