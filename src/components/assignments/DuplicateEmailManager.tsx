"use client";

import { useState, useEffect } from "react";
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Mail, 
  Users, 
  Trash2,
  RefreshCw,
  Download,
  Upload,
  Eye,
  EyeOff,
  Filter,
  Search
} from "lucide-react";

interface DuplicateEmail {
  email: string;
  occurrences: number;
  locations: Array<{
    assignmentId: string;
    assignmentTitle: string;
    addedAt: string;
    addedBy: string;
  }>;
  studentInfo?: {
    name: string;
    studentId: string;
    email: string;
  };
}

interface DuplicateEmailManagerProps {
  assignmentId?: string;
  onDuplicateResolved?: (email: string, action: 'keep' | 'remove') => void;
  showGlobalView?: boolean;
}

export default function DuplicateEmailManager({
  assignmentId,
  onDuplicateResolved,
  showGlobalView = false
}: DuplicateEmailManagerProps) {
  const [duplicates, setDuplicates] = useState<DuplicateEmail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterByAssignment, setFilterByAssignment] = useState<string>("");
  const [showDetails, setShowDetails] = useState(false);
  const [selectedDuplicates, setSelectedDuplicates] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchDuplicates();
  }, [assignmentId, showGlobalView]);

  const fetchDuplicates = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const url = showGlobalView 
        ? '/api/assignments/duplicates/global'
        : `/api/assignments/${assignmentId}/duplicates`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        setDuplicates(data.data || []);
      } else {
        setError(data.error?.message || 'Failed to fetch duplicates');
      }
    } catch (error) {
      console.error('Error fetching duplicates:', error);
      setError('Failed to fetch duplicates');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveDuplicate = async (email: string, action: 'keep' | 'remove') => {
    setActionLoading(email);
    
    try {
      const response = await fetch(`/api/assignments/duplicates/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          action,
          assignmentId: assignmentId || null
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Remove the resolved duplicate from the list
        setDuplicates(prev => prev.filter(d => d.email !== email));
        onDuplicateResolved?.(email, action);
      } else {
        setError(data.error?.message || 'Failed to resolve duplicate');
      }
    } catch (error) {
      console.error('Error resolving duplicate:', error);
      setError('Failed to resolve duplicate');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkAction = async (action: 'keep' | 'remove') => {
    if (selectedDuplicates.size === 0) return;
    
    setActionLoading('bulk');
    
    try {
      const response = await fetch(`/api/assignments/duplicates/bulk-resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emails: Array.from(selectedDuplicates),
          action,
          assignmentId: assignmentId || null
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Remove resolved duplicates from the list
        setDuplicates(prev => prev.filter(d => !selectedDuplicates.has(d.email)));
        setSelectedDuplicates(new Set());
        onDuplicateResolved?.(Array.from(selectedDuplicates).join(','), action);
      } else {
        setError(data.error?.message || 'Failed to resolve duplicates');
      }
    } catch (error) {
      console.error('Error resolving duplicates:', error);
      setError('Failed to resolve duplicates');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSelectDuplicate = (email: string) => {
    const newSelected = new Set(selectedDuplicates);
    if (newSelected.has(email)) {
      newSelected.delete(email);
    } else {
      newSelected.add(email);
    }
    setSelectedDuplicates(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedDuplicates.size === filteredDuplicates.length) {
      setSelectedDuplicates(new Set());
    } else {
      setSelectedDuplicates(new Set(filteredDuplicates.map(d => d.email)));
    }
  };

  const filteredDuplicates = duplicates.filter(duplicate => {
    const matchesSearch = duplicate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         duplicate.studentInfo?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAssignment = !filterByAssignment || 
                             duplicate.locations.some(loc => loc.assignmentId === filterByAssignment);
    return matchesSearch && matchesAssignment;
  });

  const getStats = () => {
    const total = duplicates.length;
    const totalOccurrences = duplicates.reduce((sum, d) => sum + d.occurrences, 0);
    const withStudentInfo = duplicates.filter(d => d.studentInfo).length;
    const withoutStudentInfo = total - withStudentInfo;
    
    return { total, totalOccurrences, withStudentInfo, withoutStudentInfo };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="border rounded-lg p-6 bg-white">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          <span className="ml-3 text-gray-600">Loading duplicates...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border rounded-lg p-6 bg-white">
        <div className="text-center">
          <XCircle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading duplicates</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <button
            onClick={fetchDuplicates}
            className="mt-4 inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-black">Duplicate Email Management</h2>
          <p className="mt-1 text-gray-600">
            {showGlobalView ? 'Global duplicate emails across all assignments' : 'Duplicate emails in this assignment'}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchDuplicates}
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border rounded-lg p-4 bg-white">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Duplicates</p>
              <p className="text-xl font-bold text-black">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4 bg-white">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Mail className="h-5 w-5 text-orange-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Occurrences</p>
              <p className="text-xl font-bold text-black">{stats.totalOccurrences}</p>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4 bg-white">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">With Student Info</p>
              <p className="text-xl font-bold text-black">{stats.withStudentInfo}</p>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4 bg-white">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <XCircle className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Without Student Info</p>
              <p className="text-xl font-bold text-black">{stats.withoutStudentInfo}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center justify-between space-x-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search emails or student names..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          
          {showGlobalView && (
            <select
              value={filterByAssignment}
              onChange={(e) => setFilterByAssignment(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">All Assignments</option>
              {/* Assignment options would be populated from API */}
            </select>
          )}
        </div>

        {selectedDuplicates.size > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              {selectedDuplicates.size} selected
            </span>
            <button
              onClick={() => handleBulkAction('keep')}
              disabled={actionLoading === 'bulk'}
              className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Keep Selected
            </button>
            <button
              onClick={() => handleBulkAction('remove')}
              disabled={actionLoading === 'bulk'}
              className="inline-flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove Selected
            </button>
          </div>
        )}
      </div>

      {/* Duplicates Table */}
      <div className="border rounded-lg overflow-hidden bg-white">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedDuplicates.size === filteredDuplicates.length && filteredDuplicates.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Occurrences
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student Info
              </th>
              {showDetails && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Locations
                </th>
              )}
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredDuplicates.map((duplicate) => (
              <tr key={duplicate.email} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedDuplicates.has(duplicate.email)}
                    onChange={() => handleSelectDuplicate(duplicate.email)}
                    className="rounded border-gray-300"
                  />
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{duplicate.email}</div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {duplicate.occurrences} times
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {duplicate.studentInfo ? (
                    <div>
                      <div className="text-sm font-medium text-gray-900">{duplicate.studentInfo.name}</div>
                      <div className="text-sm text-gray-500">{duplicate.studentInfo.studentId}</div>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">Not found</span>
                  )}
                </td>
                {showDetails && (
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      {duplicate.locations.slice(0, 3).map((location, index) => (
                        <div key={index} className="text-sm">
                          <div className="font-medium text-gray-900">{location.assignmentTitle}</div>
                          <div className="text-gray-500">
                            Added by {location.addedBy} on {new Date(location.addedAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                      {duplicate.locations.length > 3 && (
                        <div className="text-sm text-gray-500">
                          +{duplicate.locations.length - 3} more
                        </div>
                      )}
                    </div>
                  </td>
                )}
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleResolveDuplicate(duplicate.email, 'keep')}
                      disabled={actionLoading === duplicate.email}
                      className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded text-xs hover:bg-green-200 disabled:opacity-50"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Keep
                    </button>
                    <button
                      onClick={() => handleResolveDuplicate(duplicate.email, 'remove')}
                      disabled={actionLoading === duplicate.email}
                      className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 rounded text-xs hover:bg-red-200 disabled:opacity-50"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredDuplicates.length === 0 && (
          <div className="text-center py-12">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No duplicates found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterByAssignment 
                ? 'Try adjusting your search or filter criteria.'
                : 'All emails are unique.'}
            </p>
          </div>
        )}
      </div>

      {/* Summary */}
      {duplicates.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Duplicate Email Summary</h3>
              <p className="mt-1 text-sm text-yellow-700">
                Found {stats.total} duplicate emails with {stats.totalOccurrences} total occurrences.
                {stats.withoutStudentInfo > 0 && (
                  <span> {stats.withoutStudentInfo} emails don't have associated student records.</span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
