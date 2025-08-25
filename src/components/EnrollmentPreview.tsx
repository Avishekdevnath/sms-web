"use client";

import { useState } from "react";

interface EnrollmentPreviewProps {
  batchId: string;
  batchCode: string;
  validEmails: string[];
  duplicates: string[];
  invalidEmails: string[];
  existingEmails: string[];
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
  className?: string;
}

export default function EnrollmentPreview({
  batchId,
  batchCode,
  validEmails,
  duplicates,
  invalidEmails,
  existingEmails,
  onConfirm,
  onCancel,
  isProcessing = false,
  className = ""
}: EnrollmentPreviewProps) {
  const [showDetails, setShowDetails] = useState(false);

  const totalEmails = validEmails.length + duplicates.length + invalidEmails.length + existingEmails.length;
  const newEnrollments = validEmails.length;
  const skippedEmails = duplicates.length + invalidEmails.length + existingEmails.length;

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Enrollment Preview</h3>
            <p className="text-sm text-gray-600">Review enrollment details before confirming</p>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">Batch: {batchCode}</div>
            <div className="text-xs text-gray-500">ID: {batchId}</div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <span className="text-blue-600 text-lg">📧</span>
              <div>
                <div className="text-sm font-medium text-blue-800">Total Emails</div>
                <div className="text-2xl font-bold text-blue-900">{totalEmails}</div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <span className="text-green-600 text-lg">✅</span>
              <div>
                <div className="text-sm font-medium text-green-800">New Enrollments</div>
                <div className="text-2xl font-bold text-green-900">{newEnrollments}</div>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <span className="text-orange-600 text-lg">🔄</span>
              <div>
                <div className="text-sm font-medium text-orange-800">Duplicates</div>
                <div className="text-2xl font-bold text-orange-900">{duplicates.length}</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-100 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <span className="text-gray-600 text-lg">⏭️</span>
              <div>
                <div className="text-sm font-medium text-gray-800">Skipped</div>
                <div className="text-2xl font-bold text-gray-900">{skippedEmails}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Enrollment Progress</span>
            <span>{newEnrollments} of {totalEmails} emails will be enrolled</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${totalEmails > 0 ? (newEnrollments / totalEmails) * 100 : 0}%` }}
            ></div>
          </div>
        </div>

        {/* Details Toggle */}
        <div className="mb-4">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
          >
            <span>{showDetails ? "▼" : "▶"}</span>
            <span>View detailed breakdown</span>
          </button>
        </div>

        {/* Detailed Breakdown */}
        {showDetails && (
          <div className="space-y-4">
            {/* Valid Emails */}
            {validEmails.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-green-800">✅ Valid Emails ({validEmails.length})</h4>
                  <span className="text-xs text-green-600">Will be enrolled</span>
                </div>
                <div className="max-h-32 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                    {validEmails.map((email, index) => (
                      <div key={index} className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded">
                        {email}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Duplicates */}
            {duplicates.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-orange-800">🔄 Duplicate Emails ({duplicates.length})</h4>
                  <span className="text-xs text-orange-600">Will be skipped</span>
                </div>
                <div className="max-h-32 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                    {duplicates.map((email, index) => (
                      <div key={index} className="text-xs text-orange-700 bg-orange-100 px-2 py-1 rounded">
                        {email}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Invalid Emails */}
            {invalidEmails.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-red-800">❌ Invalid Emails ({invalidEmails.length})</h4>
                  <span className="text-xs text-red-600">Will be skipped</span>
                </div>
                <div className="max-h-32 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                    {invalidEmails.map((email, index) => (
                      <div key={index} className="text-xs text-red-700 bg-red-100 px-2 py-1 rounded">
                        {email}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Existing Emails */}
            {existingEmails.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-yellow-800">⚠️ Existing Emails ({existingEmails.length})</h4>
                  <span className="text-xs text-yellow-600">Already in system</span>
                </div>
                <div className="max-h-32 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                    {existingEmails.map((email, index) => (
                      <div key={index} className="text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
                        {email}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* What Happens Next */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <h4 className="text-sm font-medium text-blue-800 mb-2">📋 What happens next?</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• {newEnrollments} new student enrollment(s) will be created</li>
            <li>• Students will be added to batch "{batchCode}"</li>
            <li>• Enrollment status will be set to "Pending"</li>
            <li>• You can approve enrollments from the Pending tab</li>
            <li>• After approval, invitation emails will be sent</li>
          </ul>
        </div>
      </div>

      {/* Action Buttons */}
                  <div className="px-6 py-4 border-t border-gray-200 bg-gray-100 rounded-b-lg">
        <div className="flex items-center justify-between">
          <button
            onClick={onCancel}
            disabled={isProcessing}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          
          <div className="flex items-center space-x-4">
            {isProcessing && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span>Processing...</span>
              </div>
            )}
            
            <button
              onClick={onConfirm}
              disabled={isProcessing || newEnrollments === 0}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? "Enrolling..." : `Enroll ${newEnrollments} Student${newEnrollments !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 