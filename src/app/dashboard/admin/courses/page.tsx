"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Edit, Trash2, BookOpen, Filter, Eye, Users, Calendar } from "lucide-react";

interface Course {
  _id: string;
  title: string;
  code: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface CourseOffering {
  _id: string;
  courseId: {
    _id: string;
    title: string;
    code: string;
  };
  batchId: {
    _id: string;
    title: string;
    code: string;
  };
  semesterId: {
    _id: string;
    number: number;
    title?: string;
  };
}

interface CourseListResponse {
  courses: Course[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseOfferings, setCourseOfferings] = useState<CourseOffering[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCourses, setTotalCourses] = useState(0);
  const [deletingCourse, setDeletingCourse] = useState<string | null>(null);

  useEffect(() => {
    fetchCourses();
    fetchCourseOfferings();
  }, [currentPage, searchTerm]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/courses?${params}`);
      const data: CourseListResponse = await response.json();

      setCourses(data.courses);
      setTotalPages(data.totalPages);
      setTotalCourses(data.total);
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseOfferings = async () => {
    try {
      const response = await fetch("/api/course-offerings");
      const data = await response.json();
      setCourseOfferings(data.data || []);
    } catch (error) {
      console.error("Error fetching course offerings:", error);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
      return;
    }

    try {
      setDeletingCourse(courseId);
      const response = await fetch(`/api/courses?id=${courseId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setCourses(courses.filter(course => course._id !== courseId));
        setTotalCourses(prev => prev - 1);
      } else {
        const error = await response.json();
        alert(`Error deleting course: ${error.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error deleting course:", error);
      alert("Failed to delete course");
    } finally {
      setDeletingCourse(null);
    }
  };

  const getCourseOfferingsCount = (courseId: string) => {
    return courseOfferings.filter(offering => offering.courseId._id === courseId).length;
  };

  const getActiveBatches = (courseId: string) => {
    const offerings = courseOfferings.filter(offering => offering.courseId._id === courseId);
    const uniqueBatches = new Set(offerings.map(offering => offering.batchId.title));
    return Array.from(uniqueBatches);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading && courses.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black">Course Management</h1>
          <p className="mt-2 text-gray-600">
            Create and manage academic courses
          </p>
        </div>
        <Link
          href="/dashboard/admin/courses/create"
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Course
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
              <p className="text-sm font-medium text-gray-500">Total Courses</p>
              <p className="text-2xl font-bold text-black">{totalCourses}</p>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-6 bg-white">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Users className="h-6 w-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Offerings</p>
              <p className="text-2xl font-bold text-black">{courseOfferings.length}</p>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-6 bg-white">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Calendar className="h-6 w-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Batches</p>
              <p className="text-2xl font-bold text-black">
                {new Set(courseOfferings.map(offering => offering.batchId._id)).size}
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
              <p className="text-sm font-medium text-gray-500">Active Semesters</p>
              <p className="text-2xl font-bold text-black">
                {new Set(courseOfferings.map(offering => offering.semesterId._id)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="border rounded-lg p-6 bg-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
            />
          </div>

          <button
            onClick={() => setSearchTerm("")}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:border-black transition-colors"
          >
            Clear Search
          </button>

          <Link
            href="/dashboard/admin/course-offerings"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors text-center"
          >
            Manage Offerings
          </Link>
        </div>
      </div>

      {/* Courses Table */}
      <div className="border rounded-lg bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Offerings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Active Batches
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {courses.map((course) => {
                const offeringsCount = getCourseOfferingsCount(course._id);
                const activeBatches = getActiveBatches(course._id);
                return (
                  <tr key={course._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{course.title}</div>
                        {course.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {course.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {course.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {offeringsCount} offering{offeringsCount !== 1 ? 's' : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {activeBatches.length > 0 ? (
                          <div className="space-y-1">
                            {activeBatches.slice(0, 2).map((batch, index) => (
                              <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1">
                                {batch}
                              </span>
                            ))}
                            {activeBatches.length > 2 && (
                              <span className="text-xs text-gray-500">
                                +{activeBatches.length - 2} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">No active batches</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(course.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={`/dashboard/admin/courses/${course._id}`}
                          className="text-gray-600 hover:text-black"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/dashboard/admin/courses/${course._id}/edit`}
                          className="text-gray-600 hover:text-black"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteCourse(course._id)}
                          disabled={deletingCourse === course._id}
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
        {courses.length === 0 && !loading && (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No courses found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? "Try adjusting your search terms." : "Get started by creating a new course."}
            </p>
            {!searchTerm && (
              <div className="mt-6">
                <Link
                  href="/dashboard/admin/courses/create"
                  className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Course
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
            Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalCourses)} of {totalCourses} results
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
