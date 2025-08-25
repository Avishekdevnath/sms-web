"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, X, Users, Calendar, BookOpen } from "lucide-react";
import BatchForm from "@/components/batches/BatchForm";

interface Batch {
  _id: string;
  title: string;
  code: string;
  createdAt: string;
  updatedAt: string;
  studentCount?: number;
}

interface Student {
  _id: string;
  name: string;
  email: string;
  userId: string;
  role: string;
  createdAt: string;
}

export default function BatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'students'>('details');


  useEffect(() => {
    fetchBatchData();
  }, [id]);

  const fetchBatchData = async () => {
    try {
      // Validate batch ID
      if (!id || typeof id !== 'string') {
        console.error('Invalid batch ID provided to fetchBatchData:', id);
        return;
      }
      
      setLoading(true);
      const [batchRes, studentsRes] = await Promise.all([
        fetch(`/api/batches/${id}`),
        fetch(`/api/batches/${id}/students`)
      ]);

      if (batchRes.ok) {
        const batchData = await batchRes.json();
        setBatch(batchData);
      } else {
        console.error('Failed to fetch batch:', batchRes.status, batchRes.statusText);
      }

      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        setStudents(studentsData.students || []);
      } else {
        console.error('Failed to fetch students:', studentsRes.status, studentsRes.statusText);
      }
    } catch (error) {
      console.error("Error fetching batch data:", error);
    } finally {
      setLoading(false);
    }
  };



  const handleSave = async (formData: { title: string; code: string }) => {
    try {
      // Validate form data
      if (!formData || !formData.title || !formData.code) {
        throw new Error('Invalid form data provided');
      }
      
      if (!id || typeof id !== 'string') {
        throw new Error('Invalid batch ID');
      }
      
      setSaving(true);
      const response = await fetch(`/api/batches/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedBatch = await response.json();
        setBatch(updatedBatch);
        setEditing(false);
      } else {
        const error = await response.json();
        if (error.error === "Batch code already exists") {
          throw new Error("This batch code already exists");
        } else {
          throw new Error(`Error updating batch: ${error.error}`);
        }
      }
    } catch (error) {
      console.error("Error updating batch:", error);
      alert(error instanceof Error ? error.message : "Failed to update batch. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this batch? This action cannot be undone.")) {
      return;
    }

    try {
      // Validate batch ID
      if (!id || typeof id !== 'string') {
        throw new Error('Invalid batch ID');
      }
      
      const response = await fetch(`/api/batches/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/dashboard/admin/batches");
      } else {
        const error = await response.json();
        alert(`Error deleting batch: ${error.error}`);
      }
    } catch (error) {
      console.error("Error deleting batch:", error);
      alert("Failed to delete batch. Please try again.");
    }
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString || typeof dateString !== 'string') {
        console.warn('Invalid date string provided to formatDate:', dateString);
        return 'Invalid Date';
      }
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return 'Invalid Date';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading batch details...</p>
        </div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Batch not found</h3>
        <p className="mt-1 text-sm text-gray-500">The batch you're looking for doesn't exist.</p>
        <Link
          href="/dashboard/admin/batches"
          className="mt-4 inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Batches
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/admin/batches"
            className="flex items-center text-gray-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Batches
          </Link>
        </div>
        <div className="flex items-center space-x-2">
          {editing ? (
            <>
              <button
                                 onClick={() => {
                   try {
                     setEditing(false);
                   } catch (error) {
                     console.error('Error canceling edit mode:', error);
                   }
                 }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:border-black transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <button
                                 onClick={() => {
                   try {
                     setEditing(true);
                   } catch (error) {
                     console.error('Error entering edit mode:', error);
                   }
                 }}
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

      {/* Batch Info */}
      <div className="border rounded-lg p-6 bg-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-black">{batch.title}</h1>
            <p className="mt-2 text-gray-600">Batch Code: {batch.code}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-black">{students.length}</div>
            <div className="text-sm text-gray-500">Enrolled Students</div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Users className="h-6 w-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Students</p>
              <p className="text-xl font-bold text-black">{students.length}</p>
            </div>
          </div>

          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Calendar className="h-6 w-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Created</p>
              <p className="text-sm text-black">{formatDate(batch.createdAt)}</p>
            </div>
          </div>

          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Last Updated</p>
              <p className="text-sm text-black">{formatDate(batch.updatedAt)}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
                             onClick={() => {
                 try {
                   setActiveTab('details');
                 } catch (error) {
                   console.error('Error switching to details tab:', error);
                 }
               }}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'details'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Batch Details
            </button>
            <button
                             onClick={() => {
                 try {
                   setActiveTab('students');
                 } catch (error) {
                   console.error('Error switching to students tab:', error);
                 }
               }}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'students'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Enrolled Students ({students.length})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'details' ? (
            <div className="space-y-6">
              {editing ? (
                <BatchForm
                  initialData={{ title: batch.title, code: batch.code }}
                  onSubmit={handleSave}
                  onCancel={() => setEditing(false)}
                  submitLabel="Save Changes"
                  loading={saving}
                />
              ) : (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Batch Title
                    </label>
                    <p className="text-gray-900">{batch.title}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Batch Code
                    </label>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                      {batch.code}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              {students.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No students enrolled</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    This batch doesn't have any enrolled students yet.
                  </p>
                  <Link
                    href="/dashboard/admin/students/enroll"
                    className="mt-4 inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Enroll Students
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Enrolled
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                                             {students.map((student) => {
                         try {
                           if (!student || !student._id) {
                             console.warn('Invalid student data in batch table:', student);
                             return null;
                           }
                           return (
                             <tr key={student._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {student.userId}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {student.name || 'No Name'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{student.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(student.createdAt)}
                                                       </td>
                           </tr>
                           );
                         } catch (error) {
                           console.error('Error rendering student row:', error, student);
                           return (
                             <tr key={student._id || 'error'} className="hover:bg-gray-50">
                               <td colSpan={4} className="px-6 py-4 text-red-600">
                                 Error rendering student data
                               </td>
                             </tr>
                           );
                         }
                       }).filter(Boolean)}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
