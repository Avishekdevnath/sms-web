"use client";

import { useState, useEffect } from "react";
import { 
  Download, 
  FileText, 
  Mail, 
  Users, 
  Calendar, 
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff
} from "lucide-react";

interface ExportJob {
  id: string;
  type: 'completion_report' | 'student_progress' | 'assignment_summary' | 'duplicate_analysis';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  format: 'csv' | 'xlsx' | 'pdf';
  filters: {
    assignmentIds?: string[];
    studentIds?: string[];
    dateRange?: {
      start: string;
      end: string;
    };
    missionId?: string;
    courseOfferingId?: string;
  };
  progress: number;
  totalRecords: number;
  processedRecords: number;
  createdAt: string;
  completedAt?: string;
  downloadUrl?: string;
  errorMessage?: string;
}

interface AssignmentExportManagerProps {
  assignmentId?: string;
  missionId?: string;
  courseOfferingId?: string;
  showGlobalView?: boolean;
}

export default function AssignmentExportManager({
  assignmentId,
  missionId,
  courseOfferingId,
  showGlobalView = false
}: AssignmentExportManagerProps) {
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('completion_report');
  const [selectedFormat, setSelectedFormat] = useState<string>('csv');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [selectedAssignments, setSelectedAssignments] = useState<string[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  useEffect(() => {
    fetchExportJobs();
  }, [assignmentId, missionId, courseOfferingId]);

  const fetchExportJobs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (assignmentId) params.append('assignmentId', assignmentId);
      if (missionId) params.append('missionId', missionId);
      if (courseOfferingId) params.append('courseOfferingId', courseOfferingId);
      
      const response = await fetch(`/api/assignments/export/jobs?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setExportJobs(data.data || []);
      } else {
        setError(data.error?.message || 'Failed to fetch export jobs');
      }
    } catch (error) {
      console.error('Error fetching export jobs:', error);
      setError('Failed to fetch export jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExport = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/assignments/export/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: selectedType,
          format: selectedFormat,
          filters: {
            assignmentIds: assignmentId ? [assignmentId] : selectedAssignments,
            studentIds: selectedStudents,
            dateRange: dateRange.start && dateRange.end ? dateRange : undefined,
            missionId,
            courseOfferingId
          }
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setExportJobs(prev => [data.data, ...prev]);
        setShowFilters(false);
      } else {
        setError(data.error?.message || 'Failed to create export job');
      }
    } catch (error) {
      console.error('Error creating export job:', error);
      setError('Failed to create export job');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExport = async (jobId: string) => {
    try {
      const response = await fetch(`/api/assignments/export/${jobId}/download`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `assignment-export-${jobId}.${selectedFormat}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setError('Failed to download export file');
      }
    } catch (error) {
      console.error('Error downloading export:', error);
      setError('Failed to download export file');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'completion_report':
        return 'Completion Report';
      case 'student_progress':
        return 'Student Progress';
      case 'assignment_summary':
        return 'Assignment Summary';
      case 'duplicate_analysis':
        return 'Duplicate Analysis';
      default:
        return type;
    }
  };

  const getFormatLabel = (format: string) => {
    switch (format) {
      case 'csv':
        return 'CSV';
      case 'xlsx':
        return 'Excel';
      case 'pdf':
        return 'PDF';
      default:
        return format.toUpperCase();
    }
  };

  const getStats = () => {
    const total = exportJobs.length;
    const completed = exportJobs.filter(j => j.status === 'completed').length;
    const processing = exportJobs.filter(j => j.status === 'processing').length;
    const failed = exportJobs.filter(j => j.status === 'failed').length;
    
    return { total, completed, processing, failed };
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-black">Export Manager</h2>
          <p className="mt-1 text-gray-600">
            {showGlobalView ? 'Export assignment data across all missions' : 'Export assignment data for this context'}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Create Export
          </button>
          <button
            onClick={fetchExportJobs}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border rounded-lg p-4 bg-white">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Exports</p>
              <p className="text-xl font-bold text-black">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4 bg-white">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-xl font-bold text-black">{stats.completed}</p>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4 bg-white">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <RefreshCw className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Processing</p>
              <p className="text-xl font-bold text-black">{stats.processing}</p>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4 bg-white">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Failed</p>
              <p className="text-xl font-bold text-black">{stats.failed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Export Form */}
      {showFilters && (
        <div className="border rounded-lg p-6 bg-white">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Export</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Export Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="completion_report">Completion Report</option>
                <option value="student_progress">Student Progress</option>
                <option value="assignment_summary">Assignment Summary</option>
                <option value="duplicate_analysis">Duplicate Analysis</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Format
              </label>
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="csv">CSV</option>
                <option value="xlsx">Excel (XLSX)</option>
                <option value="pdf">PDF</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end space-x-3">
            <button
              onClick={() => setShowFilters(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateExport}
              disabled={loading}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating...' : 'Create Export'}
            </button>
          </div>
        </div>
      )}

      {/* Export Jobs Table */}
      <div className="border rounded-lg overflow-hidden bg-white">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Export
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Progress
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {exportJobs.map((job) => (
              <tr key={job.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {getTypeLabel(job.type)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {getFormatLabel(job.format)} • {job.totalRecords} records
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    {getStatusIcon(job.status)}
                    <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                      {job.status}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2 mr-3">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${job.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">
                      {job.progress}%
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {job.processedRecords} of {job.totalRecords} records
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {new Date(job.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {job.status === 'completed' && job.downloadUrl ? (
                    <button
                      onClick={() => handleDownloadExport(job.id)}
                      className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded text-sm hover:bg-green-200"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </button>
                  ) : (
                    <span className="text-sm text-gray-500">
                      {job.status === 'processing' ? 'Processing...' : 
                       job.status === 'failed' ? 'Failed' : 'Pending'}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {exportJobs.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No export jobs found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Create your first export to get started.
            </p>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
