"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

interface Batch {
  _id: string;
  title: string;
  code: string;
}

interface SemesterFormData {
  batchId: string;
  number: "1" | "2" | "3";
  title: string;
  startDate: string;
  endDate: string;
}

export default function CreateSemesterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<SemesterFormData>({
    batchId: "",
    number: "1",
    title: "",
    startDate: "",
    endDate: "",
  });
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const response = await fetch("/api/batches?limit=100");
      const data = await response.json();
      setBatches(data.data || []);
    } catch (error) {
      console.error("Error fetching batches:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

    if (!formData.batchId) {
      newErrors.batchId = "Batch is required";
    }

    if (!formData.number) {
      newErrors.number = "Semester number is required";
    }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch("/api/semesters", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        router.push(`/dashboard/admin/semesters/${result.data._id}`);
      } else {
        const error = await response.json();
        alert(`Error creating semester: ${error.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error creating semester:", error);
      alert("Failed to create semester. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href="/dashboard/admin/semesters"
          className="flex items-center text-gray-600 hover:text-black transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Semesters
        </Link>
      </div>

      <div className="border rounded-lg p-6 bg-white">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-black">Create New Semester</h1>
          <p className="mt-2 text-gray-600">
            Create a new academic semester with schedule and details
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Batch Selection */}
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
                errors.batchId 
                  ? "border-red-500 focus:ring-red-500" 
                  : "border-gray-300 focus:ring-black"
              }`}
            >
              <option value="">Select a batch</option>
              {batches.map((batch) => (
                <option key={batch._id} value={batch._id}>
                  {batch.title} ({batch.code})
                </option>
              ))}
            </select>
            {errors.batchId && (
              <p className="mt-1 text-sm text-red-600">{errors.batchId}</p>
            )}
          </div>

          {/* Semester Number */}
          <div>
            <label htmlFor="number" className="block text-sm font-medium text-gray-700 mb-2">
              Semester Number *
            </label>
            <select
              id="number"
              name="number"
              value={formData.number}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 ${
                errors.number 
                  ? "border-red-500 focus:ring-red-500" 
                  : "border-gray-300 focus:ring-black"
              }`}
            >
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
              <option value="3">Semester 3</option>
            </select>
            {errors.number && (
              <p className="mt-1 text-sm text-red-600">{errors.number}</p>
            )}
          </div>

          {/* Semester Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Semester Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Spring 2025, Advanced Programming"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
            />
            <p className="mt-1 text-xs text-gray-500">
              Optional custom title for the semester
            </p>
          </div>

          {/* Start Date */}
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="datetime-local"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
            />
            <p className="mt-1 text-xs text-gray-500">
              When the semester begins
            </p>
          </div>

          {/* End Date */}
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="datetime-local"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
            />
            {errors.endDate && (
              <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              When the semester ends
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t">
            <Link
              href="/dashboard/admin/semesters"
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
                  Create Semester
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Help Section */}
      <div className="border rounded-lg p-6 bg-gray-50">
        <h3 className="text-lg font-medium text-black mb-4">Semester Guidelines</h3>
        <div className="space-y-3 text-sm text-gray-600">
          <div>
            <strong>Semester Numbers:</strong>
            <ul className="mt-1 ml-4 list-disc">
              <li>Semester 1 - Usually the first semester of the academic year</li>
              <li>Semester 2 - Middle semester with intermediate courses</li>
              <li>Semester 3 - Final semester with advanced courses</li>
            </ul>
          </div>
          <div>
            <strong>Date Guidelines:</strong>
            <ul className="mt-1 ml-4 list-disc">
              <li>Start dates should be realistic and not in the past</li>
              <li>End dates must be after start dates</li>
              <li>Consider academic calendar when setting dates</li>
            </ul>
          </div>
          <div>
            <strong>Note:</strong> Each batch automatically gets 3 semesters created when the batch is created. You can create additional semesters or modify existing ones here.
          </div>
        </div>
      </div>
    </div>
  );
}
