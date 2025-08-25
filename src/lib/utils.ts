/**
 * Safely extracts the name from a populated MongoDB object or string
 * @param field - The field that could be an object with a name property or a string
 * @param fallback - Fallback text if no name is found
 * @returns The name string or fallback
 */
export function safeExtractName(field: any, fallback: string = 'Unknown'): string {
  if (!field) return fallback;
  
  if (typeof field === 'string') {
    return field;
  }
  
  if (typeof field === 'object' && field.name) {
    return field.name;
  }
  
  return fallback;
}

/**
 * Safely extracts the ID from a populated MongoDB object or string
 * @param field - The field that could be an object with an _id property or a string
 * @param fallback - Fallback text if no ID is found
 * @returns The ID string or fallback
 */
export function safeExtractId(field: any, fallback: string = ''): string {
  if (!field) return fallback;
  
  if (typeof field === 'string') {
    return field;
  }
  
  if (typeof field === 'object' && field._id) {
    return String(field._id);
  }
  
  return fallback;
}

/**
 * Safely extracts the email from a populated MongoDB object or string
 * @param field - The field that could be an object with an email property or a string
 * @param fallback - Fallback text if no email is found
 * @returns The email string or fallback
 */
export function safeExtractEmail(field: any, fallback: string = ''): string {
  if (!field) return fallback;
  
  if (typeof field === 'string') {
    return field;
  }
  
  if (typeof field === 'object' && field.email) {
    return field.email;
  }
  
  return fallback;
}

/**
 * Formats a date string or Date object to a readable format
 * @param date - The date to format
 * @param options - Intl.DateTimeFormatOptions for formatting
 * @returns Formatted date string
 */
export function formatDate(date: any, options: Intl.DateTimeFormatOptions = {}): string {
  if (!date) return 'N/A';
  
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'Invalid Date';
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options
    };
    
    return dateObj.toLocaleDateString(undefined, defaultOptions);
  } catch (error) {
    return 'Invalid Date';
  }
}

/**
 * Formats a date and time string or Date object
 * @param date - The date to format
 * @returns Formatted date and time string
 */
export function formatDateTime(date: any): string {
  return formatDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Generates a secure invitation token
 * @returns A random 32-character hexadecimal string
 */
export function generateInvitationToken(): string {
  return Array.from({ length: 32 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

/**
 * Generates a temporary username for invited students
 * @param email - The student's email
 * @returns A temporary username
 */
export function generateTemporaryUsername(email: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 5);
  return `temp_${timestamp}_${random}`;
}

/**
 * Generates a temporary password for invited students
 * @returns A random 8-character alphanumeric string
 */
export function generateTemporaryPassword(): string {
  return Math.random().toString(36).substr(2, 8);
}

/**
 * Truncates text to a specified length
 * @param text - The text to truncate
 * @param maxLength - Maximum length before truncation
 * @param suffix - Suffix to add when truncated (default: '...')
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Capitalizes the first letter of a string
 * @param text - The text to capitalize
 * @returns Capitalized text
 */
export function capitalize(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Converts a string to title case
 * @param text - The text to convert
 * @returns Title case text
 */
export function toTitleCase(text: string): string {
  if (!text) return '';
  return text.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

/**
 * Generates a random string of specified length
 * @param length - Length of the random string
 * @returns Random string
 */
export function generateRandomString(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Debounces a function call
 * @param func - The function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttles a function call
 * @param func - The function to throttle
 * @param limit - Time limit in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Deep clones an object
 * @param obj - The object to clone
 * @returns Cloned object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as any;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as any;
  if (typeof obj === 'object') {
    const clonedObj = {} as any;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
}

/**
 * Checks if two objects are deeply equal
 * @param obj1 - First object
 * @param obj2 - Second object
 * @returns True if objects are deeply equal
 */
export function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;
  if (obj1 == null || obj2 == null) return false;
  if (typeof obj1 !== typeof obj2) return false;
  
  if (typeof obj1 !== 'object') return obj1 === obj2;
  
  if (obj1 instanceof Date && obj2 instanceof Date) {
    return obj1.getTime() === obj2.getTime();
  }
  
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    if (obj1.length !== obj2.length) return false;
    for (let i = 0; i < obj1.length; i++) {
      if (!deepEqual(obj1[i], obj2[i])) return false;
    }
    return true;
  }
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!deepEqual(obj1[key], obj2[key])) return false;
  }
  
  return true;
} 