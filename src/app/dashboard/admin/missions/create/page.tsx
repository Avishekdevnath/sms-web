"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Plus, X } from "lucide-react";
import Link from "next/link";

interface Batch {
  _id: string;
  code: string;
  title: string;
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
    code: string;
    title: string;
  };
  semesterId: {
    _id: string;
    name: string;
  };
}

interface MissionFormData {
  title: string;
  description: string;
  batchId: string;
  startDate: string;
  endDate: string;
  maxStudents: number;
  requirements: string[];
  rewards: string[];
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  courses: Array<{
    courseOfferingId: string;
    weight: number;
    requiredAssignments: string[];
    minProgress: number;
  }>;
}

export default function CreateMissionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courseOfferings, setCourseOfferings] = useState<CourseOffering[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  
  const [formData, setFormData] = useState<MissionFormData>({
    title: "",
    description: "",
    batchId: "",
    startDate: "",
    endDate: "",
    maxStudents: 50,
    requirements: [""],
    rewards: [""],
    status: "draft",
    courses: []
  });

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    if (selectedBatch) {
      fetchCourseOfferings(selectedBatch);
    } else {
      setCourseOfferings([]);
    }
  }, [selectedBatch]);

  const fetchBatches = async () => {
    try {
      const response = await fetch('/api/batches?limit=100');
      if (response.ok) {
        const data = await response.json();
        setBatches(data.batches || []);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  const fetchCourseOfferings = async (batchId: string) => {
    try {
      const response = await fetch(`/api/course-offerings?batchId=${batchId}&limit=100`);
      if (response.ok) {
        const data = await response.json();
        setCourseOfferings(data.courseOfferings || []);
      }
    } catch (error) {
      console.error('Error fetching course offerings:', error);
    }
  };

  const handleInputChange = (field: keyof MissionFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRequirementChange = (index: number, value: string) => {
    const newRequirements = [...formData.requirements];
    newRequirements[index] = value;
    setFormData(prev => ({
      ...prev,
      requirements: newRequirements
    }));
  };

  const addRequirement = () => {
    setFormData(prev => ({
      ...prev,
      requirements: [...prev.requirements, ""]
    }));
  };

  const removeRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };

  const handleRewardChange = (index: number, value: string) => {
    const newRewards = [...formData.rewards];
    newRewards[index] = value;
    setFormData(prev => ({
      ...prev,
      rewards: newRewards
    }));
  };

  const addReward = () => {
    setFormData(prev => ({
      ...prev,
      rewards: [...prev.rewards, ""]
    }));
  };

  const removeReward = (index: number) => {
    setFormData(prev => ({
      ...prev,
      rewards: prev.rewards.filter((_, i) => i !== index)
    }));
  };

  const addCourse = () => {
    setFormData(prev => ({
      ...prev,
      courses: [...prev.courses, {
        courseOfferingId: "",
        weight: 0,
        requiredAssignments: [],
        minProgress: 0
      }]
    }));
  };

  const removeCourse = (index: number) => {
    setFormData(prev => ({
      ...prev,
      courses: prev.courses.filter((_, i) => i !== index)
    }));
  };

  const handleCourseChange = (index: number, field: string, value: any) => {
    const newCourses = [...formData.courses];
    newCourses[index] = {
      ...newCourses[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      courses: newCourses
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert("Title is required");
      return;
    }

    if (!formData.batchId) {
      alert("Please select a batch");
      return;
    }

    if (formData.courses.length === 0) {
      alert("At least one course is required");
      return;
    }

    // Validate course weights sum to 100
    const totalWeight = formData.courses.reduce((sum, course) => sum + course.weight, 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      alert("Course weights must sum to 100%");
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('/api/missions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          startDate: formData.startDate.trim() || undefined,
          endDate: formData.endDate.trim() || undefined,
          requirements: formData.requirements.filter(r => r.trim() !== ""),
          rewards: formData.rewards.filter(r => r.trim() !== "")
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert("Mission created successfully!");
        router.push('/dashboard/admin/missions');
      } else {
        const error = await response.json();
        alert(`Error creating mission: ${error.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating mission:', error);
      alert("Failed to create mission");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/admin/missions"
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Missions
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create New Mission</h1>
            <p className="mt-2 text-gray-600">Set up a new learning mission for students</p>
          </div>
        </div>
      </div>

      {/* Mission Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mission Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter mission title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Batch *
              </label>
              <select
                value={formData.batchId}
                onChange={(e) => {
                  handleInputChange('batchId', e.target.value);
                  setSelectedBatch(e.target.value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a batch</option>
                {batches.map((batch) => (
                  <option key={batch._id} value={batch._id}>
                    {batch.code} - {batch.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Students
              </label>
              <input
                type="number"
                value={formData.maxStudents}
                onChange={(e) => handleInputChange('maxStudents', e.target.value ? parseInt(e.target.value) || 1 : 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter mission description"
            />
          </div>
        </div>

        {/* Requirements */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Requirements</h2>
          
          {formData.requirements.map((requirement, index) => (
            <div key={index} className="flex items-center space-x-2 mb-2">
              <input
                type="text"
                value={requirement}
                onChange={(e) => handleRequirementChange(index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter requirement"
              />
              <button
                type="button"
                onClick={() => removeRequirement(index)}
                className="p-2 text-red-600 hover:text-red-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          
          <button
            type="button"
            onClick={addRequirement}
            className="mt-2 inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Requirement
          </button>
        </div>

        {/* Rewards */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Rewards</h2>
          
          {formData.rewards.map((reward, index) => (
            <div key={index} className="flex items-center space-x-2 mb-2">
              <input
                type="text"
                value={reward}
                onChange={(e) => handleRewardChange(index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter reward"
              />
              <button
                type="button"
                onClick={() => removeReward(index)}
                className="p-2 text-red-600 hover:text-red-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          
          <button
            type="button"
            onClick={addReward}
            className="mt-2 inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Reward
          </button>
        </div>

        {/* Courses */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Courses</h2>
          
          {formData.courses.map((course, index) => (
            <div key={index} className="border rounded-lg p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course Offering *
                  </label>
                  <select
                    value={course.courseOfferingId}
                    onChange={(e) => handleCourseChange(index, 'courseOfferingId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select course offering</option>
                    {courseOfferings.map((offering) => (
                      <option key={offering._id} value={offering._id}>
                        {offering.courseId.code} - {offering.courseId.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weight (%) *
                  </label>
                  <input
                    type="number"
                    value={course.weight}
                    onChange={(e) => handleCourseChange(index, 'weight', e.target.value ? parseFloat(e.target.value) || 0 : 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    max="100"
                    step="0.1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Progress (%)
                  </label>
                  <input
                    type="number"
                    value={course.minProgress}
                    onChange={(e) => handleCourseChange(index, 'minProgress', e.target.value ? parseFloat(e.target.value) || 0 : 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => removeCourse(index)}
                className="mt-2 text-red-600 hover:text-red-800 text-sm"
              >
                Remove Course
              </button>
            </div>
          ))}
          
          <button
            type="button"
            onClick={addCourse}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Course
          </button>
          
          {formData.courses.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-800">
                Total Weight: {formData.courses.reduce((sum, course) => sum + course.weight, 0).toFixed(1)}%
                {Math.abs(formData.courses.reduce((sum, course) => sum + course.weight, 0) - 100) > 0.01 && (
                  <span className="text-red-600 ml-2">(Must equal 100%)</span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Link
            href="/dashboard/admin/missions"
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Create Mission
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
