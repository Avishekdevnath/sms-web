"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Filter, MoreVertical, UserCheck, Target, Users, TrendingUp } from "lucide-react";

interface MissionHubMentor {
  _id: string;
  name: string;
  email: string;
  specialization: string;
  assignedStudents: number;
  activeMissions: number;
  avgStudentProgress: number;
  status: 'active' | 'inactive' | 'busy';
  rating: number;
}

export default function MissionHubMentorsPage() {
  const [mentors, setMentors] = useState<MissionHubMentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    // TODO: Replace with actual API call
    // For now, using mock data
    setMentors([
      {
        _id: '1',
        name: 'Dr. Sarah Johnson',
        email: 'sarah.johnson@example.com',
        specialization: 'Web Development',
        assignedStudents: 8,
        activeMissions: 3,
        avgStudentProgress: 78,
        status: 'active',
        rating: 4.8
      },
      {
        _id: '2',
        name: 'Prof. Michael Chen',
        email: 'michael.chen@example.com',
        specialization: 'Data Science',
        assignedStudents: 6,
        activeMissions: 2,
        avgStudentProgress: 85,
        status: 'active',
        rating: 4.9
      },
      {
        _id: '3',
        name: 'Dr. Emily Rodriguez',
        email: 'emily.rodriguez@example.com',
        specialization: 'Mobile Development',
        assignedStudents: 10,
        activeMissions: 4,
        avgStudentProgress: 72,
        status: 'busy',
        rating: 4.6
      }
    ]);
    setLoading(false);
  }, []);

  const filteredMentors = mentors.filter(mentor => {
    const matchesSearch = mentor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mentor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mentor.specialization.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || mentor.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'busy': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }

    if (hasHalfStar) {
      stars.push(
        <svg key="half" className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <defs>
            <linearGradient id="halfStar">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="#e5e7eb" />
            </linearGradient>
          </defs>
          <path fill="url(#halfStar)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <svg key={`empty-${i}`} className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }

    return stars;
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
          <h1 className="text-2xl font-bold text-gray-900">Mission Hub Mentors</h1>
          <p className="text-gray-600">Manage mentor assignments and track performance</p>
        </div>
        <Link
          href="/dashboard/mission-hub/mentors/assign"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Assign Mentor
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
                placeholder="Search mentors..."
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
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="busy">Busy</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mentors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMentors.map((mentor) => (
          <div key={mentor._id} className="bg-white rounded-lg shadow border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="p-6">
              {/* Mentor Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{mentor.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{mentor.email}</p>
                  <p className="text-xs text-blue-600 font-medium">{mentor.specialization}</p>
                </div>
                <button className="ml-2 p-1 text-gray-400 hover:text-gray-600 rounded">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>

              {/* Rating */}
              <div className="mb-4">
                <div className="flex items-center space-x-1 mb-1">
                  {renderStars(mentor.rating)}
                  <span className="ml-2 text-sm text-gray-600">({mentor.rating})</span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="mb-4">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(mentor.status)}`}>
                  {getStatusLabel(mentor.status)}
                </span>
              </div>

              {/* Mentor Stats */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg mx-auto mb-1">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="text-xs text-gray-600">Students</p>
                  <p className="text-sm font-semibold text-gray-900">{mentor.assignedStudents}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg mx-auto mb-1">
                    <Target className="h-4 w-4 text-purple-600" />
                  </div>
                  <p className="text-xs text-gray-600">Missions</p>
                  <p className="text-sm font-semibold text-gray-900">{mentor.activeMissions}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg mx-auto mb-1">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="text-xs text-gray-600">Avg Progress</p>
                  <p className="text-sm font-semibold text-gray-900">{mentor.avgStudentProgress}%</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span>Student Progress</span>
                  <span>{mentor.avgStudentProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${mentor.avgStudentProgress}%` }}
                  ></div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <Link
                  href={`/dashboard/mission-hub/mentors/${mentor._id}`}
                  className="flex-1 text-center px-3 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  View Details
                </Link>
                <Link
                  href={`/dashboard/mission-hub/mentors/${mentor._id}/edit`}
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
      {filteredMentors.length === 0 && (
        <div className="text-center py-12">
          <UserCheck className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No mentors found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || statusFilter !== "all" 
              ? "Try adjusting your search or filter criteria."
              : "Get started by assigning mentors to missions."
            }
          </p>
          {!searchTerm && statusFilter === "all" && (
            <div className="mt-6">
              <Link
                href="/dashboard/mission-hub/mentors/assign"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Assign Mentor
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
