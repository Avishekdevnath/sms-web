"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, BookOpen, Users, Calendar, Trash2, Edit, Eye } from "lucide-react";

interface Course {
  _id: string;
  title: string;
  code: string;
  description?: string;
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

export default function CourseOfferingsDetailPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [courseOfferings, setCourseOfferings] = useState<CourseOffering[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingOffering, setDeletingOffering] = useState<string | null>(null);

  useEffect(() => {
    if (courseId) {
      fetchData();
    }
  }, [courseId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [courseRes, offeringsRes] = await Promise.all([
        fetch(`/api/courses/${courseId}`),
        fetch(`/api/course-offerings?courseId=${courseId}`)
      ]);

      if (courseRes.ok) {
        const courseData = await courseRes.json();
        setCourse(courseData);
      }

      if (offeringsRes.ok) {
        const offeringsData = await offeringsRes.json();
        setCourseOfferings(offeringsData.data || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
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

  const refreshData = async () => {
    await fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course details...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Course not found</h3>
          <p className="mt-1 text-sm text-gray-500">The course you're looking for doesn't exist.</p>
          <div className="mt-6">
            <Link
              href="/dashboard/admin/course-offerings"
              className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Course Offerings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
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
          <h1 className="text-3xl font-bold text-black">{course.title}</h1>
          <p className="mt-2 text-gray-600">
            Course Code: {course.code} • {courseOfferings.length} offering{courseOfferings.length !== 1 ? 's' : ''}
          </p>
          {course.description && (
            <p className="mt-1 text-gray-500">{course.description}</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={refreshData}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm hover:border-black transition-colors"
          >
            <Eye className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
        <Link
          href={`/dashboard/admin/course-offerings/create?courseId=${course._id}`}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Offering
        </Link>
      </div>

      {/* Course Offerings */}
      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h2 className="text-lg font-medium text-gray-900">Course Offerings</h2>
          <p className="text-sm text-gray-500">
            This course is currently offered in the following batches and semesters
          </p>
        </div>

        {courseOfferings.length > 0 ? (
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
                {courseOfferings.map((offering) => (
                  <tr key={offering._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Users className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {offering.batchId?.code || 'Unknown Batch'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {offering.batchId?.title || 'Unknown Title'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Calendar className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            Semester {offering.semesterId?.number || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {offering.semesterId?.title || `Semester ${offering.semesterId?.number || 'Unknown'}`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {offering.createdAt ? new Date(offering.createdAt).toLocaleDateString() : 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={`/dashboard/admin/course-offerings/${offering._id}/edit`}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="Edit offering"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteOffering(offering._id)}
                          disabled={deletingOffering === offering._id}
                          className="text-red-600 hover:text-red-900 transition-colors disabled:opacity-50"
                          title="Delete offering"
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
        ) : (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No offerings yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              This course hasn't been offered to any batches yet.
            </p>
            <div className="mt-6">
              <Link
                href={`/dashboard/admin/course-offerings/create?courseId=${course._id}`}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Offering
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Course Information */}
      <div className="bg-white border rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Course Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Course Code</label>
            <p className="text-sm text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded border">
              {course.code}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Course Title</label>
            <p className="text-sm text-gray-900">{course.title}</p>
          </div>
          {course.description && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-500 mb-1">Description</label>
              <p className="text-sm text-gray-900">{course.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
