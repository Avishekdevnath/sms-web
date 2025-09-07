"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Target, 
  Plus, 
  Search, 
  Filter, 
  RefreshCw, 
  Trash2, 
  Edit, 
  Users,
  Pause,
  Archive,
  Play,
  Settings,
  Eye,
  MoreHorizontal,
  CheckCircle,
  Clock,
  XCircle,
  BarChart3,
  CheckCircle2,
  Clock4,
  PauseCircle
} from "lucide-react";
import { formatMongoDate, formatDateRange } from '@/utils/dateUtils';
import MissionTable from '@/components/missions/MissionTable';

import { MongoDateValue } from '@/utils/dateUtils';

interface Mission {
  _id: string;
  code: string;
  title: string;
  description?: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  batchId?: {
    _id: string;
    code: string;
    title: string;
  };
  // REMOVED: students: any[]; // Now using StudentMission collection
  startDate?: MongoDateValue;
  endDate?: MongoDateValue;
  createdAt: MongoDateValue;
}

export default function AdminMissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [batchFilter, setBatchFilter] = useState<string>("all");
  const [selectedMissions, setSelectedMissions] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(25); // Default to 25 rows
  const [totalCount, setTotalCount] = useState(0);
  const [statusChangeId, setStatusChangeId] = useState<string | null>(null);
  const [statusChangeLoading, setStatusChangeLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchMissions();
  }, [currentPage, statusFilter, batchFilter, pageSize]);

  // Close status dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusChangeId && !(event.target as Element).closest('.status-dropdown')) {
        console.log('Click outside detected, closing dropdown');
        setStatusChangeId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [statusChangeId]);

  const fetchMissions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(batchFilter !== 'all' && { batchId: batchFilter })
      });

      const response = await fetch(`/api/v2/missions?${params}`); // Use V2 API directly
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMissions(data.data || []); // V2 returns data in data field
          setTotalCount(data.pagination?.total || 0);
          setTotalPages(data.pagination?.totalPages || 1);
        } else {
          console.error('V2 API error:', data.error);
        }
      }
    } catch (error) {
      console.error('Error fetching missions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (missionId: string, newStatus: string) => {
    try {
      // Validate inputs
      if (!missionId || typeof missionId !== 'string' || missionId.trim() === '') {
        console.warn('Invalid mission ID provided for status change:', missionId);
        return;
      }
      
      if (!newStatus || typeof newStatus !== 'string' || newStatus.trim() === '') {
        console.warn('Invalid status provided for status change:', newStatus);
        return;
      }
      
      setStatusChangeLoading(missionId);
      
      const requestBody = { status: newStatus };
      console.log('Sending status update request:', {
        url: `/api/v2/missions/${missionId}`,
        method: 'PUT',
        body: requestBody
      });
      
      const response = await fetch(`/api/v2/missions/${missionId}`, { // Use V2 API
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Status update response:', data);
        if (data.success && data.data) {
          setMissions(prev => prev.map(m => 
            m._id === missionId ? { ...m, status: data.data.status } : m
          ));
          console.log('Mission status updated successfully');
        } else {
          console.error('Invalid response format:', data);
          alert(`Failed to update mission status: Invalid response format`);
        }
      } else {
        const error = await response.json();
        console.error('Failed to update mission status:', error);
        alert(`Failed to update mission status: ${error.error?.message || error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating mission status:', error);
      alert('Failed to update mission status');
    } finally {
      setStatusChangeLoading(null);
    }
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };



  const handleDeleteMission = async (missionId: string) => {
    try {
      // Validate input
      if (!missionId || typeof missionId !== 'string' || missionId.trim() === '') {
        console.warn('Invalid mission ID provided for deletion:', missionId);
        return;
      }
      
      if (!confirm('Are you sure you want to delete this mission?')) return;
      
      const response = await fetch(`/api/admin/missions/${missionId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMissions(prev => prev.filter(m => m._id !== missionId));
          alert('Mission deleted successfully');
        } else {
          console.error('Invalid response format:', data);
        }
      } else {
        const error = await response.json();
        console.error('Failed to delete mission:', error);
        alert(`Failed to delete mission: ${error.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting mission:', error);
      alert('Failed to delete mission');
    }
  };

  const filteredMissions = missions.filter(mission => {
    try {
      // Validate mission data
      if (!mission || !mission.title || !mission.code) {
        console.warn('Invalid mission data in search filter:', mission);
        return false;
      }
      
      // Validate search query
      if (!searchQuery || typeof searchQuery !== 'string') {
        return true; // Show all missions if no search query
      }
      
      const matchesSearch = mission.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           mission.code.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    } catch (error) {
      console.error('Error filtering mission:', error, mission);
      return false;
    }
  });

  const getStatusColor = (status: string) => {
    try {
      // Validate status parameter
      if (!status || typeof status !== 'string') {
        console.warn('Invalid status provided to getStatusColor:', status);
        return 'bg-gray-100 text-gray-800';
      }
      
      switch (status) {
        case 'active': return 'bg-green-100 text-green-800';
        case 'draft': return 'bg-gray-100 text-gray-800';
        case 'paused': return 'bg-yellow-100 text-yellow-800';
        case 'completed': return 'bg-blue-100 text-blue-800';
        case 'archived': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    } catch (error) {
      console.error('Error getting status color:', error);
      return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-3.5 h-3.5" />;
      case 'draft': return <Clock className="w-3.5 h-3.5" />;
      case 'paused': return <Pause className="w-3.5 h-3.5" />;
      case 'completed': return <CheckCircle className="w-3.5 h-3.5" />;
      case 'archived': return <Archive className="w-3.5 h-3.5" />;
      default: return <Clock className="w-3.5 h-3.5" />;
    }
  };

  const getStatusCount = (status: string) => {
    try {
      // Validate status parameter
      if (!status || typeof status !== 'string') {
        console.warn('Invalid status provided to getStatusCount:', status);
        return 0;
      }
      
      return missions.filter(m => m && m.status === status).length;
    } catch (error) {
      console.error('Error getting status count:', error);
      return 0;
    }
  };

  const toggleMissionSelection = (missionId: string) => {
    try {
      // Validate mission ID
      if (!missionId || typeof missionId !== 'string' || missionId.trim() === '') {
        console.warn('Invalid mission ID provided to toggleMissionSelection:', missionId);
        return;
      }
      
      setSelectedMissions(prev => 
        prev.includes(missionId) 
          ? prev.filter(id => id !== missionId)
          : [...prev, missionId]
      );
    } catch (error) {
      console.error('Error toggling mission selection:', error);
    }
  };

  const selectAllMissions = () => {
    try {
      // Validate missions data before selecting all
      const validMissionIds = missions
        .filter(m => m && m._id && typeof m._id === 'string')
        .map(m => m._id);
      setSelectedMissions(validMissionIds);
    } catch (error) {
      console.error('Error selecting all missions:', error);
    }
  };

  const unselectAllMissions = () => {
    try {
      setSelectedMissions([]);
    } catch (error) {
      console.error('Error unselecting all missions:', error);
    }
  };

  const getAvailableStatuses = (currentStatus: string) => {
    const allStatuses = ['draft', 'active', 'paused', 'completed', 'archived'];
    return allStatuses.filter(status => status !== currentStatus);
  };

    if (loading) {
      return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading missions...</p>
          </div>
        </div>
      );
    }

    return (
    <div className="space-y-6">
      {/* ✅ Mission Context Banner */}
      {/* Removed mission context banner as per edit hint */}

      {/* Breadcrumb Navigation */}
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600"
            >
              <Target className="w-4 h-4 mr-2" />
              Dashboard
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
              </svg>
              <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">Mission Management</span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mission Management</h1>
              <p className="mt-2 text-gray-600">Create and manage student learning missions</p>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href="/mission-hub"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Mission Hub
              </Link>
              <Link
                href="/dashboard/admin/missions/create"
                className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Mission
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Missions</p>
                <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active</p>
                <p className="text-2xl font-bold text-gray-900">{getStatusCount('active')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Clock4 className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Drafts</p>
                <p className="text-2xl font-bold text-gray-900">{getStatusCount('draft')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <PauseCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Paused</p>
                <p className="text-2xl font-bold text-gray-900">{getStatusCount('paused')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-700" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{getStatusCount('completed')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search missions..."
                  value={searchQuery}
                  onChange={(e) => {
                    try {
                      const value = e.target.value || '';
                      setSearchQuery(value);
                    } catch (error) {
                      console.error('Error updating search query:', error);
                    }
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => {
                  try {
                    const value = e.target.value || '';
                    setStatusFilter(value);
                  } catch (error) {
                    console.error('Error updating status filter:', error);
                  }
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
              <button
                onClick={() => {
                  try {
                    fetchMissions();
                  } catch (error) {
                    console.error('Error refreshing missions:', error);
                  }
                }}
                className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>



        {/* Missions Table */}
        <MissionTable
          missions={filteredMissions}
          loading={loading}
          selectedMissions={selectedMissions}
          toggleMissionSelection={toggleMissionSelection}
          selectAllMissions={selectAllMissions}
          unselectAllMissions={unselectAllMissions}
          handleDeleteMission={handleDeleteMission}
          handleStatusChange={handleStatusChange}
          statusChangeLoading={statusChangeLoading}
          getStatusColor={getStatusColor}
          getStatusIcon={getStatusIcon}
          getStatusCount={getStatusCount}
          getAvailableStatuses={getAvailableStatuses}
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          handlePageSizeChange={handlePageSizeChange}
          setCurrentPage={setCurrentPage}
          formatMongoDate={formatMongoDate}
          formatDateRange={formatDateRange}
        />
      </div>
    </div>
  );
} 
