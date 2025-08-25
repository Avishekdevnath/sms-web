"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Plus, Search, Trash2, BookOpen, ArrowLeft, RefreshCw } from "lucide-react";

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

export default function CourseOfferingsManagePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [courseOfferings, setCourseOfferings] = useState<CourseOffering[]>([]);
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
    courseId: courseId,
    batchId: "",
    semesterId: ""
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (courseId) {
      fetchData();
    }
  }, [courseId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [courseRes, offeringsRes, batchesRes, semestersRes] = await Promise.all([
        fetch(`/api/courses?id=${courseId}`),
        fetch(`/api/course-offerings?courseId=${courseId}`),
        fetch("/api/batches?limit=100"),
        fetch("/api/semesters?limit=100")
      ]);

      const courseData = await courseRes.json();
      const offeringsData = await offeringsRes.json();
      const batchesData = await batchesRes.json();
      const semestersData = await semestersRes.json();

      setCourse(courseData.courses?.[0] || null);
      setCourseOfferings(offeringsData.data || []);
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
        
        setFormData({ courseId: courseId, batchId: "", semesterId: "" });
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

  const getFilteredOfferings = () => {
    let filtered = courseOfferings;

    if (searchTerm) {
      filtered = filtered.filter(offering => 
        offering.batchId.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        offering.batchId.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterBatch) {
      filtered = filtered.filter(offering => offering.batchId._id === filterBatch);
    }

    if (filterSemester) {
      filtered = filtered.filter(offering => offering.semesterId._id === filterSemester);
    }

    return filtered;
  };

  const getSemestersForBatch = (batchId: string) => {
    return semesters.filter(semester => semester.batchId._id === batchId);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterBatch("");
    setFilterSemester("");
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

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold text-black mb-2">Course Not Found</h2>
          <p className="text-gray-600 mb-4">The course you're looking for doesn't exist.</p>
          <Link
            href="/dashboard/admin/course-offerings"
            className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Course Offerings
          </Link>
        </div>
      </div>
    );
  }

  const filteredOfferings = getFilteredOfferings();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/admin/course-offerings"
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm hover:border-black transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-black">Manage Course Offerings</h1>
            <p className="mt-2 text-gray-600">
              {course.code} - {course.title}
            </p>
          </div>
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
            Add Offering
          </button>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      {/* Course Information */}
      <div className="border rounded-lg p-6 bg-white">
        <h2 className="text-xl font-bold text-black mb-4">Course Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Course Code</label>
            <p className="text-lg font-medium text-black">{course.code}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Course Title</label>
            <p className="text-lg font-medium text-black">{course.title}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Description</label>
            <p className="text-lg text-gray-900">{course.description || 'No description available'}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border rounded-lg p-6 bg-white">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-gray-600" />
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

      {/* Create Form */}
      {showCreateForm && (
        <div className="border rounded-lg p-6 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-black">Add New Offering</h3>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setFormData({ courseId: courseId, batchId: "", semesterId: "" });
                setFormErrors({});
              }}
              className="text-gray-500 hover:text-black"
            >
              ×
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  setFormData({ courseId: courseId, batchId: "", semesterId: "" });
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
                {submitting ? "Adding..." : "Add Offering"}
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
              placeholder="Search batches..."
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
                  Batch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Semester
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
              {filteredOfferings.map((offering) => (
                <tr key={offering._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{offering.batchId.title}</div>
                      <div className="text-sm text-gray-500">{offering.batchId.code}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Semester {offering.semesterId.number}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {offering.createdAt ? new Date(offering.createdAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleDeleteOffering(offering._id)}
                      disabled={deletingOffering === offering._id}
                      className="text-gray-600 hover:text-red-600 disabled:opacity-50"
                      title="Delete offering"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredOfferings.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No course offerings found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterBatch || filterSemester ? "Try adjusting your search terms." : "Get started by adding a new course offering."}
            </p>
            {!searchTerm && !filterBatch && !filterSemester && (
              <div className="mt-6">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Offering
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
