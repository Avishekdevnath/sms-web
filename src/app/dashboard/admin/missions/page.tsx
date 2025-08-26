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
  Play
} from "lucide-react";

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
  students: any[];
  startDate?: string;
  endDate?: string;
  createdAt: string;
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

  useEffect(() => {
    fetchMissions();
  }, [currentPage, statusFilter, batchFilter]);

  const fetchMissions = async () => {
    try {
    setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(batchFilter !== 'all' && { batchId: batchFilter })
      });

      const response = await fetch(`/api/missions?${params}`);
      if (response.ok) {
        const data = await response.json();
        setMissions(data.missions || []);
        setTotalPages(Math.ceil((data.total || 0) / 20));
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
      
      const response = await fetch(`/api/missions/${missionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setMissions(prev => prev.map(m => 
            m._id === missionId ? { ...m, status: data.data.status } : m
          ));
        } else {
          console.error('Invalid response format:', data);
        }
      } else {
        const error = await response.json();
        console.error('Failed to update mission status:', error);
        alert(`Failed to update mission status: ${error.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating mission status:', error);
      alert('Failed to update mission status');
    }
  };

  const handleDeleteMission = async (missionId: string) => {
    try {
      // Validate input
      if (!missionId || typeof missionId !== 'string' || missionId.trim() === '') {
        console.warn('Invalid mission ID provided for deletion:', missionId);
        return;
      }
      
      if (!confirm('Are you sure you want to delete this mission?')) return;
      
      const response = await fetch(`/api/missions/${missionId}`, {
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mission Management</h1>
          <p className="mt-2 text-gray-600">Create and manage student missions</p>
        </div>
        <Link
          href="/dashboard/admin/missions/create"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Mission
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-blue-600">{missions.length}</div>
          <div className="text-sm text-gray-600">All Missions</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-green-600">{getStatusCount('active')}</div>
          <div className="text-sm text-gray-600">Active</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-gray-600">{getStatusCount('draft')}</div>
          <div className="text-sm text-gray-600">Drafts</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-yellow-600">{getStatusCount('paused')}</div>
          <div className="text-sm text-gray-600">Paused</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-blue-600">{getStatusCount('completed')}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg border">
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

      {/* Selection Controls */}
      {selectedMissions.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-800">
              {selectedMissions.length} mission(s) selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={unselectAllMissions}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Unselect all
              </button>
              <button className="text-sm text-red-600 hover:text-red-800">
                Delete selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Missions Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">All Missions</h3>
            <div className="flex items-center space-x-2">
            <button
                onClick={selectAllMissions}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Select all
            </button>
            <button
                onClick={unselectAllMissions}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Unselect
            </button>
          </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedMissions.length === missions.length}
                    onChange={(e) => e.target.checked ? selectAllMissions() : unselectAllMissions()}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Batch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Students
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMissions.map((mission) => (
                <tr key={mission._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedMissions.includes(mission._id)}
                      onChange={() => toggleMissionSelection(mission._id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {mission.code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{mission.title}</div>
                      {mission.description && (
                        <div className="text-sm text-gray-500">{mission.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {mission.batchId ? `${mission.batchId.code} - ${mission.batchId.title}` : '❓'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(mission.status)}`}>
                      {mission.status ? mission.status.charAt(0).toUpperCase() + mission.status.slice(1) : 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {mission.students?.length || 0} enrolled
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(() => {
                      try {
                        if (mission.startDate && mission.endDate) {
                          return `${new Date(mission.startDate).toLocaleDateString()} - ${new Date(mission.endDate).toLocaleDateString()}`;
                        }
                        return 'No dates set';
                      } catch (error) {
                        console.error('Error formatting mission dates:', error);
                        return 'Invalid dates';
                      }
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(() => {
                      try {
                        if (mission.createdAt) {
                          return new Date(mission.createdAt).toLocaleDateString();
                        }
                        return 'Invalid Date';
                      } catch (error) {
                        console.error('Error formatting mission creation date:', error);
                        return 'Invalid Date';
                      }
                    })()}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <div className="flex gap-2 justify-end">
                      <Link
                        href={`/dashboard/admin/missions/${mission._id}`}
                        className="btn btn-sm btn-primary"
                      >
                        Manage
                      </Link>
                      <Link
                        href={`/dashboard/admin/missions/${mission._id}/edit`}
                        className="btn btn-sm btn-secondary"
                      >
                        Edit
                      </Link>
                                                    <button
                            onClick={() => {
                              try {
                                handleStatusChange(mission._id, 'paused');
                              } catch (error) {
                                console.error('Error pausing mission:', error);
                              }
                            }}
                            className="btn btn-sm btn-warning"
                            disabled={mission.status === 'paused'}
                          >
                            Pause
                          </button>
                          <button
                            onClick={() => {
                              try {
                                handleStatusChange(mission._id, 'archived');
                              } catch (error) {
                                console.error('Error archiving mission:', error);
                              }
                            }}
                            className="btn btn-sm btn-danger"
                          >
                            Archive
                          </button>
                          <button
                            onClick={() => {
                              try {
                                handleDeleteMission(mission._id);
                              } catch (error) {
                                console.error('Error deleting mission:', error);
                              }
                            }}
                            className="btn btn-sm btn-danger"
                          >
                            Delete
                          </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                try {
                  setCurrentPage(prev => Math.max(1, prev - 1));
                } catch (error) {
                  console.error('Error navigating to previous page:', error);
                }
              }}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => {
                try {
                  setCurrentPage(prev => Math.min(totalPages, prev + 1));
                } catch (error) {
                  console.error('Error navigating to next page:', error);
                }
              }}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50"
            >
              Next
            </button>
      </div>
        </div>
      )}
    </div>
  );
} 
