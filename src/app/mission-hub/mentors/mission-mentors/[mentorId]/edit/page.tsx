"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  BookOpen, 
  Save,
  X,
  Plus,
  AlertTriangle
} from 'lucide-react';

interface MissionMentor {
  _id: string;
  missionId: {
    _id: string;
    code: string;
    title: string;
  };
  mentorId: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  role: 'primary' | 'secondary' | 'moderator';
  maxStudents: number;
  currentWorkload: number;
  status: 'active' | 'inactive' | 'overloaded';
  specialization: string[];
  notes?: string;
}

interface FormData {
  role: 'mission-lead' | 'coordinator' | 'advisor' | 'supervisor';
  maxStudents: number;
  specialization: string[];
  responsibilities: string[];
  notes: string;
  status: 'active' | 'deactive' | 'irregular' | 'overloaded' | 'unavailable';
  availabilityRate: number;
  isRegular: boolean;
}

export default function MissionMentorEditPage() {
  const params = useParams();
  const router = useRouter();
  const mentorId = params.mentorId as string;
  
  const [mentor, setMentor] = useState<MissionMentor | null>(null);
  const [formData, setFormData] = useState<FormData>({
    role: 'advisor',
    maxStudents: 0, // Default to unlimited capacity
    specialization: [],
    responsibilities: [],
    notes: '',
    status: 'active',
    availabilityRate: 100,
    isRegular: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [newSpecialization, setNewSpecialization] = useState('');
  const [newResponsibility, setNewResponsibility] = useState('');

  useEffect(() => {
    if (mentorId) {
      fetchMentorData();
    }
  }, [mentorId]);

  const fetchMentorData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v2/mission-mentors/${mentorId}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          // Transform V2 data to match expected format
          const mentorData = data.data;
          const transformedMentor = {
            _id: mentorData._id,
            missionId: {
              _id: mentorData.missionId._id,
              code: mentorData.missionId.code,
              title: mentorData.missionId.title
            },
            mentorId: {
              _id: mentorData.mentorId._id,
              name: mentorData.mentorId.name,
              email: mentorData.mentorId.email,
              role: mentorData.mentorId.role
            },
            role: mentorData.role,
            maxStudents: mentorData.maxStudents || 0,
            currentWorkload: mentorData.currentStudents || 0,
            status: mentorData.status,
            specialization: mentorData.specialization || [],
            notes: mentorData.notes
          };
          setMentor(transformedMentor);
          setFormData({
            role: mentorData.role,
            maxStudents: mentorData.maxStudents || 0,
            specialization: mentorData.specialization || [],
            responsibilities: mentorData.responsibilities || [],
            notes: mentorData.notes || '',
            status: mentorData.status,
            availabilityRate: mentorData.availabilityRate || 100,
            isRegular: mentorData.isRegular || true
          });
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch mentor data');
      }
    } catch (error) {
      console.error('Error fetching mentor data:', error);
      setError('Failed to fetch mentor data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mentor) return;

    try {
      setSaving(true);
      setError('');

      const response = await fetch(`/api/v2/mission-mentors/${mentorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        router.push(`/mission-hub/mentors/mission-mentors/${mentorId}`);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update mentor');
      }
    } catch (error) {
      console.error('Error updating mentor:', error);
      setError('Failed to update mentor');
    } finally {
      setSaving(false);
    }
  };

  const addSpecialization = () => {
    if (newSpecialization.trim() && !formData.specialization.includes(newSpecialization.trim())) {
      setFormData(prev => ({
        ...prev,
        specialization: [...prev.specialization, newSpecialization.trim()]
      }));
      setNewSpecialization('');
    }
  };

  const removeSpecialization = (index: number) => {
    setFormData(prev => ({
      ...prev,
      specialization: prev.specialization.filter((_, i) => i !== index)
    }));
  };

  const addResponsibility = () => {
    if (newResponsibility.trim() && !formData.responsibilities.includes(newResponsibility.trim())) {
      setFormData(prev => ({
        ...prev,
        responsibilities: [...prev.responsibilities, newResponsibility.trim()]
      }));
      setNewResponsibility('');
    }
  };

  const removeResponsibility = (index: number) => {
    setFormData(prev => ({
      ...prev,
      responsibilities: prev.responsibilities.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading mentor details...</p>
        </div>
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className="text-center py-12">
        <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Mentor Not Found</h3>
        <p className="text-gray-600">The requested mentor could not be found.</p>
        <Link
          href="/mission-hub/mentors/mission-mentors"
          className="mt-4 inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Mission Mentors
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Link
                href={`/mission-hub/mentors/mission-mentors/${mentorId}`}
                className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft size={20} className="mr-2" />
                Back to Mentor Details
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit Mentor</h1>
                <p className="text-gray-600 mt-1">
                  {mentor.mentorId.name} - {mentor.missionId.code}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Role & Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="mission-lead">Mission Lead</option>
                  <option value="coordinator">Coordinator</option>
                  <option value="advisor">Advisor</option>
                  <option value="supervisor">Supervisor</option>
                </select>
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="active">Active</option>
                  <option value="deactive">Deactive</option>
                  <option value="irregular">Irregular</option>
                  <option value="overloaded">Overloaded</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Capacity & Availability Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="maxStudents" className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Students
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    id="maxStudents"
                    min="0"
                    max="100"
                    value={formData.maxStudents}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxStudents: parseInt(e.target.value) || 0 }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  />
                  <span className="text-sm text-gray-500">students</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Set to 0 for unlimited capacity. Current workload: {mentor.currentWorkload} students
                </p>
              </div>

              <div>
                <label htmlFor="availabilityRate" className="block text-sm font-medium text-gray-700 mb-2">
                  Availability Rate
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    id="availabilityRate"
                    min="0"
                    max="100"
                    value={formData.availabilityRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, availabilityRate: parseInt(e.target.value) || 0 }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isRegular}
                  onChange={(e) => setFormData(prev => ({ ...prev, isRegular: e.target.checked }))}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Regular mentor (consistently available)</span>
              </label>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Specializations & Responsibilities</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Specializations */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Specializations</h3>
                <div className="space-y-4">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newSpecialization}
                      onChange={(e) => setNewSpecialization(e.target.value)}
                      placeholder="Add specialization..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    />
                    <button
                      type="button"
                      onClick={addSpecialization}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  {formData.specialization.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.specialization.map((spec, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800"
                        >
                          {spec}
                          <button
                            type="button"
                            onClick={() => removeSpecialization(index)}
                            className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full text-purple-600 hover:bg-purple-200 focus:outline-none"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Responsibilities */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Responsibilities</h3>
                <div className="space-y-4">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newResponsibility}
                      onChange={(e) => setNewResponsibility(e.target.value)}
                      placeholder="Add responsibility..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    />
                    <button
                      type="button"
                      onClick={addResponsibility}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  {formData.responsibilities.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.responsibilities.map((resp, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                        >
                          {resp}
                          <button
                            type="button"
                            onClick={() => removeResponsibility(index)}
                            className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-600 hover:bg-blue-200 focus:outline-none"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                id="notes"
                rows={4}
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add any additional notes about this mentor..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <Link
              href={`/mission-hub/mentors/mission-mentors/${mentorId}`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
