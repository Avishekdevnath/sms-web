"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Search, Edit, Trash2, BookOpen, Filter, Eye, Users, Calendar, Link as LinkIcon, RefreshCw, Settings } from "lucide-react";

interface Course {
  _id: string;
  title: string;
  code: string;
  description?: string;
}

interface Batch {
  _id: string;
  title: string;
  code: string;
}

interface Semester {
  _id: string;
  number: number;
  title?: string;
  batchId: {
    _id: string;
    title: string;
    code: string;
  };
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
  createdAt?: string;
  updatedAt?: string;
}

interface GroupedCourseOfferings {
  course: Course;
  offerings: CourseOffering[];
}

export default function CourseOfferingsPage() {
  const router = useRouter();
  const [courseOfferings, setCourseOfferings] = useState<CourseOffering[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBatch, setFilterBatch] = useState("");
  const [filterSemester, setFilterSemester] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Starting to fetch data...");
      
      const [offeringsRes, coursesRes, batchesRes, semestersRes] = await Promise.all([
        fetch("/api/course-offerings"),
        fetch("/api/courses?limit=100"),
        fetch("/api/batches?limit=100"),
        fetch("/api/semesters?limit=100")
      ]);

      console.log("API responses received:", {
        offeringsStatus: offeringsRes.status,
        coursesStatus: coursesRes.status,
        batchesStatus: batchesRes.status,
        semestersStatus: semestersRes.status
      });

      // Check for API errors
      if (!offeringsRes.ok) {
        console.error("Course offerings API error:", offeringsRes.status, offeringsRes.statusText);
      }
      if (!coursesRes.ok) {
        console.error("Courses API error:", coursesRes.status, coursesRes.statusText);
      }
      if (!batchesRes.ok) {
        console.error("Batches API error:", batchesRes.status, batchesRes.statusText);
      }
      if (!semestersRes.ok) {
        console.error("Semesters API error:", semestersRes.status, semestersRes.statusText);
      }

      const offeringsData = await offeringsRes.json();
      const coursesData = await coursesRes.json();
      const batchesData = await batchesRes.json();
      const semestersData = await semestersRes.json();

      console.log("Fetched data:", {
        offerings: offeringsData,
        courses: coursesData,
        batches: batchesData,
        semesters: semestersData
      });

      // Course Offerings API returns { data: data }
      setCourseOfferings(offeringsData.data || []);
      setCourses(coursesData.courses || []);
      setBatches(batchesData.batches || []);
      setSemesters(semestersData.data || []);
      
      console.log("Data set successfully:", {
        courseOfferingsCount: offeringsData.data?.length || 0,
        coursesCount: coursesData.courses?.length || 0,
        batchesCount: batchesData.batches?.length || 0,
        semestersCount: semestersData.data?.length || 0
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // Group offerings by course - FIXED: One course can have multiple offerings
  const getGroupedOfferings = (): GroupedCourseOfferings[] => {
    if (!courseOfferings || courseOfferings.length === 0) {
      return [];
    }

    // Create a map to group offerings by course
    const groupedMap = new Map<string, GroupedCourseOfferings>();

    courseOfferings.forEach((offering) => {
      // Skip offerings with missing critical data
      if (!offering || !offering._id) {
        return;
      }

      // Get course info
      let course: Course | null = null;
      if (offering.courseId && offering.courseId._id) {
        course = offering.courseId;
      } else {
        // Try to find course by ID from courses array
        course = courses.find(c => c._id === offering.courseId?._id) || null;
      }

      if (!course) {
        return; // Skip if no valid course found
      }

      const courseId = course._id;
      
      if (!groupedMap.has(courseId)) {
        groupedMap.set(courseId, {
          course: course,
          offerings: []
        });
      }

      // Add offering if it has valid batch and semester data
      if (offering.batchId && offering.batchId._id && offering.semesterId && offering.semesterId._id) {
        groupedMap.get(courseId)!.offerings.push(offering);
      }
    });

    return Array.from(groupedMap.values());
  };

  const getFilteredGroupedOfferings = () => {
    let grouped = getGroupedOfferings();

    // Apply search filter
    if (searchTerm && searchTerm.trim()) {
      grouped = grouped.filter(group => {
        if (!group.course) return false;
        const searchLower = searchTerm.toLowerCase();
        return (
          (group.course.title && group.course.title.toLowerCase().includes(searchLower)) ||
          (group.course.code && group.course.code.toLowerCase().includes(searchLower))
        );
      });
    }

    // Apply batch filter
    if (filterBatch && filterBatch.trim()) {
      grouped = grouped.map(group => ({
        ...group,
        offerings: group.offerings.filter(offering => 
          offering.batchId && offering.batchId._id === filterBatch
        )
      })).filter(group => group.offerings.length > 0);
    }

    // Apply semester filter
    if (filterSemester && filterSemester.trim()) {
      grouped = grouped.map(group => ({
        ...group,
        offerings: group.offerings.filter(offering => 
          offering.semesterId && offering.semesterId._id === filterSemester
        )
      })).filter(group => group.offerings.length > 0);
    }

    return grouped;
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterBatch("");
    setFilterSemester("");
  };

  const handleManageCourse = (course: Course) => {
    if (course && course._id) {
      router.push(`/dashboard/admin/course-offerings/${course._id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course offerings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️ Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const groupedOfferings = getFilteredGroupedOfferings();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black">Course Offerings Management</h1>
          <p className="mt-2 text-gray-600">
            Manage course offerings grouped by course
          </p>
        </div>
        <div className="flex gap-3 mt-4 sm:mt-0">
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm hover:border-black transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            href="/dashboard/admin/course-offerings/create"
            className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Offering
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="border rounded-lg p-6 bg-white">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <LinkIcon className="h-6 w-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Offerings</p>
              <p className="text-2xl font-bold text-black">{courseOfferings?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-6 bg-white">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Courses</p>
              <p className="text-2xl font-bold text-black">{groupedOfferings?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-6 bg-white">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Users className="h-6 w-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Batches</p>
              <p className="text-2xl font-bold text-black">
                {batches && batches.length > 0 ? batches.length : 0}
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
              <p className="text-sm font-medium text-gray-500">Active Semesters</p>
              <p className="text-2xl font-bold text-black">
                {semesters && semesters.length > 0 ? semesters.length : 0}
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
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
            />
          </div>

          <select
            value={filterBatch}
            onChange={(e) => setFilterBatch(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
          >
            <option value="">All Batches</option>
            {batches && batches.map((batch) => (
              <option key={batch._id} value={batch._id}>
                {batch.code} - {batch.title}
              </option>
            ))}
          </select>

          <select
            value={filterSemester}
            onChange={(e) => setFilterSemester(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
          >
            <option value="">All Semesters</option>
            {semesters && semesters
              .filter(semester => semester && semester.batchId && semester.batchId.code)
              .map((semester) => (
                <option key={semester._id} value={semester._id}>
                  {semester.batchId?.code || 'Unknown'} - Semester {semester.number}
                </option>
              ))}
          </select>

          <button
            onClick={clearFilters}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:border-black transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Course Offerings Table */}
      <div className="border rounded-lg bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Offerings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Offerings
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {groupedOfferings && groupedOfferings.length > 0 ? (
                groupedOfferings.map((group) => (
                  <tr key={group.course?._id || `group-${Math.random()}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        {group.course ? (
                          <>
                            <div className="text-sm font-medium text-gray-900">
                              {group.course.title || 'Unknown Course'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {group.course.code || 'Unknown Code'}
                            </div>
                            {group.course.description && (
                              <div className="text-xs text-gray-400 mt-1">{group.course.description}</div>
                            )}
                          </>
                        ) : (
                          <div className="text-sm text-red-600">Invalid Course Data</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        {group.offerings && group.offerings.length > 0 ? (
                          group.offerings.map((offering) => (
                            <div key={offering._id} className="flex items-center space-x-2">
                              <span className="text-sm text-gray-900">
                                {offering.batchId?.code || 'Unknown Batch'}
                              </span>
                              <span className="text-gray-400">•</span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                Semester {offering.semesterId?.number || 'Unknown'}
                              </span>
                            </div>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500">No offerings</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {group.offerings?.length || 0} offering{(group.offerings?.length || 0) !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => group.course && handleManageCourse(group.course)}
                        disabled={!group.course}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm hover:border-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Manage offerings"
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Manage
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    No course offerings found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {(!groupedOfferings || groupedOfferings.length === 0) && (
          <div className="text-center py-12">
            <LinkIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No course offerings found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterBatch || filterSemester ? "Try adjusting your search terms." : "Get started by creating a new course offering."}
            </p>
            {!searchTerm && !filterBatch && !filterSemester && (
              <div className="mt-6">
                <Link
                  href="/dashboard/admin/course-offerings/create"
                  className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Offering
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
