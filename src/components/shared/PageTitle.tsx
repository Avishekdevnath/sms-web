'use client';

import { useEffect } from 'react';
import { formatPageTitle } from '@/utils/titleUtils';

interface PageTitleProps {
  title: string;
  separator?: string;
}

export default function PageTitle({ title, separator = "|" }: PageTitleProps) {
  useEffect(() => {
    const formattedTitle = formatPageTitle(title, separator);
    document.title = formattedTitle;
    
    // Cleanup function to restore original title when component unmounts
    return () => {
      document.title = "Student Management System | SMS";
    };
  }, [title, separator]);

  return null; // This component doesn't render anything
} 