"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Upload, CheckCircle, XCircle, AlertCircle, Users, Clock, FileText } from "lucide-react";

interface Assignment {
  _id: string;
  title: string;
  description?: string;
  courseOfferingId: {
    _id: string;
    title: string;
    code: string;
  };
  publishedAt?: string;
  completionCount?: number;
  totalSubmissions?: number;
}

interface ProcessingResult {
  validEmails: string[];
  invalidEmails: string[];
  duplicateEmails: string[];
  processingStats: {
    total: number;
    valid: number;
    invalid: number;
    duplicates: number;
    new: number;
  };
}

export default function SubmitEmailsPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.id as string;

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [emailText, setEmailText] = useState("");
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (assignmentId) {
      fetchAssignment();
    }
  }, [assignmentId]);

  const fetchAssignment = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/assignments/${assignmentId}`);
      const data = await response.json();

      if (response.ok) {
        setAssignment(data.data);
      } else {
        setError(data.error?.message || 'Failed to fetch assignment');
      }
    } catch (error) {
      console.error('Error fetching assignment:', error);
      setError('Failed to fetch assignment');
    } finally {
      setLoading(false);
    }
  };

  const extractEmailsFromText = (text: string): string[] => {
    const emailRegex = /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*/g;
    const matches = text.match(emailRegex) || [];
    return matches.map(email => email.trim().toLowerCase());
  };

  const validateEmailFormat = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  };

  const processEmails = (): ProcessingResult => {
    const emails = extractEmailsFromText(emailText);
    const validEmails: string[] = [];
    const invalidEmails: string[] = [];
    const duplicateEmails: string[] = [];
    const seenEmails = new Set<string>();

    emails.forEach(email => {
      if (!validateEmailFormat(email)) {
        invalidEmails.push(email);
      } else if (seenEmails.has(email)) {
        duplicateEmails.push(email);
      } else {
        seenEmails.add(email);
        validEmails.push(email);
      }
    });

    return {
      validEmails,
      invalidEmails,
      duplicateEmails,
      processingStats: {
        total: emails.length,
        valid: validEmails.length,
        invalid: invalidEmails.length,
        duplicates: duplicateEmails.length,
        new: validEmails.length
      }
    };
  };

  const handlePreview = () => {
    if (!emailText.trim()) {
      setError('Please enter some emails to preview');
      return;
    }

    const result = processEmails();
    setProcessingResult(result);
    setShowPreview(true);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!emailText.trim()) {
      setError('Please enter some emails to submit');
      return;
    }

    if (!processingResult) {
      setError('Please preview the emails first');
      return;
    }

    if (processingResult.validEmails.length === 0) {
      setError('No valid emails to submit');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(`/api/assignments/${assignmentId}/add-emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailText: emailText
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Successfully processed ${data.data.newEmailsAdded} new emails`);
        setEmailText("");
        setProcessingResult(null);
        setShowPreview(false);
        fetchAssignment(); // Refresh assignment data
      } else {
        setError(data.error?.message || 'Failed to submit emails');
      }
    } catch (error) {
      console.error('Error submitting emails:', error);
      setError('Failed to submit emails');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading assignment...</p>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Assignment not found</h3>
          <p className="mt-1 text-sm text-gray-500">The assignment you're looking for doesn't exist.</p>
          <div className="mt-6">
            <Link
              href="/dashboard/admin/assignments"
              className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Assignments
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!assignment.publishedAt) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-yellow-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Assignment not published</h3>
          <p className="mt-1 text-sm text-gray-500">Only published assignments can receive email submissions.</p>
          <div className="mt-6">
            <Link
              href="/dashboard/admin/assignments"
              className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Assignments
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/admin/assignments"
            className="text-gray-600 hover:text-black"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-black">Submit Emails</h1>
            <p className="mt-2 text-gray-600">
              Add completed student emails for: <span className="font-medium">{assignment.title}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Assignment Info */}
      <div className="border rounded-lg p-6 bg-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <FileText className="h-6 w-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Assignment</p>
              <p className="text-lg font-semibold text-black">{assignment.title}</p>
            </div>
          </div>

          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Mail className="h-6 w-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Course</p>
              <p className="text-lg font-semibold text-black">{assignment.courseOfferingId.title}</p>
            </div>
          </div>

          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Users className="h-6 w-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Current Completions</p>
              <p className="text-lg font-semibold text-black">{assignment.completionCount || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="border border-green-200 rounded-lg p-4 bg-green-50">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <p className="text-green-800">{success}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="border border-red-200 rounded-lg p-4 bg-red-50">
          <div className="flex items-center">
            <XCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Email Input */}
      <div className="border rounded-lg p-6 bg-white">
        <div className="space-y-4">
          <div>
            <label htmlFor="emailText" className="block text-sm font-medium text-gray-700 mb-2">
              Student Emails
            </label>
            <p className="text-sm text-gray-500 mb-4">
              Paste student emails here. You can paste from Excel, CSV, or any text format. 
              The system will automatically extract and validate email addresses.
            </p>
            <textarea
              id="emailText"
              value={emailText}
              onChange={(e) => setEmailText(e.target.value)}
              placeholder="student1@example.com&#10;student2@example.com&#10;student3@example.com&#10;&#10;Or paste from Excel/CSV..."
              className="w-full h-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black resize-none"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {emailText.length > 0 && (
                <span>
                  {extractEmailsFromText(emailText).length} emails detected
                </span>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handlePreview}
                disabled={!emailText.trim() || submitting}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:border-black disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Preview
              </button>
              <button
                onClick={handleSubmit}
                disabled={!processingResult || processingResult.validEmails.length === 0 || submitting}
                className="px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  'Submit Emails'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Results */}
      {showPreview && processingResult && (
        <div className="border rounded-lg p-6 bg-white">
          <h3 className="text-lg font-semibold text-black mb-4">Processing Preview</h3>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{processingResult.processingStats.total}</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{processingResult.processingStats.valid}</div>
              <div className="text-sm text-gray-500">Valid</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{processingResult.processingStats.duplicates}</div>
              <div className="text-sm text-gray-500">Duplicates</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{processingResult.processingStats.invalid}</div>
              <div className="text-sm text-gray-500">Invalid</div>
            </div>
          </div>

          {/* Email Lists */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {processingResult.validEmails.length > 0 && (
              <div>
                <h4 className="font-medium text-green-800 mb-2">Valid Emails ({processingResult.validEmails.length})</h4>
                <div className="max-h-32 overflow-y-auto border border-green-200 rounded p-3 bg-green-50">
                  {processingResult.validEmails.map((email, index) => (
                    <div key={index} className="text-sm text-green-700 py-1">{email}</div>
                  ))}
                </div>
              </div>
            )}

            {processingResult.duplicateEmails.length > 0 && (
              <div>
                <h4 className="font-medium text-yellow-800 mb-2">Duplicate Emails ({processingResult.duplicateEmails.length})</h4>
                <div className="max-h-32 overflow-y-auto border border-yellow-200 rounded p-3 bg-yellow-50">
                  {processingResult.duplicateEmails.map((email, index) => (
                    <div key={index} className="text-sm text-yellow-700 py-1">{email}</div>
                  ))}
                </div>
              </div>
            )}

            {processingResult.invalidEmails.length > 0 && (
              <div>
                <h4 className="font-medium text-red-800 mb-2">Invalid Emails ({processingResult.invalidEmails.length})</h4>
                <div className="max-h-32 overflow-y-auto border border-red-200 rounded p-3 bg-red-50">
                  {processingResult.invalidEmails.map((email, index) => (
                    <div key={index} className="text-sm text-red-700 py-1">{email}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
