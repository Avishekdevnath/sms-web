"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Edit, Trash2, User, Filter, Eye, Users, Calendar, GraduationCap } from "lucide-react";

interface StudentProfile {
  _id: string;
  userId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  username: string;
  phone: string;
    email: string;
  profilePicture?: string;
  bio?: string;
  academicInfo?: {
    previousInstitution?: string;
    graduationYear?: number;
    gpa?: number;
    courseGoal?: string;
  };
    isActive: boolean;
    profileCompleted: boolean;
  completedAt?: string;
    createdAt: string;
  updatedAt: string;
  batches: Array<{
    id: string;
    title: string;
    code: string;
    status: string;
  }>;
  enrollment?: {
  status: string;
  batchId: {
    _id: string;
      title: string;
    code: string;
    };
    invitedAt?: string;
    activatedAt?: string;
  };
}

interface StudentProfileListResponse {
  profiles: StudentProfile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function StudentsPage() {
  const [profiles, setProfiles] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [deletingProfile, setDeletingProfile] = useState<string | null>(null);

  useEffect(() => {
    fetchStudentProfiles();
  }, [currentPage, searchTerm, statusFilter]);

  const fetchStudentProfiles = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter })
      });

      const response = await fetch(`/api/student-profiles?${params}`);
      const data: StudentProfileListResponse = await response.json();

      setProfiles(data.profiles);
      setTotalPages(data.totalPages);
      setTotalStudents(data.total);
    } catch (error) {
      console.error("Error fetching student profiles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProfile = async (profileId: string) => {
    if (!confirm("Are you sure you want to delete this student? This action cannot be undone.")) {
      return;
    }

    try {
      setDeletingProfile(profileId);
      const response = await fetch(`/api/student-profiles/${profileId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setProfiles(profiles.filter(profile => profile._id !== profileId));
        setTotalStudents(prev => prev - 1);
        } else {
        const error = await response.json();
        alert(`Error deleting student: ${error.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error deleting student:", error);
      alert("Failed to delete student");
    } finally {
      setDeletingProfile(null);
    }
  };

  const getStatusBadge = (profile: StudentProfile) => {
    if (!profile.isActive) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Inactive</span>;
    }
    if (!profile.profileCompleted) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Profile Pending</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>;
  };

  const getBatchesDisplay = (profile: StudentProfile) => {
    if (profile.batches.length === 0) {
      return <span className="text-gray-400">No batches</span>;
    }
    
    return (
      <div className="space-y-1">
        {profile.batches.slice(0, 2).map((batch, index) => (
          <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1">
            {batch.code}
          </span>
        ))}
        {profile.batches.length > 2 && (
          <span className="text-xs text-gray-500">
            +{profile.batches.length - 2} more
          </span>
        )}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (loading && profiles.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black">Student Management</h1>
          <p className="mt-2 text-gray-600">
            Manage and view all enrolled students
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Link
            href="/dashboard/admin/students/enroll"
            className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Enroll New Students
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="border rounded-lg p-6 bg-white">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Users className="h-6 w-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Students</p>
              <p className="text-2xl font-bold text-black">{totalStudents}</p>
          </div>
        </div>
        </div>
        
        <div className="border rounded-lg p-6 bg-white">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <User className="h-6 w-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Students</p>
              <p className="text-2xl font-bold text-black">
                {profiles.filter(p => p.isActive && p.profileCompleted).length}
              </p>
            </div>
            </div>
          </div>

        <div className="border rounded-lg p-6 bg-white">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Calendar className="h-6 w-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Profile Pending</p>
              <p className="text-2xl font-bold text-black">
                {profiles.filter(p => !p.profileCompleted).length}
              </p>
            </div>
          </div>
      </div>

        <div className="border rounded-lg p-6 bg-white">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <GraduationCap className="h-6 w-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Enrolled in Batches</p>
              <p className="text-2xl font-bold text-black">
                {profiles.filter(p => p.batches.length > 0).length}
              </p>
            </div>
            </div>
            </div>
      </div>

          {/* Search and Filters */}
      <div className="border rounded-lg p-6 bg-white">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
            />
              </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Profile Pending</option>
          </select>

                <button
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("");
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:border-black transition-colors"
          >
            Clear Filters
                </button>

          <Link
            href="/dashboard/admin/students/invite"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors text-center"
          >
            Manage Invitations
          </Link>
            </div>
          </div>

          {/* Students Table */}
      <div className="border rounded-lg bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Batches
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Enrollment
                    </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                    </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
              {profiles.map((profile) => (
                <tr key={profile._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                        {profile.profilePicture ? (
                          <img
                            className="h-10 w-10 rounded-full"
                            src={profile.profilePicture}
                            alt={profile.fullName}
                          />
                        ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-700">
                              {getInitials(profile.firstName, profile.lastName)}
                                </span>
                              </div>
                        )}
                            </div>
                            <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{profile.fullName}</div>
                        <div className="text-sm text-gray-500">{profile.email}</div>
                        <div className="text-xs text-gray-400">@{profile.username}</div>
                            </div>
                          </div>
                        </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(profile)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getBatchesDisplay(profile)}
                        </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {profile.enrollment ? (
                      <div>
                        <div className="text-sm text-gray-900">{profile.enrollment.batchId.code}</div>
                        <div className="text-xs text-gray-500">{profile.enrollment.status}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">Not enrolled</span>
                    )}
                        </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(profile.createdAt)}
                        </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <Link
                        href={`/dashboard/admin/students/${profile._id}`}
                        className="text-gray-600 hover:text-black"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/dashboard/admin/students/${profile._id}/edit`}
                        className="text-gray-600 hover:text-black"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                            <button
                        onClick={() => handleDeleteProfile(profile._id)}
                        disabled={deletingProfile === profile._id}
                        className="text-gray-600 hover:text-red-600 disabled:opacity-50"
                            >
                        <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
              ))}
                </tbody>
              </table>
            </div>

        {/* Empty State */}
        {profiles.length === 0 && !loading && (
          <div className="text-center py-12">
            <User className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter ? "Try adjusting your search terms." : "Get started by enrolling new students."}
            </p>
            {!searchTerm && !statusFilter && (
              <div className="mt-6">
                              <Link
                                href="/dashboard/admin/students/enroll"
                  className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                                Enroll New Students
                              </Link>
                            </div>
                          )}
                        </div>
                            )}
                          </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalStudents)} of {totalStudents} results
                          </div>
          <div className="flex space-x-2">
                            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:border-black"
                            >
              Previous
                            </button>
                            <button 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:border-black"
            >
              Next
                            </button>
          </div>
        </div>
      )}
    </div>
  );
}
