'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function MissionAttendanceFormsPage() {
  const params = useParams();
  const router = useRouter();
  const missionId = String(params?.missionId || '');
  const { user } = useAuth();
  const isPrivileged = useMemo(() => ['admin', 'sre', 'mentor', 'developer'].includes(user?.role || ''), [user]);

  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/v2/attendance/forms?missionId=${missionId}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setForms(data.data || []);
      }
    };
    if (missionId) load();
  }, [missionId]);

  // Auto-hide notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Handle click outside notification to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notification && notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotification(null);
      }
    };

    if (notification) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [notification]);

  if (!isPrivileged) return <div className="p-4">Insufficient permissions.</div>;

  const deleteForm = async (formId: string) => {
    if (!confirm('Are you sure you want to delete this form? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/v2/attendance/forms/${formId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setNotification({ type: 'success', message: 'Form deleted successfully!' });
        setForms(forms.filter(form => form._id !== formId));
      } else {
        setNotification({ type: 'error', message: result.error || 'Failed to delete form' });
      }
    } catch (error) {
      console.error('Error deleting form:', error);
      setNotification({ type: 'error', message: 'Failed to delete form' });
    } finally {
      setLoading(false);
    }
  };

  const toggleFormStatus = async (formId: string, newStatus: boolean) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v2/attendance/forms/${formId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ active: newStatus }),
      });

      const result = await response.json();

      if (result.success) {
        setNotification({ 
          type: 'success', 
          message: `Form ${newStatus ? 'activated' : 'deactivated'} successfully!` 
        });
        setForms(forms.map(form => 
          form._id === formId ? { ...form, active: newStatus } : form
        ));
      } else {
        setNotification({ type: 'error', message: result.error || 'Failed to update form status' });
      }
    } catch (error) {
      console.error('Error updating form status:', error);
      setNotification({ type: 'error', message: 'Failed to update form status' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Custom Notification */}
      {notification && (
        <div 
          ref={notificationRef}
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
            notification.type === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{notification.type === 'success' ? '✓' : '✕'}</span>
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-2 text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Header and Create Button */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Forms</h1>
          <p className="text-gray-600">Manage dynamic attendance forms for this mission.</p>
        </div>
        <button
          onClick={() => router.push(`/mission-hub/missions/${missionId}/attendance/forms/create`)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Create New Form
        </button>
      </div>

      {/* Forms Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {forms.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No attendance forms created yet. Click "Create New Form" to get started.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Form Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Questions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {forms.map((form) => (
                <tr key={form._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {form.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {form.questions.length}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => toggleFormStatus(form._id, !form.active)}
                      disabled={loading}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                        form.active 
                          ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      title={`Click to ${form.active ? 'deactivate' : 'activate'} this form`}
                    >
                      {form.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(form.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => router.push(`/mission-hub/missions/${missionId}/attendance/forms/${form._id}/view`)}
                      className="text-green-600 hover:text-green-900 mr-4"
                    >
                      View
                    </button>
                    <button
                      onClick={() => router.push(`/mission-hub/missions/${missionId}/attendance/forms/${form._id}/edit`)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteForm(form._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}