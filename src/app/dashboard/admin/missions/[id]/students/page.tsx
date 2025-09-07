"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, Plus, Search, Filter, Settings, XCircle } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import Pagination from "@/components/Pagination";
import SearchAndFilter from "@/components/SearchAndFilter";
import Modal from "@/components/Modal";
import StudentSelectionModal from "@/components/missions/StudentSelectionModal";
import { useToast } from "@/components/shared/ToastContainer";
import PageTitle from "@/components/shared/PageTitle";

const BASE = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

interface MissionStudent {
  _id: string;
  studentId: {
    _id: string;
    name: string;
    email: string;
    userId: string;
  };
  mentorId?: {
    _id: string;
    name: string;
  };
  status: 'active' | 'deactive' | 'irregular' | 'completed' | 'dropped' | 'on-hold';
  progress: number;
  startedAt: string;
  completedAt?: string;
  courseProgress: Array<{
    courseOfferingId: string;
    progress: number;
    completedAssignments: string[];
    lastActivity: string;
  }>;
}

interface Mission {
  _id: string;
  title: string;
  description?: string;
  batchId: {
    _id: string;
    code: string;
    title: string;
  };
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  students?: MissionStudent[]; // Optional since we add it dynamically
  maxStudents?: number;
  startDate?: string;
  endDate?: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Status Change Modal Component
function StudentStatusModal({ 
  isOpen, 
  onClose, 
  student, 
  onStatusChange, 
  loading 
}: {
  isOpen: boolean;
  onClose: () => void;
  student: MissionStudent | null;
  onStatusChange: (studentId: string, status: string, progress: number) => void;
  loading: boolean;
}) {
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    if (isOpen && student) {
      setSelectedStatus(student.status);
      setProgress(student.progress);
    }
  }, [isOpen, student]);

  if (!isOpen || !student) return null;

  const availableStatuses = ['active', 'deactive', 'irregular', 'completed', 'dropped', 'on-hold'];

  const handleSubmit = () => {
    if (selectedStatus) {
      onStatusChange(student.studentId._id, selectedStatus, progress);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Update Student Status</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="px-6 py-4">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Student:</p>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="font-medium text-gray-900">{student.studentId.name}</p>
              <p className="text-sm text-gray-600">{student.studentId.email}</p>
              <div className="mt-2">
                <StatusBadge status={student.status} />
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status:
            </label>
            <div className="space-y-2">
              {availableStatuses.map((status) => (
                <label key={status} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value={status}
                    checked={selectedStatus === status}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="mr-3 text-blue-600 focus:ring-blue-500"
                  />
                  <StatusBadge status={status as any} />
                </label>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Progress: {progress}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedStatus || loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {loading ? 'Updating...' : 'Update Status'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MissionStudentsPage() {
  const params = useParams();
  const missionId = params.id as string;
  const { showToast } = useToast();

  const [mission, setMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [studentSelectionModal, setStudentSelectionModal] = useState<{
    isOpen: boolean;
    missionId: string;
    batchId: string;
  }>({
    isOpen: false,
    missionId: '',
    batchId: ''
  });

  // Status change modal state
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<MissionStudent | null>(null);
  const [statusChangeLoading, setStatusChangeLoading] = useState(false);

  // Fetch mission data
  useEffect(() => {
    if (missionId) {
      fetchMissionData();
    }
  }, [missionId]);

  const fetchMissionData = async () => {
    try {
      setLoading(true);
      // First get the mission details
      const missionResponse = await fetch(`${BASE}/api/v2/missions/${missionId}`);
      
      if (missionResponse.ok) {
        const missionData = await missionResponse.json();
        console.log('Raw mission data from API:', missionData);
        const missionDetails = missionData.mission || missionData.data;
        console.log('Mission details:', missionDetails);
        console.log('BatchId:', missionDetails?.batchId);
        console.log('Mission embedded students:', missionDetails?.students);
        
        // Check if mission has embedded students
        if (missionDetails?.students && missionDetails.students.length > 0) {
          console.log('Mission has embedded students, using those instead of StudentMission API');
          const embeddedStudents = missionDetails.students.map((s: any) => ({
            _id: s._id || s.studentId?._id,
            studentId: s.studentId,
            mentorId: s.primaryMentorId,
            status: s.status || 'active',
            progress: s.progress || 0,
            startedAt: s.startedAt || new Date().toISOString(),
            completedAt: s.completedAt,
            courseProgress: s.courseProgress || []
          }));
          
          const missionWithStudents = {
            ...missionDetails,
            students: embeddedStudents
          };
          
          console.log('Using embedded students:', missionWithStudents);
          setMission(missionWithStudents);
          setPagination(prev => ({
            ...prev,
            total: embeddedStudents.length,
            totalPages: Math.ceil(embeddedStudents.length / prev.limit)
          }));
          return;
        }
        
        // Then get the mission students using the correct API endpoint
        const studentsResponse = await fetch(`${BASE}/api/v2/missions/${missionId}/students`);
        
        if (studentsResponse.ok) {
          const studentsData = await studentsResponse.json();
          console.log('Raw students data from API:', studentsData);
          
          // Transform the data to match the expected format (v2 API response)
          const transformedStudents = studentsData.students.map((sm: any) => ({
            _id: sm._id,
            studentId: sm.student || sm.studentId,
            mentorId: sm.mentorId,
            status: sm.status,
            progress: sm.progress,
            startedAt: sm.enrollmentDate || sm.startedAt,
            completedAt: sm.completedAt,
            courseProgress: sm.courseProgress || []
          }));
          
          console.log('Transformed students:', transformedStudents);
          
          // Combine mission details with the students data
          const missionWithStudents = {
            ...missionDetails,
            students: transformedStudents
          };
          
          console.log('Final mission with students:', missionWithStudents);
          setMission(missionWithStudents);
          setPagination(prev => ({
            ...prev,
            total: transformedStudents.length,
            totalPages: Math.ceil(transformedStudents.length / prev.limit)
          }));
        } else {
          showToast({
            type: 'error',
            title: 'Failed to fetch mission students',
            message: 'Could not load mission students data'
          });
        }
      } else {
        showToast({
          type: 'error',
          title: 'Failed to fetch mission',
          message: 'Could not load mission data'
        });
      }
    } catch (error) {
      console.error('Error fetching mission:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch mission data'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle student status change
  const handleStudentStatusChange = async (studentId: string, status: string, progress: number) => {
    try {
      setStatusChangeLoading(true);
      
      const response = await fetch(`${BASE}/api/v2/missions/${missionId}/students?studentId=${studentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, progress })
      });

      const data = await response.json();

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Status Updated',
          message: data.message
        });
        
        // Update the local state
        setMission(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            students: prev.students?.map(s => 
              s.studentId._id === studentId 
                ? { ...s, status: status as any, progress }
                : s
            )
          };
        });
      } else {
        showToast({
          type: 'error',
          title: 'Failed to Update Status',
          message: data.error?.message || 'Unknown error occurred'
        });
      }
    } catch (error) {
      console.error('Error updating student status:', error);
      showToast({
        type: 'error',
        title: 'Failed to Update Status',
        message: 'Failed to update student status. Please try again.'
      });
    } finally {
      setStatusChangeLoading(false);
    }
  };

  // Open status change modal
  const openStatusModal = (student: MissionStudent) => {
    setSelectedStudent(student);
    setStatusModalOpen(true);
  };

  // Close status change modal
  const closeStatusModal = () => {
    setStatusModalOpen(false);
    setSelectedStudent(null);
  };

  // Filter and search students
  const filteredStudents = mission?.students?.filter(student => {
    if (!student.studentId || !student.studentId.name || !student.studentId.email) {
      return false;
    }

    const matchesSearch = searchQuery === "" || 
      student.studentId.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.studentId.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.studentId.userId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilters = Object.keys(filters).every(key => {
      if (filters[key] === "") return true;
      return student[key as keyof MissionStudent] === filters[key];
    });

    return matchesSearch && matchesFilters;
  }) || [];

  // Paginate students
  const startIndex = (pagination.page - 1) * pagination.limit;
  const endIndex = startIndex + pagination.limit;
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

  // Handle student selection
  const handleStudentSelection = (studentIds: string[]) => {
    setSelectedStudents(studentIds);
  };

  // Get existing student IDs safely
  const getExistingStudentIds = () => {
    return mission?.students?.map(s => s.studentId._id) || [];
  };

  // Show student selection modal
  const showStudentSelection = () => {
    if (!mission || !mission.batchId) return;
    
    setStudentSelectionModal({
      isOpen: true,
      missionId: missionId, // Pass the missionId to filter out already assigned students
      batchId: mission.batchId._id
    });
  };

  // Handle adding students to mission
  const handleAddStudentsToMission = async (selectedStudentIds: string[]) => {
    try {
      const response = await fetch(`${BASE}/api/v2/missions/${missionId}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds: selectedStudentIds })
      });

      const data = await response.json();

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Students Added',
          message: data.message
        });
        fetchMissionData(); // Refresh the mission data
        setStudentSelectionModal(prev => ({ ...prev, isOpen: false }));
      } else {
        showToast({
          type: 'error',
          title: 'Failed to Add Students',
          message: data.error?.message || 'Unknown error occurred'
        });
      }
    } catch (error) {
      console.error('Error adding students to mission:', error);
      showToast({
        type: 'error',
        title: 'Failed to Add Students',
        message: 'Failed to add students to mission. Please try again.'
      });
    }
  };

  // Handle clearing all students from the mission
  const handleClearAllStudents = async () => {
    if (!mission) return;
    
    if (!confirm('Are you sure you want to remove ALL students from this mission? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${BASE}/api/v2/missions/${missionId}/students`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear' })
      });

      const data = await response.json();

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'All Students Cleared',
          message: data.message
        });
        fetchMissionData(); // Refresh the mission data
      } else {
        showToast({
          type: 'error',
          title: 'Failed to Clear Students',
          message: data.error?.message || 'Unknown error occurred'
        });
      }
    } catch (error) {
      console.error('Error clearing students:', error);
      showToast({
        type: 'error',
        title: 'Failed to Clear Students',
        message: 'Failed to clear students from mission. Please try again.'
      });
    }
  };

  // Handle fixing the mission by removing invalid students
  const handleFixMission = async () => {
    if (!mission) return;
    
    if (!confirm('This will fix the mission by removing students who should not be here. Continue?')) {
      return;
    }

    try {
      const response = await fetch(`${BASE}/api/v2/missions/${missionId}/students`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fix' })
      });

      const data = await response.json();

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Mission Fixed',
          message: data.message
        });
        fetchMissionData(); // Refresh the mission data
      } else {
        showToast({
          type: 'error',
          title: 'Failed to Fix Mission',
          message: data.error?.message || 'Unknown error occurred'
        });
      }
    } catch (error) {
      console.error('Error fixing mission:', error);
      showToast({
        type: 'error',
        title: 'Failed to Fix Mission',
        message: 'Failed to fix mission. Please try again.'
      });
    }
  };

  // Handle syncing students from Mission model to StudentMission collection
  const handleSyncStudents = async () => {
    if (!mission) return;
    
    if (!confirm('This will sync students from the Mission model to the StudentMission collection. Continue?')) {
      return;
    }

    try {
      const response = await fetch(`${BASE}/api/v2/missions/${missionId}/students`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync' })
      });

      const data = await response.json();

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Students Synced',
          message: `${data.message} (${data.data.syncedCount} synced, ${data.data.totalEmbeddedStudents} total embedded students)`
        });
        fetchMissionData(); // Refresh the mission data
      } else {
        showToast({
          type: 'error',
          title: 'Failed to Sync Students',
          message: data.error?.message || 'Unknown error occurred'
        });
      }
    } catch (error) {
      console.error('Error syncing students:', error);
      showToast({
        type: 'error',
        title: 'Failed to Sync Students',
        message: 'Failed to sync students. Please try again.'
      });
    }
  };

  // Handle debug mission
  const handleDebugMission = async () => {
    if (!mission) return;
    
    try {
      const response = await fetch(`${BASE}/api/v2/missions/${missionId}/students?debug=true`);
      const data = await response.json();

      if (response.ok) {
        console.log('Debug data:', data);
        alert(`Debug Info:\nMission Students: ${data.debug.missionStudentsCount}\nBatch Students: ${data.debug.batchStudentsCount}\nAll StudentMissions: ${data.debug.allStudentMissionsCount}\nCheck console for details.`);
      } else {
        showToast({
          type: 'error',
          title: 'Debug Failed',
          message: data.error?.message || 'Unknown error occurred'
        });
      }
    } catch (error) {
      console.error('Error debugging mission:', error);
      showToast({
        type: 'error',
        title: 'Debug Failed',
        message: 'Failed to debug mission. Please try again.'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading mission data...</p>
        </div>
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Mission Not Found</h2>
        <p className="text-gray-600 mb-6">The mission you're looking for doesn't exist or has been removed.</p>
        <Link
          href="/dashboard/admin/missions"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Missions
        </Link>
      </div>
    );
  }

  if (!mission.batchId) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Mission Data Incomplete</h2>
        <p className="text-gray-600 mb-6">This mission is missing batch information. Please contact an administrator.</p>
        <Link
          href="/dashboard/admin/missions"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Missions
        </Link>
      </div>
    );
  }

  // Calculate statistics
  const validStudents = mission.students?.filter(s => 
    s.studentId && s.studentId._id && s.studentId.name
  ) || [];
  
  const activeStudents = validStudents.filter(s => s.status === 'active').length;
  const completedStudents = validStudents.filter(s => s.status === 'completed').length;
  const deactiveStudents = validStudents.filter(s => s.status === 'deactive').length;
  const averageProgress = validStudents.length > 0 
    ? Math.round(validStudents.reduce((sum, s) => sum + s.progress, 0) / validStudents.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/admin/missions"
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Missions
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{mission.title}</h1>
            <p className="text-sm text-gray-600">
              Batch: {mission.batchId?.code || 'N/A'} - {mission.batchId?.title || 'N/A'}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={showStudentSelection}
            disabled={!mission?.batchId}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Students
          </button>
          <button
            onClick={handleClearAllStudents}
            className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
          >
            Clear All Students
          </button>
          <button
            onClick={handleFixMission}
            className="inline-flex items-center px-4 py-2 border border-yellow-300 text-sm font-medium rounded-md text-yellow-700 bg-white hover:bg-yellow-50"
          >
            Fix Mission
          </button>
          <button
            onClick={handleSyncStudents}
            className="inline-flex items-center px-4 py-2 border border-purple-300 text-sm font-medium rounded-md text-purple-700 bg-white hover:bg-purple-50"
          >
            Sync Students
          </button>
          <button
            onClick={handleDebugMission}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Debug Mission
          </button>
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
                  <dd className="text-lg font-medium text-gray-900">{validStudents.length}</dd>
                </dl>
              </div>
            </div>
          </div>
              </div>
              
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="h-2 w-2 bg-green-600 rounded-full"></div>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active</dt>
                  <dd className="text-lg font-medium text-gray-900">{activeStudents}</dd>
                </dl>
              </div>
              </div>
              </div>
            </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                    </div>
                  </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                  <dd className="text-lg font-medium text-gray-900">{completedStudents}</dd>
                </dl>
              </div>
            </div>
          </div>
            </div>
            
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-6 w-6 bg-yellow-100 rounded-full flex items-center justify-center">
                  <div className="h-2 w-2 bg-yellow-600 rounded-full"></div>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Avg Progress</dt>
                  <dd className="text-lg font-medium text-gray-900">{averageProgress}%</dd>
                </dl>
              </div>
            </div>
            </div>
          </div>
            </div>

      {/* Search and Filters */}
      <SearchAndFilter
        onSearch={setSearchQuery}
        onFilterChange={setFilters}
        filters={{
          status: { 
            label: 'Status', 
            options: [
              { value: 'active', label: 'Active' },
              { value: 'completed', label: 'Completed' },
              { value: 'failed', label: 'Failed' },
              { value: 'dropped', label: 'Dropped' }
            ]
          }
        }}
      />

            {/* Students Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Mission Students ({filteredStudents.length})
          </h3>
          
          {filteredStudents.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery || Object.values(filters).some(f => f !== '') 
                  ? 'Try adjusting your search or filters.'
                  : 'Get started by adding students to this mission.'
                }
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
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mentor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Started
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedStudents.map((student) => (
                    <tr key={student._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {student.studentId.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {student.studentId.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {student.studentId.email}
                            </div>
                            <div className="text-xs text-gray-400">
                              ID: {student.studentId.userId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={student.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${student.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-900">{student.progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.mentorId ? student.mentorId.name : 'Unassigned'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(student.startedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button 
                            onClick={() => openStatusModal(student)}
                            className="text-gray-600 hover:text-black"
                            title="Change Status"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          <button className="text-blue-600 hover:text-blue-900 mr-3">
                            Edit
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            Remove
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

      {/* Pagination */}
      {filteredStudents.length > 0 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={filteredStudents.length}
          itemsPerPage={pagination.limit}
          onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
          onItemsPerPageChange={(limit) => setPagination(prev => ({ ...prev, limit, page: 1 }))}
        />
      )}

      {/* Student Selection Modal */}
      <StudentSelectionModal
        isOpen={studentSelectionModal.isOpen}
        onClose={() => setStudentSelectionModal(prev => ({ ...prev, isOpen: false }))}
        missionId={studentSelectionModal.missionId}
        batchId={studentSelectionModal.batchId}
        onConfirm={handleAddStudentsToMission}
      />

      {/* Student Status Change Modal */}
      <StudentStatusModal
        isOpen={statusModalOpen}
        onClose={closeStatusModal}
        student={selectedStudent}
        onStatusChange={handleStudentStatusChange}
        loading={statusChangeLoading}
      />
    </div>
  );
} 
