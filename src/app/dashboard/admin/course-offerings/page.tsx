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

interface CourseOfferingFormData {
  courseId: string;
  batchId: string;
  semesterId: string;
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
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deletingOffering, setDeletingOffering] = useState<string | null>(null);
  const [formData, setFormData] = useState<CourseOfferingFormData>({
    courseId: "",
    batchId: "",
    semesterId: ""
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [offeringsRes, coursesRes, batchesRes, semestersRes] = await Promise.all([
        fetch("/api/course-offerings"),
        fetch("/api/courses?limit=100"),
        fetch("/api/batches?limit=100"),
        fetch("/api/semesters?limit=100")
      ]);

      const offeringsData = await offeringsRes.json();
      const coursesData = await coursesRes.json();
      const batchesData = await batchesRes.json();
      const semestersData = await semestersRes.json();

      setCourseOfferings(offeringsData.data || []);
      setCourses(coursesData.courses || []);
      setBatches(batchesData.data || []);
      setSemesters(semestersData.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // Group offerings by course
  const getGroupedOfferings = (): GroupedCourseOfferings[] => {
    const grouped = courseOfferings.reduce((acc, offering) => {
      const courseId = offering.courseId._id;
      if (!acc[courseId]) {
        acc[courseId] = {
          course: offering.courseId,
          offerings: []
        };
      }
      acc[courseId].offerings.push(offering);
      return acc;
    }, {} as Record<string, GroupedCourseOfferings>);

    return Object.values(grouped);
  };

  const getFilteredGroupedOfferings = () => {
    let grouped = getGroupedOfferings();

    if (searchTerm) {
      grouped = grouped.filter(group => 
        group.course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.course.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterBatch) {
      grouped = grouped.map(group => ({
        ...group,
        offerings: group.offerings.filter(offering => offering.batchId._id === filterBatch)
      })).filter(group => group.offerings.length > 0);
    }

    if (filterSemester) {
      grouped = grouped.map(group => ({
        ...group,
        offerings: group.offerings.filter(offering => offering.semesterId._id === filterSemester)
      })).filter(group => group.offerings.length > 0);
    }

    return grouped;
  };

  const handleDeleteOffering = async (offeringId: string) => {
    if (!confirm("Are you sure you want to delete this course offering? This will also delete all related assignments and submissions.")) {
      return;
    }

    try {
      setDeletingOffering(offeringId);
      const response = await fetch(`/api/course-offerings?id=${offeringId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setCourseOfferings(offerings => offerings.filter(offering => offering._id !== offeringId));
        setSuccessMessage("Course offering deleted successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        const error = await response.json();
        alert(`Error deleting course offering: ${error.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error deleting course offering:", error);
      alert("Failed to delete course offering");
    } finally {
      setDeletingOffering(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (name === 'batchId') {
      setFormData(prev => ({
        ...prev,
        batchId: value,
        semesterId: ""
      }));
    }
    
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.courseId) errors.courseId = "Course is required";
    if (!formData.batchId) errors.batchId = "Batch is required";
    if (!formData.semesterId) errors.semesterId = "Semester is required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch("/api/course-offerings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        
        const newOfferingResponse = await fetch(`/api/course-offerings?id=${result.data._id}`);
        const newOfferingData = await newOfferingResponse.json();
        
        setCourseOfferings(prev => [...prev, newOfferingData.data]);
        
        setFormData({ courseId: "", batchId: "", semesterId: "" });
        setShowCreateForm(false);
        setFormErrors({});
        setSuccessMessage("Course offering created successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        const error = await response.json();
        alert(`Error creating course offering: ${error.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error creating course offering:", error);
      alert("Failed to create course offering");
    } finally {
      setSubmitting(false);
    }
  };

  const getSemestersForBatch = (batchId: string) => {
    return semesters.filter(semester => semester.batchId._id === batchId);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterBatch("");
    setFilterSemester("");
  };

  const handleManageCourse = (course: Course) => {
    router.push(`/dashboard/admin/course-offerings/${course._id}`);
  };

  const getCourseOfferings = (courseId: string) => {
    return courseOfferings.filter(offering => offering.courseId._id === courseId);
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
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Offering
          </button>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="border rounded-lg p-6 bg-white">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <LinkIcon className="h-6 w-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Offerings</p>
              <p className="text-2xl font-bold text-black">{courseOfferings.length}</p>
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
              <p className="text-2xl font-bold text-black">{groupedOfferings.length}</p>
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
                {new Set(courseOfferings.map(offering => offering.batchId._id)).size}
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
                {new Set(courseOfferings.map(offering => offering.semesterId._id)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="border rounded-lg p-6 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-black">Create New Course Offering</h3>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setFormData({ courseId: "", batchId: "", semesterId: "" });
                setFormErrors({});
              }}
              className="text-gray-500 hover:text-black"
            >
              ×
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="courseId" className="block text-sm font-medium text-gray-700 mb-2">
                  Course *
                </label>
                <select
                  id="courseId"
                  name="courseId"
                  value={formData.courseId}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 ${
                    formErrors.courseId ? "border-red-500" : "border-gray-300 focus:ring-black"
                  }`}
                >
                  <option value="">Select a course</option>
                  {courses.map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.code} - {course.title}
                    </option>
                  ))}
                </select>
                {formErrors.courseId && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.courseId}</p>
                )}
              </div>

              <div>
                <label htmlFor="batchId" className="block text-sm font-medium text-gray-700 mb-2">
                  Batch *
                </label>
                <select
                  id="batchId"
                  name="batchId"
                  value={formData.batchId}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 ${
                    formErrors.batchId ? "border-red-500" : "border-gray-300 focus:ring-black"
                  }`}
                >
                  <option value="">Select a batch</option>
                  {batches.map((batch) => (
                    <option key={batch._id} value={batch._id}>
                      {batch.code} - {batch.title}
                    </option>
                  ))}
                </select>
                {formErrors.batchId && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.batchId}</p>
                )}
              </div>

              <div>
                <label htmlFor="semesterId" className="block text-sm font-medium text-gray-700 mb-2">
                  Semester *
                </label>
                <select
                  id="semesterId"
                  name="semesterId"
                  value={formData.semesterId}
                  onChange={handleInputChange}
                  disabled={!formData.batchId}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 ${
                    formErrors.semesterId ? "border-red-500" : "border-gray-300 focus:ring-black"
                  } ${!formData.batchId ? "bg-gray-100" : ""}`}
                >
                  <option value="">Select a semester</option>
                  {formData.batchId && getSemestersForBatch(formData.batchId).map((semester) => (
                    <option key={semester._id} value={semester._id}>
                      Semester {semester.number} - {semester.title || `Semester ${semester.number}`}
                    </option>
                  ))}
                </select>
                {formErrors.semesterId && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.semesterId}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-4 pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setFormData({ courseId: "", batchId: "", semesterId: "" });
                  setFormErrors({});
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:border-black transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {submitting ? "Creating..." : "Create Offering"}
              </button>
            </div>
          </form>
        </div>
      )}



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
            {batches.map((batch) => (
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
            {semesters.map((semester) => (
              <option key={semester._id} value={semester._id}>
                {semester.batchId.code} - Semester {semester.number}
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
              {groupedOfferings.map((group) => (
                <tr key={group.course._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{group.course.title}</div>
                      <div className="text-sm text-gray-500">{group.course.code}</div>
                      {group.course.description && (
                        <div className="text-xs text-gray-400 mt-1">{group.course.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      {group.offerings.map((offering) => (
                        <div key={offering._id} className="flex items-center space-x-2">
                          <span className="text-sm text-gray-900">{offering.batchId.code}</span>
                          <span className="text-gray-400">•</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            Semester {offering.semesterId.number}
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {group.offerings.length} offering{group.offerings.length !== 1 ? 's' : ''}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleManageCourse(group.course)}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm hover:border-black transition-colors"
                      title="Manage offerings"
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {groupedOfferings.length === 0 && (
          <div className="text-center py-12">
            <LinkIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No course offerings found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterBatch || filterSemester ? "Try adjusting your search terms." : "Get started by creating a new course offering."}
            </p>
            {!searchTerm && !filterBatch && !filterSemester && (
              <div className="mt-6">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Offering
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
