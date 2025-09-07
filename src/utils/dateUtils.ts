/**
 * Date utility functions for handling MongoDB date formats and formatting
 */

export interface MongoDate {
  $date: string;
}

export interface MongoTimestamp {
  $numberLong: string;
}

export type MongoDateValue = string | Date | MongoDate | MongoTimestamp | null | undefined;

/**
 * Extract date value from MongoDB date formats
 * Handles: string, Date, { $date: string }, { $numberLong: string }
 */
export function extractMongoDate(dateValue: MongoDateValue): Date | null {
  if (!dateValue) return null;
  
  try {
    // If it's already a Date object
    if (dateValue instanceof Date) {
      return dateValue;
    }
    
    // If it's a string, try to parse it
    if (typeof dateValue === 'string') {
      const date = new Date(dateValue);
      return isNaN(date.getTime()) ? null : date;
    }
    
    // If it's an object with $date property (MongoDB date format)
    if (typeof dateValue === 'object' && dateValue !== null && '$date' in dateValue) {
      const mongoDate = dateValue as MongoDate;
      const date = new Date(mongoDate.$date);
      return isNaN(date.getTime()) ? null : date;
    }
    
    // If it's an object with $numberLong property (MongoDB timestamp format)
    if (typeof dateValue === 'object' && dateValue !== null && '$numberLong' in dateValue) {
      const mongoTimestamp = dateValue as MongoTimestamp;
      const timestamp = parseInt(mongoTimestamp.$numberLong);
      if (isNaN(timestamp)) return null;
      return new Date(timestamp);
    }
    
    // If it's any other object, try to stringify and parse
    if (typeof dateValue === 'object') {
      const dateStr = JSON.stringify(dateValue);
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date;
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting MongoDB date:', error, 'Value:', dateValue);
    return null;
  }
}

/**
 * Format date to DD/MM/YY format
 */
export function formatDateShort(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString().slice(-2);
  return `${day}/${month}/${year}`;
}

/**
 * Format date to DD/MM format
 */
export function formatDateMedium(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${day}/${month}`;
}

/**
 * Format date to full readable format
 */
export function formatDateFull(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Format date to ISO string
 */
export function formatDateISO(date: Date): string {
  return date.toISOString();
}

/**
 * Check if a date is valid
 */
export function isValidDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Get relative time (e.g., "2 hours ago", "3 days ago")
 */
export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInDays > 0) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  } else if (diffInHours > 0) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  } else if (diffInMinutes > 0) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
}

/**
 * Main function to format any MongoDB date value
 * @param dateValue - MongoDB date value (string, Date, { $date: string }, { $numberLong: string })
 * @param format - Format type: 'short' (DD/MM/YY), 'medium' (DD/MM), 'full' (DD/MM/YYYY), 'iso', 'relative'
 * @param fallback - Fallback text if date is invalid
 */
export function formatMongoDate(
  dateValue: MongoDateValue, 
  format: 'short' | 'medium' | 'full' | 'iso' | 'relative' = 'short',
  fallback: string = 'N/A'
): string {
  const date = extractMongoDate(dateValue);
  
  if (!date || !isValidDate(date)) {
    return fallback;
  }
  
  switch (format) {
    case 'short':
      return formatDateShort(date);
    case 'medium':
      return formatDateMedium(date);
    case 'full':
      return formatDateFull(date);
    case 'iso':
      return formatDateISO(date);
    case 'relative':
      return getRelativeTime(date);
    default:
      return formatDateShort(date);
  }
}

/**
 * Format date range (start and end dates)
 */
export function formatDateRange(
  startDate: MongoDateValue, 
  endDate: MongoDateValue, 
  format: 'short' | 'medium' | 'full' = 'medium',
  separator: string = ' - ',
  fallback: string = 'No dates'
): string {
  const start = extractMongoDate(startDate);
  const end = extractMongoDate(endDate);
  
  if (!start && !end) {
    return fallback;
  }
  
  if (start && end) {
    const startStr = formatMongoDate(start, format);
    const endStr = formatMongoDate(end, format);
    return `${startStr}${separator}${endStr}`;
  }
  
  if (start) {
    return `From ${formatMongoDate(start, format)}`;
  }
  
  if (end) {
    return `Until ${formatMongoDate(end, format)}`;
  }
  
  return fallback;
}
