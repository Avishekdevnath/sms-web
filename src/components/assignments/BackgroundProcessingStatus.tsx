"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  Play,
  Pause,
  Stop,
  Download,
  Eye,
  EyeOff,
  BarChart3,
  TrendingUp,
  Users,
  Mail
} from "lucide-react";

interface ProcessingJob {
  id: string;
  type: 'email_submission' | 'bulk_processing' | 'duplicate_resolution';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  totalItems: number;
  processedItems: number;
  successCount: number;
  errorCount: number;
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
  metadata: {
    assignmentId?: string;
    assignmentTitle?: string;
    submittedBy?: string;
    emailCount?: number;
  };
}

interface BackgroundProcessingStatusProps {
  assignmentId?: string;
  showGlobalView?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export default function BackgroundProcessingStatus({
  assignmentId,
  showGlobalView = false,
  autoRefresh = true,
  refreshInterval = 5000
}: BackgroundProcessingStatusProps) {
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [isAutoRefresh, setIsAutoRefresh] = useState(autoRefresh);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchJobs();
    
    if (isAutoRefresh) {
      startAutoRefresh();
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [assignmentId, showGlobalView, isAutoRefresh]);

  const startAutoRefresh = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(() => {
      fetchJobs();
    }, refreshInterval);
  };

  const stopAutoRefresh = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const url = showGlobalView 
        ? '/api/processing/jobs'
        : `/api/processing/jobs?assignmentId=${assignmentId}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        setJobs(data.data || []);
      } else {
        setError(data.error?.message || 'Failed to fetch processing jobs');
      }
    } catch (error) {
      console.error('Error fetching processing jobs:', error);
      setError('Failed to fetch processing jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleJobAction = async (jobId: string, action: 'cancel' | 'retry') => {
    try {
      const response = await fetch(`/api/processing/jobs/${jobId}/${action}`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        fetchJobs(); // Refresh the list
      } else {
        setError(data.error?.message || `Failed to ${action} job`);
      }
    } catch (error) {
      console.error(`Error ${action}ing job:`, error);
      setError(`Failed to ${action} job`);
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
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
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
        return <XCircle className="h-4 w-4" />;
      case 'cancelled':
        return <Stop className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getJobTypeLabel = (type: string) => {
    switch (type) {
      case 'email_submission':
        return 'Email Submission';
      case 'bulk_processing':
        return 'Bulk Processing';
      case 'duplicate_resolution':
        return 'Duplicate Resolution';
      default:
        return type;
    }
  };

  const getStats = () => {
    const total = jobs.length;
    const completed = jobs.filter(j => j.status === 'completed').length;
    const processing = jobs.filter(j => j.status === 'processing').length;
    const failed = jobs.filter(j => j.status === 'failed').length;
    const pending = jobs.filter(j => j.status === 'pending').length;
    
    return { total, completed, processing, failed, pending };
  };

  const stats = getStats();
  const filteredJobs = assignmentId 
    ? jobs.filter(job => job.metadata.assignmentId === assignmentId)
    : jobs;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-black">Background Processing Status</h2>
          <p className="mt-1 text-gray-600">
            {showGlobalView ? 'All processing jobs across the system' : 'Processing jobs for this assignment'}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
            className={`inline-flex items-center px-3 py-2 rounded-lg transition-colors ${
              isAutoRefresh 
                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            {isAutoRefresh ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {isAutoRefresh ? 'Auto Refresh On' : 'Auto Refresh Off'}
          </button>
          <button
            onClick={fetchJobs}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {showDetails ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="border rounded-lg p-4 bg-white">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Jobs</p>
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
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-xl font-bold text-black">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4 bg-white">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Failed</p>
              <p className="text-xl font-bold text-black">{stats.failed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="border rounded-lg overflow-hidden bg-white">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Job
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Progress
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Results
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Started
              </th>
              {showDetails && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              )}
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredJobs.map((job) => (
              <tr key={job.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {getJobTypeLabel(job.type)}
                    </div>
                    {job.metadata.assignmentTitle && (
                      <div className="text-sm text-gray-500">{job.metadata.assignmentTitle}</div>
                    )}
                    {job.metadata.submittedBy && (
                      <div className="text-sm text-gray-500">by {job.metadata.submittedBy}</div>
                    )}
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
                    {job.processedItems} of {job.totalItems} items
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center space-x-4">
                    <span className="text-green-600 text-sm">✓ {job.successCount}</span>
                    {job.errorCount > 0 && (
                      <span className="text-red-600 text-sm">✗ {job.errorCount}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {new Date(job.startedAt).toLocaleString()}
                </td>
                {showDetails && (
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedJob(selectedJob === job.id ? null : job.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      {selectedJob === job.id ? 'Hide' : 'Show'} Details
                    </button>
                    {selectedJob === job.id && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                        <div className="space-y-2 text-sm">
                          <div><strong>Job ID:</strong> {job.id}</div>
                          <div><strong>Type:</strong> {job.type}</div>
                          {job.metadata.emailCount && (
                            <div><strong>Email Count:</strong> {job.metadata.emailCount}</div>
                          )}
                          {job.completedAt && (
                            <div><strong>Completed:</strong> {new Date(job.completedAt).toLocaleString()}</div>
                          )}
                          {job.errorMessage && (
                            <div><strong>Error:</strong> <span className="text-red-600">{job.errorMessage}</span></div>
                          )}
                        </div>
                      </div>
                    )}
                  </td>
                )}
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    {job.status === 'processing' && (
                      <button
                        onClick={() => handleJobAction(job.id, 'cancel')}
                        className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 rounded text-xs hover:bg-red-200"
                      >
                        <Stop className="h-3 w-3 mr-1" />
                        Cancel
                      </button>
                    )}
                    {job.status === 'failed' && (
                      <button
                        onClick={() => handleJobAction(job.id, 'retry')}
                        className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs hover:bg-blue-200"
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Retry
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No processing jobs found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {assignmentId 
                ? 'No background processing jobs for this assignment.'
                : 'No background processing jobs in the system.'}
            </p>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <XCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      {jobs.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-blue-800">Processing Summary</h3>
              <p className="mt-1 text-sm text-blue-700">
                {stats.completed} jobs completed, {stats.processing} currently processing, 
                {stats.pending} pending, and {stats.failed} failed.
                {isAutoRefresh && ' Auto-refresh is enabled.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
