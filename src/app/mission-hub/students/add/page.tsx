"use client";

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/hooks/useAppSelector';
import { selectSelectedMission } from '@/store/missionHubSlice';
import { Users, UserPlus, Target, ArrowRight, Search, Filter, RefreshCw, UserCheck } from 'lucide-react';

interface Student {
  _id: string;
  name: string;
  email: string;
  studentId: string;
  batchId?: {
    _id: string;
    code: string;
    name: string;
  };
  status: 'active' | 'inactive' | 'graduated';
  profile?: {
    phone?: string;
    address?: string;
    dateOfBirth?: string;
  };
}

interface MissionStudent {
  _id: string;
  studentId: string;
  missionId: string;
  status: 'active' | 'deactive' | 'irregular' | 'completed' | 'dropped' | 'on-hold';
  enrollmentDate: string;
  progress: number;
}

export default function AddStudentsPage() {
  const selectedMission = useAppSelector(selectSelectedMission);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<MissionStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBatch, setFilterBatch] = useState('all');

  useEffect(() => {
    if (selectedMission) {
      fetchAvailableStudents();
      fetchEnrolledStudents();
    }
  }, [selectedMission]);

  const fetchAvailableStudents = async () => {
    try {
      setLoading(true);
      // Fetch students with profiles from the V2 API
      const response = await fetch('/api/v2/students?hasProfile=true');
      if (response.ok) {
        const data = await response.json();
        console.log('📊 API Response:', data);
        setAvailableStudents(data.students || []);
        console.log('📊 Available Students:', data.students || []);
      } else {
        console.error('Failed to fetch students:', response.statusText);
        const errorData = await response.json();
        console.error('Error details:', errorData);
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrolledStudents = async () => {
    try {
      const response = await fetch(`/api/v2/missions/${selectedMission?._id}/students`);
      if (response.ok) {
        const data = await response.json();
        setEnrolledStudents(data.students || []);
      }
    } catch (error) {
      console.error('Failed to fetch enrolled students:', error);
    }
  };

  const handleStudentSelection = (studentId: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const handleAddStudents = async () => {
    if (selectedStudents.size === 0 || !selectedMission) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/v2/missions/${selectedMission._id}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentIds: Array.from(selectedStudents)
        })
      });

      if (response.ok) {
        const result = await response.json();
        setSelectedStudents(new Set());
        fetchEnrolledStudents();
        alert(result.message || 'Students added successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to add students: ${error.error || error.message}`);
      }
    } catch (error) {
      console.error('Failed to add students:', error);
      alert('Failed to add students');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = availableStudents.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.studentId.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatusFilter = filterStatus === 'all' || student.status === filterStatus;
    
    const matchesBatchFilter = filterBatch === 'all' || student.batchId?.code === filterBatch;
    
    // Filter out students already enrolled in this mission
    const notEnrolled = !enrolledStudents.some(enrolled => enrolled.studentId === student._id);
    
    return matchesSearch && matchesStatusFilter && matchesBatchFilter && notEnrolled;
  });

  // Get unique batch codes for filtering
  const batchOptions = ['all', ...Array.from(new Set(availableStudents.map(s => s.batchId?.code).filter(Boolean)))];

  if (!selectedMission) {
    return (
      <div className="text-center py-12">
        <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Mission Selected</h3>
        <p className="text-gray-600">Please select a mission from the sidebar to add students.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Students to Mission</h1>
          <p className="text-gray-600 mt-1">
            Mission: {selectedMission.code} - {selectedMission.title}
          </p>
        </div>
      </div>

      {/* Mission Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{enrolledStudents.length}</div>
            <div className="text-sm text-gray-600">Currently Enrolled</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{selectedMission.maxStudents || '∞'}</div>
            <div className="text-sm text-gray-600">Maximum Capacity</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {selectedMission.maxStudents ? selectedMission.maxStudents - enrolledStudents.length : '∞'}
            </div>
            <div className="text-sm text-gray-600">Available Spots</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{selectedStudents.size}</div>
            <div className="text-sm text-gray-600">Selected to Add</div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow p-3">
        <div className="flex flex-col md:flex-row gap-2">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search students by name, email, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="graduated">Graduated</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={filterBatch}
              onChange={(e) => setFilterBatch(e.target.value)}
              className="px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent"
            >
              {batchOptions.map(batch => (
                <option key={batch} value={batch}>
                  {batch === 'all' ? 'All Batches' : `Batch: ${batch}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Available Students */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Available Students ({filteredStudents.length})
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Select students with profiles to add to this mission
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchAvailableStudents}
                disabled={loading}
                className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              {selectedStudents.size > 0 && (
                <button
                  onClick={handleAddStudents}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  {loading ? 'Adding...' : `Add ${selectedStudents.size} Student${selectedStudents.size !== 1 ? 's' : ''}`}
                </button>
              )}
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading students...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            {availableStudents.length === 0 ? (
              <div>
                <Users className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <h3 className="text-sm font-medium text-gray-900 mb-1">No Students Available</h3>
                <p className="text-xs text-gray-600">
                  No students with profiles found in the system.
                </p>
              </div>
            ) : (
              <div>
                <UserCheck className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <h3 className="text-sm font-medium text-gray-900 mb-1">No Available Students</h3>
                <p className="text-xs text-gray-600">
                  All students with profiles are already enrolled in this mission or match your filters.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedStudents.size === filteredStudents.length && filteredStudents.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStudents(new Set(filteredStudents.map(s => s._id)));
                        } else {
                          setSelectedStudents(new Set());
                        }
                      }}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Batch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Profile
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedStudents.has(student._id)}
                        onChange={() => handleStudentSelection(student._id)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                        <div className="text-sm text-gray-500">{student.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.studentId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.batchId?.code || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`
                        inline-flex px-2 py-1 text-xs font-semibold rounded-full
                        ${student.status === 'active' ? 'bg-green-100 text-green-800' :
                          student.status === 'inactive' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'}
                      `}>
                        {student.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`
                        inline-flex px-2 py-1 text-xs font-semibold rounded-full
                        ${student.profile ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                      `}>
                        {student.profile ? 'Complete' : 'Incomplete'}
                      </span>
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
