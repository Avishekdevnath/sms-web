"use client";

import { useState, useEffect } from "react";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Mail, 
  Users, 
  Clock,
  FileText,
  Download,
  Eye,
  EyeOff
} from "lucide-react";

interface EmailValidationResult {
  email: string;
  isValid: boolean;
  isDuplicate: boolean;
  isAlreadyCompleted: boolean;
  studentInfo?: {
    name: string;
    studentId: string;
    email: string;
  };
  errors: string[];
}

interface EmailValidationPreviewProps {
  emailList: string[];
  existingEmails: string[];
  onValidationComplete: (results: EmailValidationResult[]) => void;
  showPreview?: boolean;
  maxPreviewItems?: number;
}

export default function EmailValidationPreview({
  emailList,
  existingEmails,
  onValidationComplete,
  showPreview = true,
  maxPreviewItems = 50
}: EmailValidationPreviewProps) {
  const [validationResults, setValidationResults] = useState<EmailValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [filter, setFilter] = useState<'all' | 'valid' | 'invalid' | 'duplicates'>('all');

  useEffect(() => {
    if (emailList.length > 0) {
      validateEmails();
    } else {
      setValidationResults([]);
      onValidationComplete([]);
    }
  }, [emailList, existingEmails]);

  const validateEmails = async () => {
    setIsValidating(true);
    
    try {
      const results: EmailValidationResult[] = [];
      
      for (const email of emailList) {
        const result = await validateSingleEmail(email);
        results.push(result);
      }
      
      setValidationResults(results);
      onValidationComplete(results);
    } catch (error) {
      console.error('Error validating emails:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const validateSingleEmail = async (email: string): Promise<EmailValidationResult> => {
    const errors: string[] = [];
    let isValid = true;
    
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('Invalid email format');
      isValid = false;
    }
    
    // Check for duplicates in the current list
    const isDuplicate = emailList.filter(e => e.toLowerCase() === email.toLowerCase()).length > 1;
    if (isDuplicate) {
      errors.push('Duplicate in current list');
    }
    
    // Check if already completed
    const isAlreadyCompleted = existingEmails.some(e => e.toLowerCase() === email.toLowerCase());
    if (isAlreadyCompleted) {
      errors.push('Already completed');
    }
    
    // Try to find student info (mock for now)
    let studentInfo;
    try {
      const response = await fetch(`/api/students/search?email=${encodeURIComponent(email)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          studentInfo = data.data;
        }
      }
    } catch (error) {
      // Student not found or error - this is not a validation error
    }
    
    return {
      email,
      isValid,
      isDuplicate,
      isAlreadyCompleted,
      studentInfo,
      errors
    };
  };

  const getFilteredResults = () => {
    switch (filter) {
      case 'valid':
        return validationResults.filter(r => r.isValid && !r.isDuplicate && !r.isAlreadyCompleted);
      case 'invalid':
        return validationResults.filter(r => !r.isValid);
      case 'duplicates':
        return validationResults.filter(r => r.isDuplicate || r.isAlreadyCompleted);
      default:
        return validationResults;
    }
  };

  const getStats = () => {
    const total = validationResults.length;
    const valid = validationResults.filter(r => r.isValid && !r.isDuplicate && !r.isAlreadyCompleted).length;
    const invalid = validationResults.filter(r => !r.isValid).length;
    const duplicates = validationResults.filter(r => r.isDuplicate || r.isAlreadyCompleted).length;
    
    return { total, valid, invalid, duplicates };
  };

  const stats = getStats();
  const filteredResults = getFilteredResults();
  const displayResults = showPreview ? filteredResults.slice(0, maxPreviewItems) : filteredResults;

  if (isValidating) {
    return (
      <div className="border rounded-lg p-6 bg-white">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          <span className="ml-3 text-gray-600">Validating emails...</span>
        </div>
      </div>
    );
  }

  if (validationResults.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border rounded-lg p-4 bg-white">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total</p>
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
              <p className="text-sm font-medium text-gray-500">Valid</p>
              <p className="text-xl font-bold text-black">{stats.valid}</p>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4 bg-white">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Invalid</p>
              <p className="text-xl font-bold text-black">{stats.invalid}</p>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4 bg-white">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Duplicates</p>
              <p className="text-xl font-bold text-black">{stats.duplicates}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm"
          >
            <option value="all">All ({stats.total})</option>
            <option value="valid">Valid ({stats.valid})</option>
            <option value="invalid">Invalid ({stats.invalid})</option>
            <option value="duplicates">Duplicates ({stats.duplicates})</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
          >
            {showDetails ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
        </div>
      </div>

      {/* Results Table */}
      <div className="border rounded-lg overflow-hidden bg-white">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              {showDetails && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student Info
                </th>
              )}
              {showDetails && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issues
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {displayResults.map((result, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{result.email}</div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    {result.isValid && !result.isDuplicate && !result.isAlreadyCompleted ? (
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    ) : result.isDuplicate || result.isAlreadyCompleted ? (
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500 mr-2" />
                    )}
                    <span className={`text-xs font-medium ${
                      result.isValid && !result.isDuplicate && !result.isAlreadyCompleted
                        ? 'text-green-800'
                        : result.isDuplicate || result.isAlreadyCompleted
                        ? 'text-yellow-800'
                        : 'text-red-800'
                    }`}>
                      {result.isValid && !result.isDuplicate && !result.isAlreadyCompleted
                        ? 'Valid'
                        : result.isDuplicate || result.isAlreadyCompleted
                        ? 'Duplicate'
                        : 'Invalid'}
                    </span>
                  </div>
                </td>
                {showDetails && (
                  <td className="px-4 py-3 whitespace-nowrap">
                    {result.studentInfo ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">{result.studentInfo.name}</div>
                        <div className="text-sm text-gray-500">{result.studentInfo.studentId}</div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">Not found</span>
                    )}
                  </td>
                )}
                {showDetails && (
                  <td className="px-4 py-3">
                    {result.errors.length > 0 ? (
                      <div className="space-y-1">
                        {result.errors.map((error, errorIndex) => (
                          <span
                            key={errorIndex}
                            className="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full mr-1"
                          >
                            {error}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">None</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {filteredResults.length > maxPreviewItems && (
          <div className="px-4 py-3 bg-gray-50 border-t">
            <p className="text-sm text-gray-500">
              Showing {maxPreviewItems} of {filteredResults.length} results
            </p>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-gray-50 border rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Validation Summary</h3>
        <div className="text-sm text-gray-600">
          <p>
            <span className="font-medium">{stats.valid}</span> emails are valid and ready to submit
            {stats.invalid > 0 && (
              <span>, <span className="font-medium text-red-600">{stats.invalid}</span> are invalid</span>
            )}
            {stats.duplicates > 0 && (
              <span>, <span className="font-medium text-yellow-600">{stats.duplicates}</span> are duplicates or already completed</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
