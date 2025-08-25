'use client';

import React, { useState, useEffect } from 'react';
import { UserPlus, Upload, CheckCircle, GraduationCap, AlertCircle, Info, X, FileText, Users, Clock, Mail } from 'lucide-react';

interface Batch {
  _id: string;
  title: string;
  code: string;
  description?: string;
  maxStudents?: number;
}

interface EnrollmentForm {
  email: string;
  batchId: string;
}

interface StudentEmail {
  id: string;
  email: string;
  name?: string;
  status: 'pending' | 'validated' | 'error';
  error?: string;
}

interface EnrollmentStats {
  total: number;
  pending: number;
  invited: number;
  activated: number;
  rejected: number;
}

export default function StudentEnrollPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [showBulkMode, setShowBulkMode] = useState(false);
  const [stats, setStats] = useState<EnrollmentStats>({
    total: 0,
    pending: 0,
    invited: 0,
    activated: 0,
    rejected: 0
  });

        const [formData, setFormData] = useState<EnrollmentForm>({
        email: '',
        batchId: ''
      });

  // Bulk upload states
  const [bulkEmails, setBulkEmails] = useState<StudentEmail[]>([]);
  const [bulkEmailText, setBulkEmailText] = useState<string>('');
  const [bulkWorkflow, setBulkWorkflow] = useState<'upload' | 'validate' | 'enroll'>('upload');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkBatchId, setBulkBatchId] = useState<string>('');
  const [bulkNotes, setBulkNotes] = useState<string>('');

  useEffect(() => {
    fetchBatches();
    fetchEnrollmentStats();
  }, []);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/batches');
      if (response.ok) {
        const data = await response.json();
        setBatches(data.data || []);
      } else {
        console.error('Failed to fetch batches:', response.status, response.statusText);
        setError('Failed to load batches. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
      setError('Network error while loading batches.');
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollmentStats = async () => {
    try {
      const response = await fetch('/api/students/enroll');
      if (response.ok) {
        const data = await response.json();
        // Calculate stats from enrollment data
        // This would need to be implemented in the API
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const checkEmailExists = async (email: string) => {
    if (!email || !email.includes('@')) {
      setEmailExists(null);
      return;
    }

    try {
      setCheckingEmail(true);
      const response = await fetch(`/api/students/check-email?email=${encodeURIComponent(email)}`, {
        method: 'GET'
      });

      if (response.ok) {
        const data = await response.json();
        setEmailExists(data.exists);
      } else {
        console.error('Failed to check email:', response.status);
        setEmailExists(null);
      }
    } catch (error) {
      console.error('Error checking email:', error);
      setEmailExists(null);
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleInputChange = (field: keyof EnrollmentForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'email') {
      setEmailExists(null);
      if (value && value.includes('@')) {
        checkEmailExists(value);
      }
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
            if (!formData.email || !formData.batchId) {
          setError('Please fill in all required fields');
          return;
        }

    if (emailExists) {
      setError('This email is already registered in the system');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const response = await fetch('/api/students/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
              emails: [formData.email], 
              batchId: formData.batchId
            })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to enroll student');
      }

      const data = await response.json();
      
      if (data.success) {
                    setSuccess(`Successfully enrolled ${formData.email}! The student will need to be invited next.`);
            
            // Reset form
            setFormData({
              email: '',
              batchId: ''
            });
        setEmailExists(null);
        
        // Refresh stats
        fetchEnrollmentStats();
      } else {
        throw new Error(data.error?.message || 'Enrollment failed');
      }

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Enrollment failed');
    } finally {
      setLoading(false);
    }
  };

  const parseBulkEmails = (text: string): StudentEmail[] => {
    const lines = text.split('\n').filter(line => line.trim());
    return lines.map((line, index) => {
      const parts = line.split(',').map(part => part.trim());
      const email = parts[0] || '';
      const name = parts[1] || '';
      
      return {
        id: `email-${index}`,
        email,
        name,
        status: 'pending' as const
      };
    });
  };

  const validateBulkEmails = async () => {
           const emails = bulkEmailText.split('\n').filter(line => line.trim()).map(line => line.trim());
       setBulkEmails(emails.map(email => ({ id: `email-${Date.now()}-${Math.random()}`, email, status: 'pending' as const })));
       setBulkWorkflow('validate');
  };

  const processBulkEnrollment = async () => {
    if (!bulkBatchId) {
      setError('Please select a batch for bulk enrollment');
      return;
    }

    try {
      setBulkLoading(true);
      setError('');

      const response = await fetch('/api/students/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({ 
               emails: bulkEmails.map(e => e.email),
               batchId: bulkBatchId
             })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Bulk enrollment failed');
      }

      const data = await response.json();
      
      if (data.success) {
        setSuccess(`Bulk enrollment completed! ${data.results.successful} successful, ${data.results.failed} failed.`);
        setBulkWorkflow('upload');
                     setBulkEmailText('');
             setBulkEmails([]);
             setBulkBatchId('');
        fetchEnrollmentStats();
      } else {
        throw new Error(data.error?.message || 'Bulk enrollment failed');
      }

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Bulk enrollment failed');
    } finally {
      setBulkLoading(false);
    }
  };

  const getEmailStatusBadge = () => {
    if (checkingEmail) {
      return (
        <div className="flex items-center text-blue-600">
          <Clock className="w-4 h-4 mr-1 animate-spin" />
          Checking...
        </div>
      );
    }
    
    if (emailExists === true) {
      return (
        <div className="flex items-center text-red-600">
          <AlertCircle className="w-4 h-4 mr-1" />
          Email already exists
        </div>
      );
    }
    
    if (emailExists === false) {
      return (
        <div className="flex items-center text-green-600">
          <CheckCircle className="w-4 h-4 mr-1" />
          Email available
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Enrollment</h1>
            <p className="text-gray-600 mt-1">Enroll new students into the system</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowBulkMode(!showBulkMode)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                showBulkMode 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Upload className="w-4 h-4 inline mr-2" />
              {showBulkMode ? 'Single Mode' : 'Bulk Mode'}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Users className="w-5 h-5 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-600">Total Enrollments</p>
                <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Mail className="w-5 h-5 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-600">Invited</p>
                <p className="text-2xl font-bold text-purple-900">{stats.invited}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-600">Activated</p>
                <p className="text-2xl font-bold text-green-900">{stats.activated}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => setError('')}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <p className="text-green-800">{success}</p>
            <button
              onClick={() => setSuccess('')}
              className="ml-auto text-green-600 hover:text-green-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      {showBulkMode ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Bulk Student Enrollment</h2>
          
          {bulkWorkflow === 'upload' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Batch Selection
                </label>
                <select
                  value={bulkBatchId}
                  onChange={(e) => setBulkBatchId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                       Student Emails (one per line)
                     </label>
                     <textarea
                       value={bulkEmailText}
                       onChange={(e) => setBulkEmailText(e.target.value)}
                       placeholder="student1@example.com&#10;student2@example.com&#10;student3@example.com"
                       className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                     />
                     <p className="text-sm text-gray-500 mt-1">
                       Enter one email address per line
                     </p>
                   </div>

              <button
                onClick={validateBulkEmails}
                disabled={!bulkEmailText.trim() || !bulkBatchId}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                <FileText className="w-4 h-4 inline mr-2" />
                Validate & Preview
              </button>
            </div>
          )}

          {bulkWorkflow === 'validate' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-md font-medium text-gray-900">Preview Enrollment Data</h3>
                <button
                  onClick={() => setBulkWorkflow('upload')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ← Back to Upload
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-3">
                  Batch: {batches.find(b => b._id === bulkBatchId)?.code} - {batches.find(b => b._id === bulkBatchId)?.title}
                </p>
                                     <p className="text-sm text-gray-600 mb-3">
                       Total Students: {bulkEmails.length}
                     </p>
              </div>

              <div className="max-h-60 overflow-y-auto">
                <table className="w-full text-sm">
                                         <thead className="bg-gray-50">
                         <tr>
                           <th className="px-3 py-2 text-left text-gray-700">Email</th>
                           <th className="px-3 py-2 text-left text-gray-700">Status</th>
                         </tr>
                       </thead>
                       <tbody>
                         {bulkEmails.map((email) => (
                           <tr key={email.id} className="border-b border-gray-100">
                             <td className="px-3 py-2">{email.email}</td>
                             <td className="px-3 py-2">
                               <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                 Ready
                               </span>
                             </td>
                           </tr>
                         ))}
                       </tbody>
                </table>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={processBulkEnrollment}
                  disabled={bulkLoading}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  {bulkLoading ? (
                    <>
                      <Clock className="w-4 h-4 inline mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 inline mr-2" />
                      Enroll Students
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Single Student Enrollment</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="student@example.com"
                required
              />
              {getEmailStatusBadge()}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Batch *
              </label>
              <select
                value={formData.batchId}
                onChange={(e) => handleInputChange('batchId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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



            <div className="flex items-center space-x-3">
              <button
                type="submit"
                disabled={loading || emailExists === true}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                {loading ? (
                  <>
                    <Clock className="w-4 h-4 inline mr-2 animate-spin" />
                    Enrolling...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 inline mr-2" />
                    Enroll Student
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Info className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-900">Enrollment Process</h3>
            <p className="text-sm text-blue-700 mt-1">
              After enrollment, students will be in "pending" status. You can then send them invitations 
              from the Invitation Management page to complete their registration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
