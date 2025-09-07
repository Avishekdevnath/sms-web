"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Edit, Trash2, Calendar, BookOpen, Users, CheckCircle, XCircle, Clock, FileText, Download, Eye } from "lucide-react";

interface Assignment {
  _id: string;
  title: string;
  description?: string;
  courseOfferingId: {
    _id: string;
    title: string;
    code: string;
  };
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  publishedAt?: string;
  dueAt?: string;
  maxPoints?: number;
  attachments?: Array<{
    name: string;
    url: string;
  }>;
  completedEmails: Array<{
    email: string;
    studentId?: {
      _id: string;
      name: string;
      email: string;
      studentId: string;
    };
    addedAt: string;
    addedBy: {
      _id: string;
      name: string;
      email: string;
    };
  }>;
  emailSubmissions: Array<{
    _id: string;
    submittedBy: {
      _id: string;
      name: string;
      email: string;
    };
    submittedAt: string;
    emailList: string[];
    processedCount: number;
    successCount: number;
    errorCount: number;
    status: 'completed' | 'failed' | 'partial';
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function AssignmentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.id as string;

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'emails' | 'submissions'>('emails');
  const [emailSearch, setEmailSearch] = useState("");
  const [emailPage, setEmailPage] = useState(1);
  const [submissionPage, setSubmissionPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [deletingEmail, setDeletingEmail] = useState<string | null>(null);

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

  const handleDeleteEmail = async (email: string) => {
    if (!confirm(`Are you sure you want to remove ${email} from this assignment?`)) {
      return;
    }

    try {
      setDeletingEmail(email);
      const response = await fetch(`/api/assignments/${assignmentId}/emails/${encodeURIComponent(email)}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchAssignment(); // Refresh assignment data
      } else {
        const error = await response.json();
        alert(`Error removing email: ${error.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error removing email:', error);
      alert('Failed to remove email');
    } finally {
      setDeletingEmail(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredEmails = assignment?.completedEmails.filter(email => 
    email.email.toLowerCase().includes(emailSearch.toLowerCase()) ||
    (email.studentId?.name?.toLowerCase().includes(emailSearch.toLowerCase())) ||
    (email.studentId?.studentId?.toLowerCase().includes(emailSearch.toLowerCase()))
  ) || [];

  const emailsPerPage = 20;
  const totalEmailPages = Math.ceil(filteredEmails.length / emailsPerPage);
  const paginatedEmails = filteredEmails.slice(
    (emailPage - 1) * emailsPerPage,
    emailPage * emailsPerPage
  );

  const submissionsPerPage = 10;
  const totalSubmissionPages = Math.ceil((assignment?.emailSubmissions.length || 0) / submissionsPerPage);
  const paginatedSubmissions = assignment?.emailSubmissions.slice(
    (submissionPage - 1) * submissionsPerPage,
    submissionPage * submissionsPerPage
  ) || [];

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
            <h1 className="text-3xl font-bold text-black">{assignment.title}</h1>
            <p className="mt-2 text-gray-600">
              {assignment.courseOfferingId.title} • {assignment.courseOfferingId.code}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {assignment.publishedAt && (
            <Link
              href={`/dashboard/admin/assignments/${assignment._id}/submit-emails`}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Mail className="h-4 w-4 mr-2" />
              Submit Emails
            </Link>
          )}
          <Link
            href={`/dashboard/admin/assignments/${assignment._id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:border-black transition-colors"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Link>
        </div>
      </div>

      {/* Assignment Info */}
      <div className="border rounded-lg p-6 bg-white">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <FileText className="h-6 w-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Created By</p>
              <p className="text-lg font-semibold text-black">{assignment.createdBy.name}</p>
            </div>
          </div>

          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Calendar className="h-6 w-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Due Date</p>
              <p className="text-lg font-semibold text-black">
                {assignment.dueAt ? formatDate(assignment.dueAt) : 'Not set'}
              </p>
            </div>
          </div>

          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Users className="h-6 w-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completions</p>
              <p className="text-lg font-semibold text-black">{assignment.completedEmails.length}</p>
            </div>
          </div>

          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Clock className="h-6 w-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Status</p>
              <p className="text-lg font-semibold text-black">
                {assignment.publishedAt ? 'Published' : 'Draft'}
              </p>
            </div>
          </div>
        </div>

        {assignment.description && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
            <p className="text-gray-900">{assignment.description}</p>
          </div>
        )}

        {assignment.attachments && assignment.attachments.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Attachments</h3>
            <div className="space-y-2">
              {assignment.attachments.map((attachment, index) => (
                <a
                  key={index}
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:text-blue-800"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {attachment.name}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border rounded-lg bg-white">
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('emails')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'emails'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Completed Emails ({assignment.completedEmails.length})
            </button>
            <button
              onClick={() => setActiveTab('submissions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'submissions'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Submission History ({assignment.emailSubmissions.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'emails' && (
            <div className="space-y-4">
              {/* Search */}
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search emails..."
                    value={emailSearch}
                    onChange={(e) => setEmailSearch(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                  />
                </div>
                <div className="text-sm text-gray-500">
                  {filteredEmails.length} of {assignment.completedEmails.length} emails
                </div>
              </div>

              {/* Emails Table */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Added By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Added At
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedEmails.map((email, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{email.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {email.studentId ? (
                            <div>
                              <div className="text-sm font-medium text-gray-900">{email.studentId.name}</div>
                              <div className="text-sm text-gray-500">{email.studentId.studentId}</div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">Not in system</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{email.addedBy.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(email.addedAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleDeleteEmail(email.email)}
                            disabled={deletingEmail === email.email}
                            className="text-red-600 hover:text-red-800 disabled:opacity-50"
                          >
                            {deletingEmail === email.email ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {paginatedEmails.length === 0 && (
                  <div className="text-center py-12">
                    <Mail className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No emails found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {emailSearch ? "Try adjusting your search terms." : "No emails have been submitted yet."}
                    </p>
                  </div>
                )}
              </div>

              {/* Email Pagination */}
              {totalEmailPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {((emailPage - 1) * emailsPerPage) + 1} to {Math.min(emailPage * emailsPerPage, filteredEmails.length)} of {filteredEmails.length} results
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEmailPage(prev => Math.max(1, prev - 1))}
                      disabled={emailPage === 1}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:border-black"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setEmailPage(prev => Math.min(totalEmailPages, prev + 1))}
                      disabled={emailPage === totalEmailPages}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:border-black"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'submissions' && (
            <div className="space-y-4">
              {/* Submissions Table */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submitted By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submitted At
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Emails Processed
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedSubmissions.map((submission) => (
                      <tr key={submission._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{submission.submittedBy.name}</div>
                          <div className="text-sm text-gray-500">{submission.submittedBy.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(submission.submittedAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <div className="flex items-center space-x-4">
                              <span className="text-green-600">✓ {submission.successCount}</span>
                              {submission.errorCount > 0 && (
                                <span className="text-red-600">✗ {submission.errorCount}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                            {submission.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-gray-600 hover:text-black">
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {paginatedSubmissions.length === 0 && (
                  <div className="text-center py-12">
                    <Clock className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No submissions yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Email submissions will appear here once they are processed.</p>
                  </div>
                )}
              </div>

              {/* Submission Pagination */}
              {totalSubmissionPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {((submissionPage - 1) * submissionsPerPage) + 1} to {Math.min(submissionPage * submissionsPerPage, assignment.emailSubmissions.length)} of {assignment.emailSubmissions.length} results
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSubmissionPage(prev => Math.max(1, prev - 1))}
                      disabled={submissionPage === 1}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:border-black"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setSubmissionPage(prev => Math.min(totalSubmissionPages, prev + 1))}
                      disabled={submissionPage === totalSubmissionPages}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:border-black"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
