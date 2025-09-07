"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Target, Plus, Search, Filter, Eye, Edit, Users } from "lucide-react";

interface Mission {
  _id: string;
  code: string;
  title: string;
  status: string;
  description: string;
  students: any[];
  maxStudents: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  batch?: {
    code: string;
    title: string;
  };
}

export default function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchMissions();
  }, [searchTerm, statusFilter]);

  const fetchMissions = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      const response = await fetch(`/api/mission-hub/missions?${params}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.missions) {
          setMissions(data.data.missions || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch missions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading missions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Missions</h1>
          <p className="text-gray-600">Manage learning missions and track progress</p>
        </div>
        <Link
          href="/mission-hub/missions/create"
          className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md font-medium hover:bg-purple-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Mission
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search missions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Missions Grid */}
      {missions.length === 0 ? (
        <div className="text-center py-12">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No missions found</h3>
          <p className="text-gray-500">
            {searchTerm || statusFilter !== "all" 
              ? "Try adjusting your search or filters"
              : "Get started by creating your first mission"
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {missions.map((mission) => (
            <div key={mission._id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{mission.title}</h3>
                    <p className="text-sm text-gray-500 mb-2">{mission.code}</p>
                    <p className="text-sm text-gray-600 line-clamp-2">{mission.description}</p>
                    {mission.batch && (
                      <p className="text-xs text-blue-600 mt-1">Batch: {mission.batch.code}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(mission.status)}`}>
                    {mission.status}
                  </span>
                  <div className="flex items-center text-sm text-gray-500">
                    <Users className="h-4 w-4 mr-1" />
                    {mission.studentCount || 0}/{mission.maxStudents}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>Created: {new Date(mission.createdAt).toLocaleDateString()}</span>
                  {mission.startDate && (
                    <span>Start: {new Date(mission.startDate).toLocaleDateString()}</span>
                  )}
                </div>

                <div className="flex space-x-2">
                  <Link
                    href={`/mission-hub/missions/${mission._id}/students`}
                    className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                  >
                    <Users className="h-4 w-4 mr-1" />
                    Manage Students
                  </Link>
                  <Link
                    href={`/mission-hub/missions/${mission._id}/view`}
                    className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-md hover:bg-purple-100 transition-colors"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Link>
                  <Link
                    href={`/mission-hub/missions/${mission._id}/edit`}
                    className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-md hover:bg-green-100 transition-colors"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
