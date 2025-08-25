"use client";

import { useState, useEffect } from 'react';
import CloudinaryUpload from '@/components/CloudinaryUpload';

export default function TestUploadPage() {
  const [uploadedUrl, setUploadedUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [configStatus, setConfigStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkConfig = async () => {
      try {
        const response = await fetch('/api/test-cloudinary');
        const data = await response.json();
        setConfigStatus(data);
      } catch (error) {
        setConfigStatus({ success: false, error: 'Failed to check configuration' });
      } finally {
        setLoading(false);
      }
    };

    checkConfig();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Cloudinary Upload Test</h1>
          
          {/* Configuration Status */}
          {configStatus && (
            <div className={`border rounded-lg p-4 mb-6 ${
              configStatus.success && configStatus.config?.allSet 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <h2 className="text-lg font-semibold mb-2">Configuration Status</h2>
              <div className="space-y-1 text-sm">
                <p>Cloud Name: {configStatus.config?.cloudName}</p>
                <p>API Key: {configStatus.config?.apiKey}</p>
                <p>API Secret: {configStatus.config?.apiSecret}</p>
              </div>
              <p className={`mt-2 font-medium ${
                configStatus.success && configStatus.config?.allSet 
                  ? 'text-green-800' 
                  : 'text-red-800'
              }`}>
                {configStatus.message}
              </p>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {uploadedUrl && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800 mb-2">✅ Upload successful!</p>
              <p className="text-sm text-green-700">URL: {uploadedUrl}</p>
              <img 
                src={uploadedUrl} 
                alt="Uploaded" 
                className="mt-2 w-32 h-32 object-cover rounded-lg"
              />
            </div>
          )}

          {configStatus?.success && configStatus?.config?.allSet ? (
            <CloudinaryUpload
              onUploadSuccess={(url) => {
                setUploadedUrl(url);
                setError('');
              }}
              onUploadError={(error) => {
                setError(error);
                setUploadedUrl('');
              }}
              placeholder="Test image upload"
              maxSize={5 * 1024 * 1024} // 5MB
              acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
            />
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <p className="text-gray-500">Please configure Cloudinary environment variables to test uploads</p>
            </div>
          )}

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Test Instructions:</h2>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Click the upload area or drag & drop an image</li>
              <li>• Supported formats: JPG, PNG, WebP</li>
              <li>• Maximum size: 5MB</li>
              <li>• Images will be uploaded as is (no transformations)</li>
              <li>• Check the console for any errors</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 