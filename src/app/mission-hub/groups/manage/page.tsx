"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Edit, 
  Eye, 
  Trash2, 
  Target,
  Users2,
  UserPlus2,
  AlertTriangle,
  CheckCircle,
  X,
  User,
  Calendar,
  Settings
} from 'lucide-react';

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

interface Group {
  _id: string;
  name: string;
  description?: string;
  missionId: string;
  mentors: Array<{
    _id: string;
    name: string;
    email: string;
    role: string;
  }>;
  students: Array<{
    _id: string;
    name: string;
    email: string;
    studentId: string;
  }>;
  maxStudents: number;
  currentStudents: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

export default function ManageGroupsPage() {
  const [mission, setMission] = useState<Mission | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingGroup, setDeletingGroup] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    fetchMission();
  }, []);

  useEffect(() => {
    if (mission) {
      fetchGroups();
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
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    if (!mission) return;
    
    try {
      const response = await fetch(`/api/mission-hub/groups?missionId=${mission._id}`);
      if (response.ok) {
        const data = await response.json();
        setGroups(data.groups || []);
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    setDeletingGroup(groupId);
    
    try {
      const response = await fetch(`/api/mission-hub/groups/${groupId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setGroups(prev => prev.filter(group => group._id !== groupId));
        setShowDeleteModal(null);
      } else {
        console.error('Failed to delete group');
      }
    } catch (error) {
      console.error('Error deleting group:', error);
    } finally {
      setDeletingGroup(null);
    }
  };

  const toggleGroupStatus = async (groupId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      const response = await fetch(`/api/mission-hub/groups/${groupId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setGroups(prev => prev.map(group => 
          group._id === groupId 
            ? { ...group, status: newStatus }
            : group
        ));
      }
    } catch (error) {
      console.error('Error updating group status:', error);
    }
  };

  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (group.description && group.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || group.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
        <p className="text-gray-600">Please select a mission to manage groups.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/mission-hub/groups"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Group Management
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Groups</h1>
            <p className="text-gray-600 mt-1">Edit, view details, and delete groups for {mission.code} - {mission.title}</p>
          </div>
        </div>
        <Link
          href="/mission-hub/groups/add"
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          <UserPlus2 size={16} className="mr-2" />
          Create New Group
        </Link>
      </div>

      {/* Mission Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Target className="h-6 w-6 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Mission Overview</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Mission Code</label>
            <p className="text-lg font-semibold text-purple-600">{mission.code}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Mission Title</label>
            <p className="text-lg font-semibold text-gray-900">{mission.title}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Total Groups</label>
            <p className="text-lg font-semibold text-blue-600">{groups.length}</p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search Groups</label>
              <input
                type="text"
                placeholder="Search by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status Filter</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            Showing {filteredGroups.length} of {groups.length} groups
          </div>
        </div>
      </div>

      {/* Groups List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Groups ({filteredGroups.length})</h3>
        </div>
        
        {filteredGroups.length === 0 ? (
          <div className="text-center py-12">
            <Users2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Groups Found</h3>
            <p className="text-gray-600 mb-6">
              {groups.length === 0 
                ? 'No groups have been created yet.' 
                : 'No groups match your current filters.'}
            </p>
            {groups.length === 0 && (
              <Link
                href="/mission-hub/groups/add"
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                <UserPlus2 size={16} className="mr-2" />
                Create First Group
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredGroups.map((group) => (
              <div key={group._id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">{group.name}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        group.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {group.status}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">
                      {group.description || 'No description'}
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Mentors:</span>
                        <span className="ml-2 font-medium text-blue-600">{group.mentors.length}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Students:</span>
                        <span className="ml-2 font-medium text-green-600">{group.students.length}/{group.maxStudents}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Created:</span>
                        <span className="ml-2 font-medium">{formatDate(group.createdAt)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Capacity:</span>
                        <span className="ml-2 font-medium">
                          {group.maxStudents === 0 
                            ? 'Unlimited' 
                            : `${Math.round((group.students.length / group.maxStudents) * 100)}%`
                          }
                        </span>
                      </div>
                    </div>

                    {/* Mentors and Students Preview */}
                    <div className="mt-4 space-y-3">
                      {group.mentors.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Mentors</h5>
                          <div className="flex flex-wrap gap-2">
                            {group.mentors.slice(0, 3).map((mentor) => (
                              <span key={mentor._id} className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-md">
                                <User className="h-3 w-3 mr-1" />
                                {mentor.name}
                              </span>
                            ))}
                            {group.mentors.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{group.mentors.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {group.students.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Students</h5>
                          <div className="flex flex-wrap gap-2">
                            {group.students.slice(0, 3).map((student) => (
                              <span key={student._id} className="inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-800 rounded-md">
                                <User className="h-3 w-3 mr-1" />
                                {student.name}
                              </span>
                            ))}
                            {group.students.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{group.students.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-6">
                    <button
                      onClick={() => toggleGroupStatus(group._id, group.status)}
                      className={`px-3 py-1 text-xs rounded-md transition-colors ${
                        group.status === 'active'
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                      title={`Click to ${group.status === 'active' ? 'deactivate' : 'activate'} group`}
                    >
                      {group.status === 'active' ? 'Active' : 'Inactive'}
                    </button>
                    
                    <Link
                      href={`/mission-hub/groups/${group._id}`}
                      className="inline-flex items-center px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors"
                      title="View group details"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Link>
                    
                    <Link
                      href={`/mission-hub/groups/${group._id}/edit`}
                      className="inline-flex items-center px-3 py-1 text-xs bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors"
                      title="Edit group"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Link>
                    
                    <button
                      onClick={() => setShowDeleteModal(group._id)}
                      className="inline-flex items-center px-3 py-1 text-xs bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors"
                      title="Delete group"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Delete Group</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this group? This action cannot be undone and will remove all mentor and student assignments.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => handleDeleteGroup(showDeleteModal)}
                disabled={deletingGroup === showDeleteModal}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deletingGroup === showDeleteModal ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  'Delete Group'
                )}
              </button>
              <button
                onClick={() => setShowDeleteModal(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
