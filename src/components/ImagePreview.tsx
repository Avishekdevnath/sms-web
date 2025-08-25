"use client";

import { useState } from 'react';

interface ImagePreviewProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallback?: string;
  quality?: 'auto' | 'eco' | 'low' | 'good' | 'best';
  format?: 'auto' | 'webp' | 'jpg' | 'png';
}

export default function ImagePreview({
  src,
  alt,
  width = 500,
  height = 500,
  className = "",
  fallback = "/placeholder-avatar.png",
  quality = "auto",
  format = "auto"
}: ImagePreviewProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Check if it's a Cloudinary URL
  const isCloudinaryUrl = src.includes('cloudinary.com');
  
  // Generate optimized Cloudinary URL
  const getOptimizedUrl = () => {
    if (!isCloudinaryUrl) return src;
    
    // Parse Cloudinary URL
    const urlParts = src.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    
    if (uploadIndex === -1) return src;
    
    // Insert transformations
    const transformations = `w_${width},h_${height},c_fill,g_face,q_${quality},f_${format}`;
    urlParts.splice(uploadIndex + 1, 0, transformations);
    
    return urlParts.join('/');
  };

  const optimizedSrc = getOptimizedUrl();

  return (
    <div className={`relative ${className}`}>
      {imageLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}
      
      <img
        src={imageError ? fallback : optimizedSrc}
        alt={alt}
        className={`w-full h-full object-cover rounded-lg transition-opacity duration-300 ${
          imageLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onLoad={() => setImageLoading(false)}
        onError={() => {
          setImageError(true);
          setImageLoading(false);
        }}
        loading="lazy"
      />
      
      {imageError && (
        <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-gray-500">Image not available</p>
          </div>
        </div>
      )}
    </div>
  );
} 