'use client';

import { useState } from 'react';

interface ProfilePictureProps {
  src?: string | null;
  alt?: string;
  firstName?: string;
  lastName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-12 h-12 text-base',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-24 h-24 text-3xl'
};

export default function ProfilePicture({ 
  src, 
  alt = 'Profile', 
  firstName = '', 
  lastName = '', 
  size = 'md',
  className = ''
}: ProfilePictureProps) {
  const [imageError, setImageError] = useState(false);
  
  // If no image or image failed to load, show initials
  if (!src || imageError) {
    const initials = firstName && lastName 
      ? `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
      : firstName 
        ? firstName.charAt(0).toUpperCase()
        : '?';
    
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-2 border-white shadow-lg ${className}`}>
        <span className="font-bold text-white">{initials}</span>
      </div>
    );
  }
  
  // Show custom image
  return (
    <img
      src={src}
      alt={alt}
      className={`${sizeClasses[size]} rounded-full object-cover border-2 border-white shadow-lg ${className}`}
      onError={() => setImageError(true)}
    />
  );
}
