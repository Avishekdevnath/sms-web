'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthHandler() {
  const router = useRouter();

  useEffect(() => {
    // Listen for unhandled promise rejections that might be JWT errors
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorMessage = event.reason?.message || event.reason?.toString() || '';
      if (errorMessage.includes('JsonWebTokenError') || errorMessage.includes('invalid signature')) {
        // Clear the invalid token
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        // Redirect to login
        router.push('/login');
        event.preventDefault(); // Prevent default error handling
      }
    };

    // Listen for global errors
    const handleGlobalError = (event: ErrorEvent) => {
      const errorMessage = event.error?.message || event.message || '';
      if (errorMessage.includes('JsonWebTokenError') || errorMessage.includes('invalid signature')) {
        // Clear the invalid token
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        // Redirect to login
        router.push('/login');
        event.preventDefault(); // Prevent default error handling
      }
    };

    // Add event listeners
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleGlobalError);

    return () => {
      // Clean up event listeners
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleGlobalError);
    };
  }, [router]);

  return null;
} 