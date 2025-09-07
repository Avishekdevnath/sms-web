"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Plus, X } from "lucide-react";
import EnhancedCourseOfferingSelector from "@/components/assignments/EnhancedCourseOfferingSelector";

interface CourseOffering {
  _id: string;
  title: string;
  code: string;
  courseId: {
    _id: string;
    title: string;
    code: string;
  };
}

interface AssignmentFormData {
  courseOfferingId: string;
  title: string;
  description: string;
  dueAt: string;
  maxPoints: number;
  attachments: Array<{
    name: string;
    url: string;
  }>;
  published: boolean;
}

export default function CreateAssignmentPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<AssignmentFormData>({
    courseOfferingId: "",
    title: "",
    description: "",
    dueAt: "",
    maxPoints: 100,
    attachments: [],
    published: false,
  });
  const [courseOfferings, setCourseOfferings] = useState<CourseOffering[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newAttachment, setNewAttachment] = useState({ name: "", url: "" });

  useEffect(() => {
    fetchCourseOfferings();
  }, []);

  const fetchCourseOfferings = async () => {
    try {
      const response = await fetch("/api/course-offerings?limit=100");
      const data = await response.json();
      setCourseOfferings(data.data || []);
    } catch (error) {
      console.error("Error fetching course offerings:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleAddAttachment = () => {
    if (!newAttachment.name || !newAttachment.url) {
      alert("Please fill in both name and URL for the attachment");
      return;
    }

    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, { ...newAttachment }]
    }));
    setNewAttachment({ name: "", url: "" });
  };

  const handleRemoveAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.courseOfferingId) {
      newErrors.courseOfferingId = "Course offering is required";
    }

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (formData.title.length > 200) {
      newErrors.title = "Title must be less than 200 characters";
    }

    if (formData.maxPoints < 0 || formData.maxPoints > 1000) {
      newErrors.maxPoints = "Max points must be between 0 and 1000";
    }

    if (formData.dueAt) {
      const dueDate = new Date(formData.dueAt);
      const now = new Date();
      if (dueDate <= now) {
        newErrors.dueAt = "Due date must be in the future";
      }
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
      
      // Prepare data for submission
      const submissionData = {
        ...formData,
        // Convert datetime-local to ISO string if dueAt is provided
        dueAt: formData.dueAt ? new Date(formData.dueAt).toISOString() : undefined,
        // Remove empty strings and convert to proper types
        description: formData.description || undefined,
        maxPoints: formData.maxPoints || undefined,
        attachments: formData.attachments.length > 0 ? formData.attachments : undefined,
      };
      
      const response = await fetch("/api/assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });

      if (response.ok) {
        const result = await response.json();
        router.push(`/dashboard/admin/assignments/${result.data._id}`);
      } else {
        const error = await response.json();
        alert(`Error creating assignment: ${error.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error creating assignment:", error);
      alert("Failed to create assignment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href="/dashboard/admin/assignments"
          className="flex items-center text-gray-600 hover:text-black transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Assignments
        </Link>
      </div>

      <div className="border rounded-lg p-6 bg-white">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-black">Create New Assignment</h1>
          <p className="mt-2 text-gray-600">
            Create a new assignment for students with detailed instructions and requirements
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Course Selection */}
          <div>
            <label htmlFor="courseOfferingId" className="block text-sm font-medium text-gray-700 mb-2">
              Course Offering *
            </label>
            <EnhancedCourseOfferingSelector
              value={formData.courseOfferingId}
              onChange={(value) => {
                setFormData(prev => ({ ...prev, courseOfferingId: value }));
                if (errors.courseOfferingId) {
                  setErrors(prev => ({ ...prev, courseOfferingId: "" }));
                }
              }}
              error={errors.courseOfferingId}
              placeholder="Select a course offering"
              showSearch={true}
              showFilters={true}
              groupBy="batch"
              limit={200}
            />
          </div>

          {/* Assignment Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Assignment Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Final Project, Midterm Exam, Lab Report"
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

          {/* Assignment Description */}
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
              placeholder="Provide detailed instructions, requirements, and guidelines for the assignment..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
            />
            <p className="mt-1 text-xs text-gray-500">
              Optional detailed description of the assignment
            </p>
          </div>

          {/* Due Date */}
          <div>
            <label htmlFor="dueAt" className="block text-sm font-medium text-gray-700 mb-2">
              Due Date
            </label>
            <input
              type="datetime-local"
              id="dueAt"
              name="dueAt"
              value={formData.dueAt}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 ${
                errors.dueAt 
                  ? "border-red-500 focus:ring-red-500" 
                  : "border-gray-300 focus:ring-black"
              }`}
            />
            {errors.dueAt && (
              <p className="mt-1 text-sm text-red-600">{errors.dueAt}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              When the assignment is due (optional)
            </p>
          </div>

          {/* Max Points */}
          <div>
            <label htmlFor="maxPoints" className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Points
            </label>
            <input
              type="number"
              id="maxPoints"
              name="maxPoints"
              value={formData.maxPoints}
              onChange={handleInputChange}
              min="0"
              max="1000"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 ${
                errors.maxPoints 
                  ? "border-red-500 focus:ring-red-500" 
                  : "border-gray-300 focus:ring-black"
              }`}
            />
            {errors.maxPoints && (
              <p className="mt-1 text-sm text-red-600">{errors.maxPoints}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Maximum points for this assignment (0-1000)
            </p>
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attachments
            </label>
            <div className="space-y-4">
              {/* Add new attachment */}
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Attachment name"
                  value={newAttachment.name}
                  onChange={(e) => setNewAttachment(prev => ({ ...prev, name: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                />
                <input
                  type="url"
                  placeholder="URL"
                  value={newAttachment.url}
                  onChange={(e) => setNewAttachment(prev => ({ ...prev, url: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                />
                <button
                  type="button"
                  onClick={handleAddAttachment}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Existing attachments */}
              {formData.attachments.length > 0 && (
                <div className="space-y-2">
                  {formData.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{attachment.name}</p>
                        <p className="text-xs text-gray-500">{attachment.url}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(index)}
                        className="ml-2 p-1 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Add files, documents, or resources related to this assignment
            </p>
          </div>

          {/* Published Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="published"
              name="published"
              checked={formData.published}
              onChange={handleInputChange}
              className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
            />
            <label htmlFor="published" className="ml-2 block text-sm text-gray-900">
              Publish immediately
            </label>
          </div>
          <p className="text-xs text-gray-500">
            If checked, the assignment will be published and visible to students immediately. Otherwise, it will be saved as a draft.
          </p>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t">
            <Link
              href="/dashboard/admin/assignments"
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
                  Create Assignment
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Help Section */}
      <div className="border rounded-lg p-6 bg-gray-50">
        <h3 className="text-lg font-medium text-black mb-4">Assignment Guidelines</h3>
        <div className="space-y-3 text-sm text-gray-600">
          <div>
            <strong>Title:</strong> Keep it clear and descriptive. Students should understand what the assignment is about from the title.
          </div>
          <div>
            <strong>Description:</strong> Provide detailed instructions, requirements, submission guidelines, and any specific criteria for evaluation.
          </div>
          <div>
            <strong>Due Date:</strong> Set realistic deadlines that give students enough time to complete the work while maintaining academic rigor.
          </div>
          <div>
            <strong>Points:</strong> Assign appropriate point values based on the complexity and scope of the assignment.
          </div>
          <div>
            <strong>Attachments:</strong> Include relevant files, templates, rubrics, or reference materials that will help students complete the assignment.
          </div>
          <div>
            <strong>Publishing:</strong> Draft assignments are only visible to instructors. Published assignments become visible to enrolled students.
          </div>
        </div>
      </div>
    </div>
  );
}
