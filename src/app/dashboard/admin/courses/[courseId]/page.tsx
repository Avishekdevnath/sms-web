"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, Trash2, Save, X, Loader2 } from "lucide-react";

interface Course {
  _id: string;
  title: string;
  code: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export default function CourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [editForm, setEditForm] = useState({
    title: "",
    code: "",
    description: ""
  });

  useEffect(() => {
    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/courses/${courseId}`);
      
      if (response.ok) {
        const courseData = await response.json();
        setCourse(courseData);
        setEditForm({
          title: courseData.title,
          code: courseData.code,
          description: courseData.description || ""
        });
      } else {
        setError("Course not found");
      }
    } catch (error) {
      console.error("Error fetching course:", error);
      setError("Failed to fetch course");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    // Reset form to original values
    if (course) {
      setEditForm({
        title: course.title,
        code: course.code,
        description: course.description || ""
      });
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch(`/api/courses/${courseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        const updatedCourse = await response.json();
        setCourse(updatedCourse);
        setEditing(false);
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to update course");
      }
    } catch (error) {
      console.error("Error updating course:", error);
      setError("Failed to update course");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
      return;
    }

    try {
      setDeleting(true);
      const response = await fetch(`/api/courses/${courseId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/dashboard/admin/courses");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to delete course");
      }
    } catch (error) {
      console.error("Error deleting course:", error);
      setError("Failed to delete course");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading course...</span>
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Course Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/dashboard/admin/courses"
            className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  if (!course) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/admin/courses"
          className="flex items-center text-gray-600 hover:text-black transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Courses
        </Link>
        
        <div className="flex items-center space-x-3">
          {!editing && (
            <>
              <button
                onClick={handleEdit}
                className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Course Information */}
      <div className="border rounded-lg p-6 bg-white">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-black">Course Details</h1>
          <p className="mt-2 text-gray-600">
            View and manage course information
          </p>
        </div>

        {editing ? (
          /* Edit Form */
          <div className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Course Title *
              </label>
              <input
                type="text"
                id="title"
                value={editForm.title}
                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                Course Code *
              </label>
              <input
                type="text"
                id="code"
                value={editForm.code}
                onChange={(e) => setEditForm(prev => ({ ...prev, code: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-6 border-t">
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:border-black transition-colors"
              >
                <X className="h-4 w-4 mr-2 inline" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        ) : (
          /* Display Mode */
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Title
              </label>
              <p className="text-lg text-black">{course.title}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Code
              </label>
              <p className="text-lg font-mono text-black bg-gray-50 px-3 py-2 rounded-lg inline-block">
                {course.code}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <p className="text-gray-800 whitespace-pre-wrap">
                {course.description || "No description provided"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-6 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Created
                </label>
                <p className="text-gray-800">
                  {new Date(course.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Updated
                </label>
                <p className="text-gray-800">
                  {new Date(course.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
