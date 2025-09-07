"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, BookOpen, Users, Calendar } from "lucide-react";

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

interface CourseOfferingFormData {
  courseId: string;
  batchId: string;
  semesterId: string;
}

export default function CreateCourseOfferingPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<CourseOfferingFormData>({
    courseId: "",
    batchId: "",
    semesterId: ""
  });

  // Check for pre-selected course from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const preSelectedCourseId = urlParams.get('courseId');
    if (preSelectedCourseId) {
      setFormData(prev => ({ ...prev, courseId: preSelectedCourseId }));
    }
  }, []);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [coursesRes, batchesRes, semestersRes] = await Promise.all([
        fetch("/api/courses?limit=100"),
        fetch("/api/batches?limit=100"),
        fetch("/api/semesters?limit=100")
      ]);

      const coursesData = await coursesRes.json();
      const batchesData = await batchesRes.json();
      const semestersData = await semestersRes.json();

      console.log("Fetched data:", {
        courses: coursesData,
        batches: batchesData,
        semesters: semestersData
      });

      setCourses(coursesData.courses || []);
      setBatches(batchesData.batches || []);
      setSemesters(semestersData.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
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
        router.push("/dashboard/admin/course-offerings");
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
    if (!semesters || !batchId) return [];
    return semesters.filter(semester => 
      semester && semester.batchId && semester.batchId._id === batchId
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href="/dashboard/admin/course-offerings"
          className="inline-flex items-center text-gray-600 hover:text-black transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Course Offerings
        </Link>
        <div className="h-6 w-px bg-gray-300"></div>
        <div>
          <h1 className="text-3xl font-bold text-black">Create Course Offering</h1>
          <p className="mt-2 text-gray-600">
            Assign a course to a specific batch and semester
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white border rounded-lg shadow-sm">
        <div className="p-6">
          {/* Warning if no data available */}
          {(!courses || courses.length === 0 || !batches || batches.length === 0) && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <h3 className="text-sm font-medium text-red-800 mb-2">
                Missing Required Data
              </h3>
              <p className="text-sm text-red-700 mb-3">
                To create course offerings, you need courses, batches, and semesters in your system.
              </p>
              <div className="flex flex-wrap gap-2">
                {(!courses || courses.length === 0) && (
                  <Link
                    href="/dashboard/admin/courses/create"
                    className="inline-flex items-center px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Create Course
                  </Link>
                )}
                {(!batches || batches.length === 0) && (
                  <Link
                    href="/dashboard/admin/batches/create"
                    className="inline-flex items-center px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Create Batch
                  </Link>
                )}
                <Link
                  href="/seed-demo-data"
                  className="inline-flex items-center px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Seed Demo Data
                </Link>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Course Selection */}
            <div>
              <label htmlFor="courseId" className="block text-sm font-medium text-gray-700 mb-2">
                Course *
              </label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  id="courseId"
                  name="courseId"
                  value={formData.courseId}
                  onChange={handleInputChange}
                  disabled={!!new URLSearchParams(window.location.search).get('courseId')}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors.courseId ? "border-red-500" : "border-gray-300"
                  } ${new URLSearchParams(window.location.search).get('courseId') ? "bg-gray-100 cursor-not-allowed" : ""}`}
                >
                  <option value="">Select a course</option>
                  {courses && courses.length > 0 ? (
                    courses.map((course) => (
                      <option key={course._id} value={course._id}>
                        {course.code} - {course.title}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No courses available</option>
                  )}
                </select>
              </div>
              {courses && courses.length === 0 && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800 mb-2">
                    No courses found. You need to create courses before you can create course offerings.
                  </p>
                  <Link
                    href="/dashboard/admin/courses/create"
                    className="inline-flex items-center px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 transition-colors"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Create Course
                  </Link>
                </div>
              )}
              {formErrors.courseId && (
                <p className="mt-2 text-sm text-red-600">{formErrors.courseId}</p>
              )}
              {formData.courseId && courses.find(c => c._id === formData.courseId)?.description && (
                <p className="mt-2 text-sm text-gray-500">
                  {courses.find(c => c._id === formData.courseId)?.description}
                </p>
              )}
            </div>

            {/* Batch Selection */}
            <div>
              <label htmlFor="batchId" className="block text-sm font-medium text-gray-700 mb-2">
                Batch *
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  id="batchId"
                  name="batchId"
                  value={formData.batchId}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors.batchId ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">Select a batch</option>
                  {batches && batches.map((batch) => (
                    <option key={batch._id} value={batch._id}>
                      {batch.code} - {batch.title}
                    </option>
                  ))}
                </select>
              </div>
              {batches && batches.length === 0 && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800 mb-2">
                    No batches found. You need to create batches before you can create course offerings.
                  </p>
                  <Link
                    href="/dashboard/admin/batches/create"
                    className="inline-flex items-center px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 transition-colors"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Create Batch
                  </Link>
                </div>
              )}
              {formErrors.batchId && (
                <p className="mt-2 text-sm text-red-600">{formErrors.batchId}</p>
              )}
            </div>

            {/* Semester Selection */}
            <div>
              <label htmlFor="semesterId" className="block text-sm font-medium text-gray-700 mb-2">
                Semester *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  id="semesterId"
                  name="semesterId"
                  value={formData.semesterId}
                  onChange={handleInputChange}
                  disabled={!formData.batchId}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors.semesterId ? "border-red-500" : "border-gray-300"
                  } ${!formData.batchId ? "bg-gray-100 cursor-not-allowed" : ""}`}
                >
                  <option value="">Select a semester</option>
                  {formData.batchId && getSemestersForBatch(formData.batchId).map((semester) => (
                    <option key={semester._id} value={semester._id}>
                      Semester {semester.number} - {semester.title || `Semester ${semester.number}`}
                    </option>
                  ))}
                </select>
              </div>
              {formErrors.semesterId && (
                <p className="mt-2 text-sm text-red-600">{formErrors.semesterId}</p>
              )}
              {!formData.batchId && (
                <p className="mt-2 text-sm text-gray-500">Please select a batch first to see available semesters</p>
              )}
              {formData.batchId && getSemestersForBatch(formData.batchId).length === 0 && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800 mb-2">
                    No semesters found for the selected batch. You need to create semesters for this batch.
                  </p>
                  <Link
                    href="/dashboard/admin/semesters/create"
                    className="inline-flex items-center px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 transition-colors"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Create Semester
                  </Link>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t">
              <Link
                href="/dashboard/admin/course-offerings"
                className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting || !courses || courses.length === 0 || !batches || batches.length === 0}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Offering
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Debug Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-800 mb-2">Debug Information</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <p>Courses loaded: {courses?.length || 0}</p>
          <p>Batches loaded: {batches?.length || 0}</p>
          <p>Semesters loaded: {semesters?.length || 0}</p>
          {courses && courses.length > 0 && (
            <div>
              <p className="font-medium">Available courses:</p>
              <ul className="ml-4 list-disc">
                {courses.map(course => (
                  <li key={course._id}>{course.code} - {course.title}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Debug Actions */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="font-medium text-gray-800 mb-2">Debug Actions:</h4>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/debug-courses');
                    const data = await response.json();
                    console.log('Debug courses response:', data);
                    alert(`Debug info logged to console. Total courses: ${data.debug?.totalCourses || 0}`);
                  } catch (error) {
                    console.error('Debug error:', error);
                    alert('Debug failed - check console');
                  }
                }}
                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
              >
                Debug Courses API
              </button>
              <button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/test-course-offerings');
                    const data = await response.json();
                    console.log('Test endpoint response:', data);
                    alert(`Test endpoint: ${data.data?.counts?.courses || 0} courses found`);
                  } catch (error) {
                    console.error('Test error:', error);
                    alert('Test failed - check console');
                  }
                }}
                className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
              >
                Test All Data
              </button>
              <button
                onClick={() => {
                  console.log('Current state:', {
                    courses,
                    batches,
                    semesters,
                    formData
                  });
                  alert('Current state logged to console');
                }}
                className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors"
              >
                Log Current State
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">How Course Offerings Work</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• One course can be offered to multiple batches and semesters</li>
          <li>• Each combination of course, batch, and semester creates a unique offering</li>
          <li>• Students will be able to enroll in these offerings</li>
          <li>• You can manage assignments and content for each offering separately</li>
        </ul>
      </div>

      {/* Quick Setup Option */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-green-800 mb-2">Quick Setup</h3>
        <p className="text-sm text-green-700 mb-3">
          Don't have courses, batches, or semesters yet? You can quickly populate your system with demo data.
        </p>
        <Link
          href="/seed-demo-data"
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Seed Demo Data
        </Link>
      </div>
    </div>
  );
}
