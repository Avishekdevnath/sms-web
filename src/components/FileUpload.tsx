"use client";

import { useState, useRef, useCallback } from "react";

interface FileUploadProps {
  onFileProcess: (emails: string[], filename: string) => void;
  onValidationError: (errors: string[]) => void;
  acceptedTypes?: string[];
  maxSize?: number; // in MB
  className?: string;
}

export default function FileUpload({ 
  onFileProcess, 
  onValidationError, 
  acceptedTypes = ['.csv', '.xlsx', '.xls', '.txt'],
  maxSize = 5,
  className = ""
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const processFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    setUploadedFile(file);
    
    try {
      const emails: string[] = [];
      const errors: string[] = [];
      
      if (file.type === 'text/csv' || file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
        // Process CSV/TXT files
        const text = await file.text();
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        lines.forEach((line, index) => {
          const email = line.split(',')[0].trim(); // Assume email is first column
          if (validateEmail(email)) {
            emails.push(email.toLowerCase());
          } else {
            errors.push(`Line ${index + 1}: Invalid email format - ${email}`);
          }
        });
      } else if (file.type.includes('spreadsheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        // For Excel files, we'll show a message to convert to CSV
        errors.push("Excel files detected. Please convert to CSV format or use the text input below.");
        setUploadedFile(null);
        setIsProcessing(false);
        onValidationError(errors);
        return;
      }
      
      if (errors.length > 0) {
        onValidationError(errors);
      }
      
      if (emails.length > 0) {
        onFileProcess(emails, file.name);
      }
      
    } catch (error) {
      onValidationError([`Error processing file: ${error}`]);
    } finally {
      setIsProcessing(false);
    }
  }, [onFileProcess, onValidationError]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      
      // Validate file type
      const isValidType = acceptedTypes.some(type => 
        file.name.toLowerCase().endsWith(type) || file.type.includes(type.replace('.', ''))
      );
      
      if (!isValidType) {
        onValidationError([`Invalid file type. Accepted types: ${acceptedTypes.join(', ')}`]);
        return;
      }
      
      // Validate file size
      if (file.size > maxSize * 1024 * 1024) {
        onValidationError([`File too large. Maximum size: ${maxSize}MB`]);
        return;
      }
      
      processFile(file);
    }
  }, [acceptedTypes, maxSize, processFile, onValidationError]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const removeFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drag & Drop Zone */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
          ${isDragOver 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!isProcessing ? handleClick : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          disabled={isProcessing}
        />
        
        {isProcessing ? (
          <div className="space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-600">Processing file...</p>
          </div>
        ) : uploadedFile ? (
          <div className="space-y-2">
            <div className="text-green-600 text-2xl">✓</div>
            <p className="text-sm text-gray-600">File uploaded: {uploadedFile.name}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeFile();
              }}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Remove file
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-gray-400 text-3xl">📁</div>
            <p className="text-lg font-medium text-gray-700">
              Drop your file here, or click to browse
            </p>
            <p className="text-sm text-gray-500">
              Supports {acceptedTypes.join(', ')} files up to {maxSize}MB
            </p>
            <p className="text-xs text-gray-400 mt-2">
              File should contain one email address per line (CSV/TXT) or first column (Excel)
            </p>
          </div>
        )}
      </div>
      
      {/* File Info */}
      {uploadedFile && (
        <div className="bg-gray-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-green-600">✓</span>
              <span className="text-sm font-medium">{uploadedFile.name}</span>
              <span className="text-xs text-gray-500">
                ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            </div>
            <button
              onClick={removeFile}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 