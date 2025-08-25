"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, Plus, Search, Filter } from "lucide-react";
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
  status: 'active' | 'completed' | 'failed' | 'dropped';
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
  students: MissionStudent[];
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
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [studentSelectionModal, setStudentSelectionModal] = useState<{
    isOpen: boolean;
    missionId: string;
    batchId: string;
    existingStudentIds: string[];
  }>({
    isOpen: false,
    missionId: '',
    batchId: '',
    existingStudentIds: []
  });

  // Fetch mission data
  useEffect(() => {
    if (missionId) {
      fetchMissionData();
    }
  }, [missionId]);

  const fetchMissionData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BASE}/api/missions/${missionId}`);
      
      if (response.ok) {
        const data = await response.json();
        setMission(data.mission);
        setPagination(prev => ({
          ...prev,
          total: data.mission.students.length,
          totalPages: Math.ceil(data.mission.students.length / prev.limit)
        }));
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

  // Filter and search students
  const filteredStudents = mission?.students.filter(student => {
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

  // Show student selection modal
  const showStudentSelection = () => {
    if (!mission) return;
    
    const existingStudentIds = mission.students.map(s => s.studentId._id);
    
    setStudentSelectionModal({
      isOpen: true,
      missionId: mission._id,
      batchId: mission.batchId._id,
      existingStudentIds
    });
  };

  // Handle adding students to mission
  const handleAddStudentsToMission = async (selectedStudentIds: string[]) => {
    try {
      const response = await fetch(`${BASE}/api/missions/${missionId}/students`, {
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

  // Calculate statistics
  const validStudents = mission.students.filter(s => 
    s.studentId && s.studentId._id && s.studentId.name
  );
  
  const activeStudents = validStudents.filter(s => s.status === 'active').length;
  const completedStudents = validStudents.filter(s => s.status === 'completed').length;
  const failedStudents = validStudents.filter(s => s.status === 'failed').length;
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
            <p className="text-sm text-gray-600">Batch: {mission.batchId.code} - {mission.batchId.title}</p>
          </div>
      </div>

          <button
          onClick={showStudentSelection}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Students
          </button>
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
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filters={filters}
        onFiltersChange={setFilters}
        filterOptions={[
          { key: 'status', label: 'Status', options: ['active', 'completed', 'failed', 'dropped'] }
        ]}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-3">
                          Edit
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          Remove
                        </button>
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
        existingStudentIds={studentSelectionModal.existingStudentIds}
        onStudentsSelected={handleAddStudentsToMission}
      />
    </div>
  );
} 
