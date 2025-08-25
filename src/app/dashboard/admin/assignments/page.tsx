"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Edit, Trash2, Calendar, BookOpen, Filter, Eye, Download } from "lucide-react";

interface Assignment {
  _id: string;
  courseOfferingId: {
    _id: string;
    title: string;
    code: string;
  };
  title: string;
  description?: string;
  dueAt?: string;
  publishedAt?: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  maxPoints?: number;
  attachments?: Array<{
    name: string;
    url: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface AssignmentListResponse {
  assignments: Assignment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAssignments, setTotalAssignments] = useState(0);
  const [deletingAssignment, setDeletingAssignment] = useState<string | null>(null);
  const [filterPublished, setFilterPublished] = useState<"all" | "published" | "unpublished">("all");
  const [filterCourse, setFilterCourse] = useState("");

  useEffect(() => {
    fetchAssignments();
  }, [currentPage, searchTerm, filterPublished, filterCourse]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        ...(searchTerm && { search: searchTerm }),
        ...(filterPublished !== "all" && { published: filterPublished === "published" ? "true" : "false" }),
        ...(filterCourse && { courseOfferingId: filterCourse })
      });

      const response = await fetch(`/api/assignments?${params}`);
      const data: AssignmentListResponse = await response.json();

      setAssignments(data.assignments);
      setTotalPages(data.totalPages);
      setTotalAssignments(data.total);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm("Are you sure you want to delete this assignment? This action cannot be undone.")) {
      return;
    }

    try {
      setDeletingAssignment(assignmentId);
      const response = await fetch(`/api/assignments?id=${assignmentId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setAssignments(assignments.filter(assignment => assignment._id !== assignmentId));
        setTotalAssignments(prev => prev - 1);
      } else {
        const error = await response.json();
        alert(`Error deleting assignment: ${error.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error deleting assignment:", error);
      alert("Failed to delete assignment");
    } finally {
      setDeletingAssignment(null);
    }
  };

  const handlePublishAssignment = async (assignmentId: string) => {
    try {
      const response = await fetch(`/api/assignments/publish?id=${assignmentId}`, {
        method: "POST",
      });

      if (response.ok) {
        fetchAssignments(); // Refresh the list
      } else {
        const error = await response.json();
        alert(`Error publishing assignment: ${error.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error publishing assignment:", error);
      alert("Failed to publish assignment");
    }
  };

  const handleUnpublishAssignment = async (assignmentId: string) => {
    try {
      const response = await fetch(`/api/assignments/unpublish?id=${assignmentId}`, {
        method: "POST",
      });

      if (response.ok) {
        fetchAssignments(); // Refresh the list
      } else {
        const error = await response.json();
        alert(`Error unpublishing assignment: ${error.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error unpublishing assignment:", error);
      alert("Failed to unpublish assignment");
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getAssignmentStatus = (assignment: Assignment) => {
    const now = new Date();
    const dueDate = assignment.dueAt ? new Date(assignment.dueAt) : null;
    const publishedAt = assignment.publishedAt ? new Date(assignment.publishedAt) : null;

    if (!publishedAt) return { status: "Draft", color: "bg-gray-100 text-gray-800" };
    if (dueDate && now > dueDate) return { status: "Overdue", color: "bg-red-100 text-red-800" };
    if (dueDate && now < dueDate) return { status: "Active", color: "bg-green-100 text-green-800" };
    return { status: "Published", color: "bg-blue-100 text-blue-800" };
  };

  if (loading && assignments.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black">Assignment Management</h1>
          <p className="mt-2 text-gray-600">
            Create and manage course assignments
          </p>
        </div>
        <Link
          href="/dashboard/admin/assignments/create"
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Assignment
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="border rounded-lg p-6 bg-white">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Assignments</p>
              <p className="text-2xl font-bold text-black">{totalAssignments}</p>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-6 bg-white">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Calendar className="h-6 w-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Published</p>
              <p className="text-2xl font-bold text-black">
                {assignments.filter(a => a.publishedAt).length}
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
              <p className="text-sm font-medium text-gray-500">Draft</p>
              <p className="text-2xl font-bold text-black">
                {assignments.filter(a => !a.publishedAt).length}
              </p>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-6 bg-white">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Overdue</p>
              <p className="text-2xl font-bold text-black">
                {assignments.filter(a => {
                  const dueDate = a.dueAt ? new Date(a.dueAt) : null;
                  return dueDate && new Date() > dueDate;
                }).length}
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
              placeholder="Search assignments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
            />
          </div>

          <select
            value={filterPublished}
            onChange={(e) => setFilterPublished(e.target.value as "all" | "published" | "unpublished")}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="unpublished">Draft</option>
          </select>

          <input
            type="text"
            placeholder="Filter by course..."
            value={filterCourse}
            onChange={(e) => setFilterCourse(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
          />

          <button
            onClick={() => {
              setSearchTerm("");
              setFilterPublished("all");
              setFilterCourse("");
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:border-black transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Assignments Table */}
      <div className="border rounded-lg bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assignment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Points
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {assignments.map((assignment) => {
                const status = getAssignmentStatus(assignment);
                return (
                  <tr key={assignment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{assignment.title}</div>
                        {assignment.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {assignment.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{assignment.courseOfferingId.title}</div>
                      <div className="text-sm text-gray-500">{assignment.courseOfferingId.code}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                        {status.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(assignment.dueAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {assignment.maxPoints || 100}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={`/dashboard/admin/assignments/${assignment._id}`}
                          className="text-gray-600 hover:text-black"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/dashboard/admin/assignments/${assignment._id}/edit`}
                          className="text-gray-600 hover:text-black"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        {assignment.publishedAt ? (
                          <button
                            onClick={() => handleUnpublishAssignment(assignment._id)}
                            className="text-gray-600 hover:text-yellow-600"
                            title="Unpublish"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePublishAssignment(assignment._id)}
                            className="text-gray-600 hover:text-green-600"
                            title="Publish"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteAssignment(assignment._id)}
                          disabled={deletingAssignment === assignment._id}
                          className="text-gray-600 hover:text-red-600 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {assignments.length === 0 && !loading && (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No assignments found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterPublished !== "all" || filterCourse ? "Try adjusting your search terms." : "Get started by creating a new assignment."}
            </p>
            {!searchTerm && filterPublished === "all" && !filterCourse && (
              <div className="mt-6">
                <Link
                  href="/dashboard/admin/assignments/create"
                  className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Assignment
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
            Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalAssignments)} of {totalAssignments} results
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
