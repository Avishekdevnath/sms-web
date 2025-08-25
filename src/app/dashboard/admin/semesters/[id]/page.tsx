"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, Save, X, Calendar, BookOpen, Users } from "lucide-react";

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

export default function SemesterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [semester, setSemester] = useState<Semester | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    startDate: "",
    endDate: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSemesterData();
  }, [id]);

  const fetchSemesterData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/semesters?id=${id}`);
      
      if (response.ok) {
        const result = await response.json();
        const semesterData = result.data;
        setSemester(semesterData);
        setFormData({
          title: semesterData.title || "",
          startDate: semesterData.startDate ? new Date(semesterData.startDate).toISOString().slice(0, 16) : "",
          endDate: semesterData.endDate ? new Date(semesterData.endDate).toISOString().slice(0, 16) : "",
        });
      }
    } catch (error) {
      console.error("Error fetching semester data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      if (endDate <= startDate) {
        newErrors.endDate = "End date must be after start date";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/semesters?id=${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        setSemester(result.data);
        setEditing(false);
      } else {
        const error = await response.json();
        alert(`Error updating semester: ${error.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error updating semester:", error);
      alert("Failed to update semester. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this semester? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/semesters?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/dashboard/admin/semesters");
      } else {
        const error = await response.json();
        alert(`Error deleting semester: ${error.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error deleting semester:", error);
      alert("Failed to delete semester. Please try again.");
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading semester details...</p>
        </div>
      </div>
    );
  }

  if (!semester) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Semester not found</h3>
        <p className="mt-1 text-sm text-gray-500">The semester you're looking for doesn't exist.</p>
        <Link
          href="/dashboard/admin/semesters"
          className="mt-4 inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Semesters
        </Link>
      </div>
    );
  }

  const status = getSemesterStatus(semester);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/admin/semesters"
            className="flex items-center text-gray-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Semesters
          </Link>
        </div>
        <div className="flex items-center space-x-2">
          {editing ? (
            <>
              <button
                onClick={() => setEditing(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:border-black transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm hover:border-black transition-colors"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:border-red-500 hover:text-red-700 transition-colors"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Semester Info */}
      <div className="border rounded-lg p-6 bg-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-black">
              {semester.title || `Semester ${semester.number}`}
            </h1>
            <p className="mt-2 text-gray-600">
              {semester.batchId.title} ({semester.batchId.code})
            </p>
          </div>
          <div className="text-right">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
              {status.status}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Semester Number</p>
              <p className="text-xl font-bold text-black">{semester.number}</p>
            </div>
          </div>

          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Calendar className="h-6 w-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Created</p>
              <p className="text-sm text-black">{formatDate(semester.createdAt)}</p>
            </div>
          </div>

          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Users className="h-6 w-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Last Updated</p>
              <p className="text-sm text-black">{formatDate(semester.updatedAt)}</p>
            </div>
          </div>
        </div>

        {/* Semester Details */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Semester Title
            </label>
            {editing ? (
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Spring 2025, Advanced Programming"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
              />
            ) : (
              <p className="text-gray-900">{semester.title || "No title set"}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            {editing ? (
              <input
                type="datetime-local"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
              />
            ) : (
              <p className="text-gray-900">{formatDate(semester.startDate)}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            {editing ? (
              <div>
                <input
                  type="datetime-local"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                />
                {errors.endDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
                )}
              </div>
            ) : (
              <p className="text-gray-900">{formatDate(semester.endDate)}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Batch Information
            </label>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-900">
                <strong>Batch:</strong> {semester.batchId.title}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Code:</strong> {semester.batchId.code}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="border rounded-lg p-6 bg-gray-50">
        <h3 className="text-lg font-medium text-black mb-4">Semester Information</h3>
        <div className="space-y-3 text-sm text-gray-600">
          <div>
            <strong>Semester Number:</strong> {semester.number}
            <ul className="mt-1 ml-4 list-disc">
              <li>Semester 1 - Usually the first semester of the academic year</li>
              <li>Semester 2 - Middle semester with intermediate courses</li>
              <li>Semester 3 - Final semester with advanced courses</li>
            </ul>
          </div>
          <div>
            <strong>Status:</strong> {status.status}
            <ul className="mt-1 ml-4 list-disc">
              <li>Not Scheduled - No dates have been set</li>
              <li>Upcoming - Semester hasn't started yet</li>
              <li>Active - Semester is currently running</li>
              <li>Completed - Semester has ended</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
