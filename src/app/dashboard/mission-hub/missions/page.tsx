"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Filter, MoreVertical, Target, Users, UserCheck } from "lucide-react";

interface MissionHubMission {
  _id: string;
  title: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  studentCount: number;
  mentorCount: number;
  progress: number;
  createdAt: string;
}

export default function MissionHubMissionsPage() {
  const [missions, setMissions] = useState<MissionHubMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchMissions();
  }, []);

  const fetchMissions = async () => {
    try {
      const response = await fetch('/api/mission-hub/missions');
      if (response.ok) {
        const data = await response.json();
        setMissions(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch missions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMissions = missions.filter(mission => {
    const matchesSearch = mission.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mission.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || mission.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'archived': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mission Hub Missions</h1>
          <p className="text-gray-600">Manage and track educational missions</p>
        </div>
        <Link
          href="/dashboard/mission-hub/missions/create"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Mission
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search missions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Missions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMissions.map((mission) => (
          <div key={mission._id} className="bg-white rounded-lg shadow border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="p-6">
              {/* Mission Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{mission.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{mission.description}</p>
                </div>
                <button className="ml-2 p-1 text-gray-400 hover:text-gray-600 rounded">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>

              {/* Status Badge */}
              <div className="mb-4">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(mission.status)}`}>
                  {getStatusLabel(mission.status)}
                </span>
              </div>

              {/* Mission Stats */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg mx-auto mb-1">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="text-xs text-gray-600">Students</p>
                  <p className="text-sm font-semibold text-gray-900">{mission.studentCount}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg mx-auto mb-1">
                    <UserCheck className="h-4 w-4 text-purple-600" />
                  </div>
                  <p className="text-xs text-gray-600">Mentors</p>
                  <p className="text-sm font-semibold text-gray-900">{mission.mentorCount}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg mx-auto mb-1">
                    <Target className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="text-xs text-gray-600">Progress</p>
                  <p className="text-sm font-semibold text-gray-900">{mission.progress}%</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{mission.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${mission.progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <Link
                  href={`/dashboard/mission-hub/missions/${mission._id}`}
                  className="flex-1 text-center px-3 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  View Details
                </Link>
                <Link
                  href={`/dashboard/mission-hub/missions/${mission._id}/edit`}
                  className="flex-1 text-center px-3 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Edit
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredMissions.length === 0 && (
        <div className="text-center py-12">
          <Target className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No missions found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || statusFilter !== "all" 
              ? "Try adjusting your search or filter criteria."
              : "Get started by creating your first mission."
            }
          </p>
          {!searchTerm && statusFilter === "all" && (
            <div className="mt-6">
              <Link
                href="/dashboard/mission-hub/missions/create"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Mission
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
