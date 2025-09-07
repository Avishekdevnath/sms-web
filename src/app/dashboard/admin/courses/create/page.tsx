"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

interface Semester {
  _id: string;
  number: number;
  title: string;
  batchId: {
    _id: string;
    code: string;
    title: string;
  };
}

interface CourseFormData {
  title: string;
  description: string;
  semesterId?: string; // Make semesterId optional
}

export default function CreateCoursePage() {
  const router = useRouter();
  const [formData, setFormData] = useState<CourseFormData>({
    title: "",
    description: "",
    semesterId: "", // Keep as empty string for optional selection
  });
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSemesters();
  }, []);

  const fetchSemesters = async () => {
    try {
      const response = await fetch('/api/semesters');
      if (response.ok) {
        const data = await response.json();
        setSemesters(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching semesters:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Course title is required";
    }

    // semesterId is now optional, so no validation needed

    if (formData.title.length > 200) {
      newErrors.title = "Title must be less than 200 characters";
    }

    if (formData.description.length > 1000) {
      newErrors.description = "Description must be less than 1000 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch("/api/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        router.push(`/dashboard/admin/courses/${result._id}`);
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Unknown error occurred';
        alert(`Error creating course: ${errorMessage}`);
      }
    } catch (error) {
      console.error("Error creating course:", error);
      alert("Failed to create course. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href="/dashboard/admin/courses"
          className="flex items-center text-gray-600 hover:text-black transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Courses
        </Link>
      </div>

      <div className="border rounded-lg p-6 bg-white">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-black">Create New Course</h1>
          <p className="mt-2 text-gray-600">
            Create a new academic course with detailed information
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Course Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Course Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Introduction to Programming, Data Structures and Algorithms"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 ${
                errors.title 
                  ? "border-red-500 focus:ring-red-500" 
                  : "border-gray-300 focus:ring-black"
              }`}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Maximum 200 characters
            </p>
          </div>

          {/* Course Semester */}
          <div>
            <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-2">
              Semester
            </label>
            <select
              id="semester"
              name="semesterId"
              value={formData.semesterId || ""} // Set value to empty string for optional selection
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 ${
                errors.semesterId 
                  ? "border-red-500 focus:ring-red-500" 
                  : "border-gray-300 focus:ring-black"
              }`}
            >
              <option value="">Select a semester (optional)</option>
              {semesters.map((semester) => (
                <option key={semester._id} value={semester._id}>
                  {semester.title}
                </option>
              ))}
            </select>
            {errors.semesterId && (
              <p className="mt-1 text-sm text-red-600">{errors.semesterId}</p>
            )}
          </div>

          {/* Course Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              placeholder="Provide a detailed description of the course, including learning objectives, topics covered, and prerequisites..."
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 ${
                errors.description 
                  ? "border-red-500 focus:ring-red-500" 
                  : "border-gray-300 focus:ring-black"
              }`}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Optional detailed description of the course (maximum 1000 characters)
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t">
            <Link
              href="/dashboard/admin/courses"
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:border-black transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Course
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Help Section */}
      <div className="border rounded-lg p-6 bg-gray-50">
        <h3 className="text-lg font-medium text-black mb-4">Course Creation Guidelines</h3>
        <div className="space-y-3 text-sm text-gray-600">
          <div>
            <strong>Title:</strong> Use clear, descriptive titles that students can easily understand. Include the main topic or subject area.
          </div>
          <div>
            <strong>Semester:</strong> Select the semester in which the course will be offered. If the course is not offered in a specific semester, you can leave this field empty.
          </div>
          <div>
            <strong>Description:</strong> Include key information such as:
            <ul className="mt-1 ml-4 list-disc">
              <li>Course objectives and learning outcomes</li>
              <li>Main topics and concepts covered</li>
              <li>Prerequisites or required background knowledge</li>
              <li>Expected difficulty level</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
