"use client";

import { useState, useEffect, useCallback } from "react";

interface EmailValidatorProps {
  emails: string[];
  onValidationChange: (validEmails: string[], duplicates: string[], invalidEmails: string[]) => void;
  existingEmails?: string[];
  className?: string;
}

interface EmailValidationResult {
  id: string;
  email: string;
  isValid: boolean;
  isDuplicate: boolean;
  isExisting: boolean;
  error?: string;
  isEditing?: boolean;
}

export default function EmailValidator({ 
  emails, 
  onValidationChange, 
  existingEmails = [],
  className = ""
}: EmailValidatorProps) {
  const [validationResults, setValidationResults] = useState<EmailValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [hasValidated, setHasValidated] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  const validateEmail = useCallback((email: string): boolean => {
    // More comprehensive email validation regex
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email.trim()) && email.trim().length > 0;
  }, []);

  const validateEmails = useCallback(async (emailList: string[]) => {
    // Filter out empty strings and whitespace-only strings
    const nonEmptyEmails = emailList.filter(email => email.trim().length > 0);
    
    if (nonEmptyEmails.length === 0) {
      setValidationResults([]);
      onValidationChange([], [], []);
      setHasValidated(false);
      return;
    }

    setIsValidating(true);
    
    // Simulate validation delay for better UX
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const results: EmailValidationResult[] = [];
    const emailCounts = new Map<string, number>();
    const normalizedExistingEmails = existingEmails.map(email => email.toLowerCase());
    
    // Count occurrences of each email
    nonEmptyEmails.forEach(email => {
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail.length > 0) {
        emailCounts.set(normalizedEmail, (emailCounts.get(normalizedEmail) || 0) + 1);
      }
    });
    
    // Validate each email
    nonEmptyEmails.forEach((email, index) => {
      const trimmedEmail = email.trim();
      const normalizedEmail = trimmedEmail.toLowerCase();
      
      // Skip empty lines
      if (trimmedEmail.length === 0) {
        return;
      }
      
      const isValid = validateEmail(trimmedEmail);
      const isDuplicate = (emailCounts.get(normalizedEmail) || 0) > 1;
      const isExisting = normalizedExistingEmails.includes(normalizedEmail);
      
      let error: string | undefined;
      
      if (!isValid) {
        error = "Invalid email format";
      } else if (isDuplicate) {
        error = "Duplicate email";
      } else if (isExisting) {
        error = "Email already exists in system";
      }
      
      results.push({
        id: `${trimmedEmail}-${index}`,
        email: trimmedEmail,
        isValid,
        isDuplicate,
        isExisting,
        error
      });
    });
    
    setValidationResults(results);
    setIsValidating(false);
    setHasValidated(true);
    
    // Categorize results for callback
    const validEmails = results
      .filter(r => r.isValid && !r.isDuplicate && !r.isExisting)
      .map(r => r.email);
    
    const duplicates = results
      .filter(r => r.isDuplicate)
      .map(r => r.email);
    
    const invalidEmails = results
      .filter(r => !r.isValid || r.isExisting)
      .map(r => r.email);
    
    onValidationChange(validEmails, duplicates, invalidEmails);
  }, [validateEmail, existingEmails, onValidationChange]);

  const handleManualValidation = () => {
    validateEmails(emails);
  };

  const handleEditEmail = (result: EmailValidationResult) => {
    setEditingId(result.id);
    setEditValue(result.email);
  };

  const handleSaveEdit = (resultId: string) => {
    const updatedResults = validationResults.map(result => {
      if (result.id === resultId) {
        const trimmedEmail = editValue.trim();
        const isValid = validateEmail(trimmedEmail);
        const isDuplicate = validationResults.some(r => 
          r.id !== resultId && r.email.toLowerCase() === trimmedEmail.toLowerCase()
        );
        const isExisting = existingEmails.includes(trimmedEmail.toLowerCase());
        
        let error: string | undefined;
        if (!isValid) {
          error = "Invalid email format";
        } else if (isDuplicate) {
          error = "Duplicate email";
        } else if (isExisting) {
          error = "Email already exists in system";
        }

        return {
          ...result,
          email: trimmedEmail,
          isValid,
          isDuplicate,
          isExisting,
          error
        };
      }
      return result;
    });

    setValidationResults(updatedResults);
    setEditingId(null);
    setEditValue("");

    // Update parent component
    const validEmails = updatedResults
      .filter(r => r.isValid && !r.isDuplicate && !r.isExisting)
      .map(r => r.email);
    
    const duplicates = updatedResults
      .filter(r => r.isDuplicate)
      .map(r => r.email);
    
    const invalidEmails = updatedResults
      .filter(r => !r.isValid || r.isExisting)
      .map(r => r.email);
    
    onValidationChange(validEmails, duplicates, invalidEmails);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const handleDeleteEmail = (resultId: string) => {
    const updatedResults = validationResults.filter(result => result.id !== resultId);
    setValidationResults(updatedResults);

    // Update parent component
    const validEmails = updatedResults
      .filter(r => r.isValid && !r.isDuplicate && !r.isExisting)
      .map(r => r.email);
    
    const duplicates = updatedResults
      .filter(r => r.isDuplicate)
      .map(r => r.email);
    
    const invalidEmails = updatedResults
      .filter(r => !r.isValid || r.isExisting)
      .map(r => r.email);
    
    onValidationChange(validEmails, duplicates, invalidEmails);
  };

  const getStatusIcon = (result: EmailValidationResult) => {
    if (result.isValid && !result.isDuplicate && !result.isExisting) {
      return "✅";
    } else if (result.isDuplicate) {
      return "🔄";
    } else if (result.isExisting) {
      return "⚠️";
    } else {
      return "❌";
    }
  };

  const getStatusColor = (result: EmailValidationResult) => {
    if (result.isValid && !result.isDuplicate && !result.isExisting) {
      return "text-green-600";
    } else if (result.isDuplicate) {
      return "text-orange-600";
    } else if (result.isExisting) {
      return "text-yellow-600";
    } else {
      return "text-red-600";
    }
  };

  const getStatusText = (result: EmailValidationResult) => {
    if (result.isValid && !result.isDuplicate && !result.isExisting) {
      return "Valid";
    } else if (result.isDuplicate) {
      return "Duplicate";
    } else if (result.isExisting) {
      return "Already exists";
    } else {
      return "Invalid";
    }
  };

  // Don't render anything if no emails
  if (emails.length === 0) {
    return null;
  }

  const validCount = validationResults.filter(r => r.isValid && !r.isDuplicate && !r.isExisting).length;
  const duplicateCount = validationResults.filter(r => r.isDuplicate).length;
  const existingCount = validationResults.filter(r => r.isExisting).length;
  const invalidCount = validationResults.filter(r => !r.isValid).length;

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Email Validation</h3>
        <div className="flex items-center space-x-3">
          {isValidating && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span>Validating emails...</span>
            </div>
          )}
          <button
            onClick={handleManualValidation}
            className="btn btn-primary btn-sm"
            disabled={emails.length === 0 || isValidating}
          >
            {isValidating ? "Validating..." : "🔍 Validate Emails"}
          </button>
        </div>
      </div>
      
      {/* Show message if no validation has been performed yet */}
      {!hasValidated && !isValidating && (
        <div className="card">
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📧</div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Ready to Validate</h4>
            <p className="text-gray-600 mb-4">
              You have {emails.length} email(s) ready for validation. Click the "Validate Emails" button above to start the validation process.
            </p>
            <div className="text-sm text-gray-500">
              The validation will check for:
              <ul className="mt-2 space-y-1">
                <li>• Valid email format</li>
                <li>• Duplicate emails in the list</li>
                <li>• Emails already existing in the system</li>
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* Validation Summary - Only show after validation */}
      {hasValidated && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="validation-card valid">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <span className="text-2xl">✅</span>
              </div>
              <div>
                <div className="text-sm font-medium text-green-800">Valid</div>
                <div className="text-2xl font-bold text-green-900">{validCount}</div>
              </div>
            </div>
          </div>
          
          <div className="validation-card duplicate">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <span className="text-2xl">🔄</span>
              </div>
              <div>
                <div className="text-sm font-medium text-orange-800">Duplicates</div>
                <div className="text-2xl font-bold text-orange-900">{duplicateCount}</div>
              </div>
            </div>
          </div>
          
          <div className="validation-card existing">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <span className="text-2xl">⚠️</span>
              </div>
              <div>
                <div className="text-sm font-medium text-yellow-800">Existing</div>
                <div className="text-2xl font-bold text-yellow-900">{existingCount}</div>
              </div>
            </div>
          </div>
          
          <div className="validation-card invalid">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <span className="text-2xl">❌</span>
              </div>
              <div>
                <div className="text-sm font-medium text-red-800">Invalid</div>
                <div className="text-2xl font-bold text-red-900">{invalidCount}</div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Email Table - Only show after validation */}
      {hasValidated && validationResults.length > 0 && (
        <div className="card">
                      <div className="px-4 py-3 border-b border-gray-200 bg-gray-100">
            <h4 className="text-sm font-medium text-gray-900">Email Details</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
                              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email Address
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {validationResults.map((result) => (
                                      <tr key={result.id} className="hover:bg-gray-100">
                    <td className="px-4 py-3">
                      <span className="text-lg">{getStatusIcon(result)}</span>
                    </td>
                    <td className="px-4 py-3">
                      {editingId === result.id ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="input text-sm"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveEdit(result.id);
                            }
                          }}
                          autoFocus
                        />
                      ) : (
                        <div className="text-sm font-medium text-gray-900">{result.email}</div>
                      )}
                      {result.error && (
                        <div className="text-xs text-red-500 mt-1">{result.error}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(result)}`}>
                        {getStatusText(result)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        {editingId === result.id ? (
                          <>
                            <button
                              onClick={() => handleSaveEdit(result.id)}
                              className="text-green-600 hover:text-green-800 text-sm"
                            >
                              ✅ Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="text-gray-600 hover:text-gray-800 text-sm"
                            >
                              ❌ Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEditEmail(result)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDeleteEmail(result.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              🗑️ Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Summary Line - Only show after validation */}
      {hasValidated && (
                        <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-100 px-4 py-3 rounded-lg">
          <div>
            Total emails: <span className="font-medium">{emails.filter(e => e.trim().length > 0).length}</span> | 
            Valid: <span className="font-medium text-green-600">{validCount}</span> | 
            Issues: <span className="font-medium text-red-600">{duplicateCount + existingCount + invalidCount}</span>
          </div>
          {duplicateCount > 0 && (
            <div className="text-orange-600 flex items-center space-x-1">
              <span>💡</span>
              <span>Duplicates will be removed</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 