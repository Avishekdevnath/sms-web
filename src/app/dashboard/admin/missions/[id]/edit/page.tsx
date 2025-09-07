"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Plus, X, Loader2 } from "lucide-react";
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

export default function EditMissionPage() {
  const router = useRouter();
  const params = useParams();
  const missionId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
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

  // Safe setter function that prevents NaN values
  const setFormDataSafely = (updater: MissionFormData | ((prev: MissionFormData) => MissionFormData)) => {
    if (typeof updater === 'function') {
      setFormData(prev => {
        const newData = updater(prev);
        // Ensure no NaN values
        return {
          ...newData,
          maxStudents: isNaN(newData.maxStudents) ? 50 : newData.maxStudents,
          courses: newData.courses.map(course => ({
            ...course,
            weight: isNaN(course.weight) ? 0 : course.weight,
            minProgress: isNaN(course.minProgress) ? 0 : course.minProgress
          }))
        };
      });
    } else {
      // Direct value update
      const newData = updater;
      setFormData({
        ...newData,
        maxStudents: isNaN(newData.maxStudents) ? 50 : newData.maxStudents,
        courses: newData.courses.map(course => ({
          ...course,
          weight: isNaN(course.weight) ? 0 : course.weight,
          minProgress: isNaN(course.minProgress) ? 0 : course.minProgress
        }))
      });
    }
  };

  // Function to get safe form values for rendering
  const getSafeFormValue = (value: any, defaultValue: any = '') => {
    if (typeof value === 'number' && isNaN(value)) {
      return defaultValue;
    }
    return value;
  };

  useEffect(() => {
    if (missionId) {
      console.log('Fetching mission with ID:', missionId);
      fetchMission();
    }
  }, [missionId]);

  // Debug form data changes
  useEffect(() => {
    console.log('Form data updated:', formData);
    
    // Validate form data to prevent NaN values
    const hasNaNValues = 
      isNaN(formData.maxStudents) ||
      formData.courses.some(course => isNaN(course.weight) || isNaN(course.minProgress));
    
    if (hasNaNValues) {
      console.warn('NaN values detected in form data, cleaning up...');
      setFormData(prev => ({
        ...prev,
        maxStudents: isNaN(prev.maxStudents) ? 50 : prev.maxStudents,
        courses: prev.courses.map(course => ({
          ...course,
          weight: isNaN(course.weight) ? 0 : course.weight,
          minProgress: isNaN(course.minProgress) ? 0 : course.minProgress
        }))
      }));
    }
  }, [formData]);

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

  const fetchMission = async () => {
    try {
      setFetching(true);
      const response = await fetch(`/api/admin/missions/${missionId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Mission data received:', data);
        console.log('Raw mission object:', data.data);
        
        // Log specific numeric fields to debug NaN issues
        if (data.data) {
          console.log('maxStudents:', data.data.maxStudents, 'type:', typeof data.data.maxStudents);
          if (data.data.courses) {
            data.data.courses.forEach((course: any, index: number) => {
              console.log(`Course ${index} - weight:`, course.weight, 'type:', typeof course.weight);
              console.log(`Course ${index} - minProgress:`, course.minProgress, 'type:', typeof course.minProgress);
            });
          }
        }
        
        // The API wraps data in a response object
        const mission = data.data;
        
        if (!mission) {
          console.error('No mission data found in response');
          router.push('/dashboard/admin/missions');
          return;
        }
        
        // Convert dates to string format for form inputs
        const startDate = mission.startDate ? new Date(mission.startDate).toISOString().split('T')[0] : '';
        const endDate = mission.endDate ? new Date(mission.endDate).toISOString().split('T')[0] : '';
        
        // Ensure numeric fields are valid numbers (handle MongoDB null values)
        const safeMaxStudents = mission.maxStudents !== null && mission.maxStudents !== undefined && !isNaN(mission.maxStudents) ? mission.maxStudents : 50;
        
        const formDataToSet = {
          title: mission.title || "",
          description: mission.description || "",
          batchId: mission.batchId?._id || mission.batchId || "",
          startDate,
          endDate,
          maxStudents: safeMaxStudents,
          requirements: mission.requirements?.length > 0 ? mission.requirements : [""],
          rewards: mission.rewards?.length > 0 ? mission.rewards : [""],
          status: mission.status || "draft",
          courses: mission.courses?.length > 0 ? mission.courses.map((course: any) => ({
            courseOfferingId: course.courseOfferingId?._id || course.courseOfferingId || "",
            weight: course.weight !== null && course.weight !== undefined && !isNaN(course.weight) ? course.weight : 0,
            requiredAssignments: course.requiredAssignments || [],
            minProgress: course.minProgress !== null && course.minProgress !== undefined && !isNaN(course.minProgress) ? course.minProgress : 0
          })) : []
        };
        
        console.log('Form data to set:', formDataToSet);
        
        // Additional validation to catch any NaN values before setting state
        const validatedFormData = {
          ...formDataToSet,
          maxStudents: typeof formDataToSet.maxStudents === 'number' && !isNaN(formDataToSet.maxStudents) ? formDataToSet.maxStudents : 50,
          courses: formDataToSet.courses.map(course => ({
            ...course,
            weight: typeof course.weight === 'number' && !isNaN(course.weight) ? course.weight : 0,
            minProgress: typeof course.minProgress === 'number' && !isNaN(course.minProgress) ? course.minProgress : 0
          }))
        };
        
        console.log('Validated form data:', validatedFormData);
        setFormDataSafely(validatedFormData);
        
        const batchId = mission.batchId?._id || mission.batchId || "";
        setSelectedBatch(batchId);
        
        // If we have a batch, fetch course offerings
        if (batchId) {
          fetchCourseOfferings(batchId);
        }
      } else {
        console.error('Failed to fetch mission:', response.status, response.statusText);
        router.push('/dashboard/admin/missions');
      }
    } catch (error) {
      console.error('Error fetching mission:', error);
      router.push('/dashboard/admin/missions');
    } finally {
      setFetching(false);
    }
  };

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
        setCourseOfferings(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching course offerings:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Use the validated form data to ensure no NaN values
      const cleanFormData = validatedFormData;

      console.log('Submitting clean form data:', cleanFormData);

      const response = await fetch(`/api/admin/missions/${missionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanFormData),
      });

      if (response.ok) {
        router.push('/dashboard/admin/missions');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to update mission');
      }
    } catch (error) {
      console.error('Error updating mission:', error);
      alert('Failed to update mission');
    } finally {
      setLoading(false);
    }
  };

  const addRequirement = () => {
    setFormDataSafely(prev => ({
      ...prev,
      requirements: [...prev.requirements, ""]
    }));
  };

  const removeRequirement = (index: number) => {
    setFormDataSafely(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };

  const updateRequirement = (index: number, value: string) => {
    setFormDataSafely(prev => ({
      ...prev,
      requirements: prev.requirements.map((req, i) => i === index ? value : req)
    }));
  };

  const addReward = () => {
    setFormDataSafely(prev => ({
      ...prev,
      rewards: [...prev.rewards, ""]
    }));
  };

  const removeReward = (index: number) => {
    setFormDataSafely(prev => ({
      ...prev,
      rewards: prev.rewards.filter((_, i) => i !== index)
    }));
  };

  const updateReward = (index: number, value: string) => {
    setFormDataSafely(prev => ({
      ...prev,
      rewards: prev.rewards.map((reward, i) => i === index ? value : reward)
    }));
  };

  const addCourse = () => {
    setFormDataSafely(prev => ({
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
    setFormDataSafely(prev => ({
      ...prev,
      courses: prev.courses.filter((_, i) => i !== index)
    }));
  };

  const updateCourse = (index: number, field: string, value: any) => {
    // Ensure numeric fields don't get NaN values
    if ((field === 'weight' || field === 'minProgress') && typeof value === 'number' && isNaN(value)) {
      return; // Don't update if the value is NaN
    }
    
    setFormDataSafely(prev => ({
      ...prev,
      courses: prev.courses.map((course, i) => 
        i === index ? { ...course, [field]: value } : course
      )
    }));
  };

  // Final validation to ensure no NaN values before rendering
  const validatedFormData = {
    ...formData,
    maxStudents: getSafeFormValue(formData.maxStudents, 50),
    courses: formData.courses.map(course => ({
      ...course,
      weight: getSafeFormValue(course.weight, 0),
      minProgress: getSafeFormValue(course.minProgress, 0)
    }))
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="animate-spin h-6 w-6 text-blue-600" />
          <span>Loading mission...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard/admin/missions"
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                title="Back to Missions"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Edit Mission</h1>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mission Title *
              </label>
              <input
                type="text"
                required
                value={validatedFormData.title}
                onChange={(e) => setFormDataSafely(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter mission title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Batch *
              </label>
              <select
                required
                value={validatedFormData.batchId}
                onChange={(e) => {
                  setFormDataSafely(prev => ({ ...prev, batchId: e.target.value }));
                  setSelectedBatch(e.target.value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a batch</option>
                {batches.map((batch) => (
                  <option key={batch._id} value={batch._id}>
                    {batch.code} - {batch.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={validatedFormData.description}
              onChange={(e) => setFormDataSafely(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter mission description"
            />
          </div>

          {/* Dates and Limits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={validatedFormData.startDate}
                onChange={(e) => setFormDataSafely(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={validatedFormData.endDate}
                onChange={(e) => setFormDataSafely(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Students
              </label>
              <input
                type="number"
                min="1"
                value={getSafeFormValue(validatedFormData.maxStudents, '')}
                onChange={(e) => {
                  const value = e.target.value === '' ? 50 : parseInt(e.target.value);
                  if (!isNaN(value)) {
                    setFormDataSafely(prev => ({ ...prev, maxStudents: value }));
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={validatedFormData.status}
              onChange={(e) => setFormDataSafely(prev => ({ ...prev, status: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Requirements */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Requirements
              </label>
              <button
                type="button"
                onClick={addRequirement}
                className="flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Requirement
              </button>
            </div>
            {validatedFormData.requirements.map((requirement, index) => (
              <div key={index} className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  value={requirement}
                  onChange={(e) => updateRequirement(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter requirement"
                />
                {validatedFormData.requirements.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRequirement(index)}
                    className="p-2 text-red-600 hover:text-red-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Rewards */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Rewards
              </label>
              <button
                type="button"
                onClick={addReward}
                className="flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Reward
              </button>
            </div>
            {validatedFormData.rewards.map((reward, index) => (
              <div key={index} className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  value={reward}
                  onChange={(e) => updateReward(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter reward"
                />
                {validatedFormData.rewards.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeReward(index)}
                    className="p-2 text-red-600 hover:text-red-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Courses */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Courses
              </label>
              <button
                type="button"
                onClick={addCourse}
                className="flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Course
              </button>
            </div>
            
            {validatedFormData.courses.map((course, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Course Offering
                    </label>
                    <select
                      required
                      value={course.courseOfferingId}
                      onChange={(e) => updateCourse(index, 'courseOfferingId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      Weight (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={getSafeFormValue(course.weight, '')}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                        if (!isNaN(value)) {
                          updateCourse(index, 'weight', value);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min Progress (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={getSafeFormValue(course.minProgress, '')}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                        if (!isNaN(value)) {
                          updateCourse(index, 'minProgress', value);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    onClick={() => removeCourse(index)}
                    className="p-2 text-red-600 hover:text-red-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Link
              href="/dashboard/admin/missions"
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Mission
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
