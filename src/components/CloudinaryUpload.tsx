"use client";

import { useState, useCallback, useRef } from 'react';

interface CloudinaryUploadProps {
  onUploadSuccess: (url: string) => void;
  onUploadError: (error: string) => void;
  className?: string;
  maxSize?: number; // in bytes
  acceptedTypes?: string[];
  placeholder?: string;
}

export default function CloudinaryUpload({
  onUploadSuccess,
  onUploadError,
  className = "",
  maxSize = 5 * 1024 * 1024, // 5MB default
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  placeholder = "Click to select an image or drag and drop"
}: CloudinaryUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadToCloudinary = async (file: File) => {
    try {
      setUploading(true);
      setUploadProgress(0);

      // Validate file type
      if (!acceptedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please upload JPG, PNG, or WebP images.');
      }

      // Validate file size
      if (file.size > maxSize) {
        throw new Error(`File too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB.`);
      }

      // Create form data
      const formData = new FormData();
      formData.append('file', file);

      // Upload to our server-side API
      const response = await fetch('/api/upload/cloudinary', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      setUploadProgress(100);
      
      // Return the secure URL
      onUploadSuccess(data.url);
      
      // Clear preview after successful upload
      setTimeout(() => {
        setPreview(null);
        setUploadProgress(0);
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      onUploadError(error instanceof Error ? error.message : 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (file: File) => {
    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Cloudinary
    uploadToCloudinary(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const removePreview = () => {
    setPreview(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={className}>
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Upload Area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${uploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        {!preview && !uploading && (
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">{placeholder}</p>
              <p className="text-sm text-gray-500 mt-1">
                Supports: JPG, PNG, WebP (max {Math.round(maxSize / 1024 / 1024)}MB) - Uploaded as is
              </p>
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {uploading && (
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">Uploading...</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 mt-1">{uploadProgress}%</p>
            </div>
          </div>
        )}

        {/* Preview */}
        {preview && !uploading && (
          <div className="space-y-4">
            <div className="relative mx-auto w-32 h-32">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removePreview();
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-500">Click to upload a different image</p>
          </div>
        )}
      </div>

      {/* Error Messages */}
      {isDragOver && (
        <p className="text-blue-500 text-sm mt-2">
          Drop your image here to upload
        </p>
      )}
    </div>
  );
} 