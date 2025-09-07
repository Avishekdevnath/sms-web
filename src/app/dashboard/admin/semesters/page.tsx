"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Edit, Trash2, Calendar, BookOpen, Filter } from "lucide-react";

interface Semester {
  _id: string;
  batchId: {
    _id: string;
    title: string;
    code: string;
  };
  number: 1 | 2 | 3;
  title?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface SemesterListResponse {
  data: Semester[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function SemestersPage() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSemesters, setTotalSemesters] = useState(0);
  const [deletingSemester, setDeletingSemester] = useState<string | null>(null);
  const [filterBatch, setFilterBatch] = useState("");
  const [filterNumber, setFilterNumber] = useState<"1" | "2" | "3" | "">("");

  useEffect(() => {
    fetchSemesters();
  }, [currentPage, searchTerm, filterBatch, filterNumber]);

  const fetchSemesters = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        ...(searchTerm && { search: searchTerm }),
        ...(filterBatch && { batchId: filterBatch }),
        ...(filterNumber && { number: filterNumber })
      });

      const response = await fetch(`/api/semesters?${params}`);
      const data: SemesterListResponse = await response.json();

      setSemesters(data.data);
      setTotalPages(data.pagination.totalPages);
      setTotalSemesters(data.pagination.total);
    } catch (error) {
      console.error("Error fetching semesters:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSemester = async (semesterId: string) => {
    if (!confirm("Are you sure you want to delete this semester? This action cannot be undone.")) {
      return;
    }

    try {
      setDeletingSemester(semesterId);
      const response = await fetch(`/api/semesters?id=${semesterId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSemesters(semesters.filter(semester => semester._id !== semesterId));
        setTotalSemesters(prev => prev - 1);
      } else {
        const error = await response.json();
        alert(`Error deleting semester: ${error.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error deleting semester:", error);
      alert("Failed to delete semester");
    } finally {
      setDeletingSemester(null);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getSemesterStatus = (semester: Semester) => {
    const now = new Date();
    const startDate = semester.startDate ? new Date(semester.startDate) : null;
    const endDate = semester.endDate ? new Date(semester.endDate) : null;

    if (!startDate && !endDate) return { status: "Not Scheduled", color: "bg-gray-100 text-gray-800" };
    if (startDate && now < startDate) return { status: "Upcoming", color: "bg-blue-100 text-blue-800" };
    if (endDate && now > endDate) return { status: "Completed", color: "bg-green-100 text-green-800" };
    return { status: "Active", color: "bg-yellow-100 text-yellow-800" };
  };

  if (loading && semesters.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading semesters...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black">Semester Management</h1>
          <p className="mt-2 text-gray-600">
            Manage academic semesters and their schedules
          </p>
        </div>
        <Link
          href="/dashboard/admin/semesters/create"
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Semester
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
              <p className="text-sm font-medium text-gray-500">Total Semesters</p>
              <p className="text-2xl font-bold text-black">{totalSemesters}</p>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-6 bg-white">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Calendar className="h-6 w-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Semesters</p>
              <p className="text-2xl font-bold text-black">
                {semesters.filter(s => getSemesterStatus(s).status === "Active").length}
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
              <p className="text-sm font-medium text-gray-500">Upcoming</p>
              <p className="text-2xl font-bold text-black">
                {semesters.filter(s => getSemesterStatus(s).status === "Upcoming").length}
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
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-black">
                {semesters.filter(s => getSemesterStatus(s).status === "Completed").length}
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
              placeholder="Search semesters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
            />
          </div>

          <select
            value={filterNumber}
            onChange={(e) => setFilterNumber(e.target.value as "1" | "2" | "3" | "")}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
          >
            <option value="">All Semesters</option>
            <option value="1">Semester 1</option>
            <option value="2">Semester 2</option>
            <option value="3">Semester 3</option>
          </select>

          <input
            type="text"
            placeholder="Filter by batch..."
            value={filterBatch}
            onChange={(e) => setFilterBatch(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
          />

          <button
            onClick={() => {
              setSearchTerm("");
              setFilterBatch("");
              setFilterNumber("");
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:border-black transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Semesters Table */}
      <div className="border rounded-lg bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Semester
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Batch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  End Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {semesters.map((semester) => {
                const status = getSemesterStatus(semester);
                return (
                  <tr key={semester._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {semester.number}
                        </span>
                        <span className="ml-2 text-sm font-medium text-gray-900">
                          {semester.title || `Semester ${semester.number}`}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {semester.batchId?.title || 'Unknown Batch'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {semester.batchId?.code || 'Unknown Code'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                        {status.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(semester.startDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(semester.endDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={`/dashboard/admin/semesters/${semester._id}`}
                          className="text-gray-600 hover:text-black"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteSemester(semester._id)}
                          disabled={deletingSemester === semester._id}
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
        {semesters.length === 0 && !loading && (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No semesters found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterBatch || filterNumber ? "Try adjusting your search terms." : "Get started by creating a new semester."}
            </p>
            {!searchTerm && !filterBatch && !filterNumber && (
              <div className="mt-6">
                <Link
                  href="/dashboard/admin/semesters/create"
                  className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Semester
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
            Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalSemesters)} of {totalSemesters} results
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
