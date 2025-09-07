"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  UserPlus, 
  Target, 
  Plus, 
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Users2,
  Calendar,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface Group {
  _id: string;
  name: string;
  description?: string;
  missionId: {
    _id: string;
    code: string;
    title: string;
  };
  primaryMentorId?: {
    _id: string;
    name: string;
    email: string;
  };
  students: Array<{
    _id: string;
    name: string;
    email: string;
    studentId?: string;
  }>;
  mentors: Array<{
    _id: string;
    name: string;
    email: string;
  }>;
  maxStudents: number;
  currentStudents: number;
  status: 'active' | 'inactive' | 'full' | 'recruiting';
  groupType: 'study' | 'project' | 'mentorship' | 'collaborative';
  focusArea?: string[];
  createdAt: string;
  updatedAt: string;
}

export default function AllGroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v2/mentorship-groups');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setGroups(data.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.missionId.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || group.status === statusFilter;
    const matchesType = typeFilter === 'all' || group.groupType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const sortedGroups = [...filteredGroups].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'students':
        aValue = a.currentStudents;
        bValue = b.currentStudents;
        break;
      case 'created':
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      case 'mission':
        aValue = a.missionId.title.toLowerCase();
        bValue = b.missionId.title.toLowerCase();
        break;
      default:
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
    }
    
    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'full': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'recruiting': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'mentorship': return 'bg-purple-100 text-purple-800';
      case 'study': return 'bg-blue-100 text-blue-800';
      case 'project': return 'bg-green-100 text-green-800';
      case 'collaborative': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCapacityPercentage = (current: number, max: number) => {
    if (max === 0) return 0; // Unlimited capacity
    return Math.round((current / max) * 100);
  };

  const getCapacityColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-xs text-gray-600">Loading groups...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">All Groups</h1>
          <p className="text-xs text-gray-600 mt-1">
            {sortedGroups.length} group{sortedGroups.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <Link
          href="/mission-hub/groups/create"
          className="inline-flex items-center px-3 py-1.5 text-xs bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
        >
          <Plus className="h-3 w-3 mr-1" />
          Create Group
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="full">Full</option>
            <option value="recruiting">Recruiting</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="mentorship">Mentorship</option>
            <option value="study">Study Group</option>
            <option value="project">Project Team</option>
            <option value="collaborative">Collaborative</option>
          </select>

          {/* Sort */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order as 'asc' | 'desc');
            }}
            className="px-3 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="students-desc">Most Students</option>
            <option value="students-asc">Least Students</option>
            <option value="created-desc">Newest</option>
            <option value="created-asc">Oldest</option>
            <option value="mission-asc">Mission (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Groups Grid */}
      {sortedGroups.length === 0 ? (
        <div className="text-center py-12">
          <Users2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-sm font-medium text-gray-900 mb-2">No Groups Found</h3>
          <p className="text-xs text-gray-600 mb-6">
            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Create your first group to get started'
            }
          </p>
          {!searchTerm && statusFilter === 'all' && typeFilter === 'all' && (
            <Link
              href="/mission-hub/groups/create"
              className="inline-flex items-center px-4 py-2 text-xs bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              <Plus className="h-3 w-3 mr-1" />
              Create First Group
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedGroups.map((group) => (
            <div key={group._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">{group.name}</h3>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {group.description || 'No description'}
                  </p>
                </div>
                <div className="flex items-center space-x-1 ml-2">
                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusColor(group.status)}`}>
                    {group.status}
                  </span>
                </div>
              </div>

              {/* Mission Info */}
              <div className="flex items-center space-x-2 mb-3">
                <Target className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-600 truncate">
                  {group.missionId.code} - {group.missionId.title}
                </span>
              </div>

              {/* Type and Focus */}
              <div className="flex items-center space-x-2 mb-3">
                <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getTypeColor(group.groupType)}`}>
                  {group.groupType}
                </span>
                {group.focusArea && group.focusArea.length > 0 && (
                  <span className="text-xs text-gray-500">
                    {group.focusArea.slice(0, 2).join(', ')}
                    {group.focusArea.length > 2 && ` +${group.focusArea.length - 2}`}
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{group.currentStudents}</div>
                  <div className="text-xs text-gray-600">Students</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{group.mentors.length}</div>
                  <div className="text-xs text-gray-600">Mentors</div>
                </div>
              </div>

              {/* Capacity */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600">Capacity</span>
                  <span className={`font-medium ${getCapacityColor(getCapacityPercentage(group.currentStudents, group.maxStudents))}`}>
                    {group.currentStudents}/{group.maxStudents === 0 ? '∞' : group.maxStudents}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  {group.maxStudents === 0 ? (
                    <div className="h-1.5 rounded-full bg-blue-500 w-full"></div>
                  ) : (
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        getCapacityPercentage(group.currentStudents, group.maxStudents) >= 90
                          ? 'bg-red-500'
                          : getCapacityPercentage(group.currentStudents, group.maxStudents) >= 70
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{
                        width: `${Math.min(getCapacityPercentage(group.currentStudents, group.maxStudents), 100)}%`
                      }}
                    ></div>
                  )}
                </div>
              </div>

              {/* Primary Mentor */}
              {group.primaryMentorId && (
                <div className="flex items-center space-x-2 mb-4">
                  <Users className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-600">
                    Lead: {group.primaryMentorId.name}
                  </span>
                </div>
              )}

              {/* Created Date */}
              <div className="flex items-center space-x-2 mb-4">
                <Calendar className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-500">
                  Created {new Date(group.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <Link
                  href={`/mission-hub/groups/${group._id}`}
                  className="flex-1 inline-flex items-center justify-center px-2 py-1.5 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Link>
                <Link
                  href={`/mission-hub/groups/${group._id}/edit`}
                  className="flex-1 inline-flex items-center justify-center px-2 py-1.5 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200 transition-colors"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {sortedGroups.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-gray-900">
                {sortedGroups.filter(g => g.status === 'active').length}
              </div>
              <div className="text-xs text-gray-600">Active Groups</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">
                {sortedGroups.reduce((sum, g) => sum + g.currentStudents, 0)}
              </div>
              <div className="text-xs text-gray-600">Total Students</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">
                {sortedGroups.reduce((sum, g) => sum + g.mentors.length, 0)}
              </div>
              <div className="text-xs text-gray-600">Total Mentors</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">
                {sortedGroups.length > 0 
                  ? Math.round(sortedGroups.reduce((sum, g) => sum + getCapacityPercentage(g.currentStudents, g.maxStudents), 0) / sortedGroups.length)
                  : 0}%
              </div>
              <div className="text-xs text-gray-600">Avg Capacity</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
