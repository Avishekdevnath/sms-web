import { IBatch, IUser, ICourseOffering, ISemester, ICourse } from '@/models';

// Type guards for populated objects
export function isPopulatedBatch(obj: any): obj is IBatch {
  return obj && typeof obj === 'object' && '_id' in obj && 'code' in obj && 'title' in obj;
}

export function isPopulatedUser(obj: any): obj is IUser {
  return obj && typeof obj === 'object' && '_id' in obj && 'email' in obj && 'name' in obj;
}

export function isPopulatedCourseOffering(obj: any): obj is ICourseOffering {
  return obj && typeof obj === 'object' && '_id' in obj && 'courseId' in obj;
}

export function isPopulatedSemester(obj: any): obj is ISemester {
  return obj && typeof obj === 'object' && '_id' in obj && 'number' in obj && 'batchId' in obj;
}

export function isPopulatedCourse(obj: any): obj is ICourse {
  return obj && typeof obj === 'object' && '_id' in obj && 'title' in obj && 'code' in obj;
}

// Safe extraction functions
export function safeExtractBatchId(batchId: any): string {
  if (isPopulatedBatch(batchId)) {
    return batchId._id;
  }
  return batchId as string;
}

export function safeExtractBatchCode(batchId: any): string {
  if (isPopulatedBatch(batchId)) {
    return batchId.code;
  }
  return '';
}

export function safeExtractBatchTitle(batchId: any): string {
  if (isPopulatedBatch(batchId)) {
    return batchId.title;
  }
  return '';
}

export function safeExtractUserId(userId: any): string {
  if (isPopulatedUser(userId)) {
    return userId._id;
  }
  return userId as string;
}

export function safeExtractUserName(userId: any): string {
  if (isPopulatedUser(userId)) {
    return userId.name;
  }
  return '';
}

export function safeExtractUserEmail(userId: any): string {
  if (isPopulatedUser(userId)) {
    return userId.email;
  }
  return '';
}

export function safeExtractCourseOfferingId(courseOfferingId: any): string {
  if (isPopulatedCourseOffering(courseOfferingId)) {
    return courseOfferingId._id;
  }
  return courseOfferingId as string;
}

export function safeExtractSemesterId(semesterId: any): string {
  if (isPopulatedSemester(semesterId)) {
    return semesterId._id;
  }
  return semesterId as string;
}

export function safeExtractSemesterNumber(semesterId: any): number {
  if (isPopulatedSemester(semesterId)) {
    return semesterId.number;
  }
  return 0;
}

export function safeExtractCourseId(courseId: any): string {
  if (isPopulatedCourse(courseId)) {
    return courseId._id;
  }
  return courseId as string;
}

export function safeExtractCourseTitle(courseId: any): string {
  if (isPopulatedCourse(courseId)) {
    return courseId.title;
  }
  return '';
}

export function safeExtractCourseCode(courseId: any): string {
  if (isPopulatedCourse(courseId)) {
    return courseId.code;
  }
  return '';
}

// Array type guards
export function isPopulatedBatchArray(arr: any[]): arr is IBatch[] {
  return Array.isArray(arr) && arr.every(item => isPopulatedBatch(item));
}

export function isPopulatedUserArray(arr: any[]): arr is IUser[] {
  return Array.isArray(arr) && arr.every(item => isPopulatedUser(item));
}

export function isPopulatedCourseOfferingArray(arr: any[]): arr is ICourseOffering[] {
  return Array.isArray(arr) && arr.every(item => isPopulatedCourseOffering(item));
}

// Utility functions for common operations
export function getBatchDisplayName(batchId: any): string {
  if (isPopulatedBatch(batchId)) {
    return `${batchId.code} - ${batchId.title}`;
  }
  return batchId as string;
}

export function getUserDisplayName(userId: any): string {
  if (isPopulatedUser(userId)) {
    return userId.name;
  }
  return userId as string;
}

export function getCourseDisplayName(courseId: any): string {
  if (isPopulatedCourse(courseId)) {
    return `${courseId.code} - ${courseId.title}`;
  }
  return courseId as string;
}

export function getSemesterDisplayName(semesterId: any): string {
  if (isPopulatedSemester(semesterId)) {
    const batchCode = isPopulatedBatch(semesterId.batchId) ? semesterId.batchId.code : '';
    return `S${semesterId.number}${batchCode ? ` (${batchCode})` : ''}`;
  }
  return semesterId as string;
}

// Validation helpers
export function isValidObjectId(id: any): boolean {
  if (typeof id !== 'string') return false;
  return /^[0-9a-fA-F]{24}$/.test(id);
}

export function isValidEmail(email: any): boolean {
  if (typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidDate(date: any): boolean {
  if (!date) return false;
  const dateObj = new Date(date);
  return !isNaN(dateObj.getTime());
}

// Array utilities
export function uniqueById<T extends { _id: string }>(array: T[]): T[] {
  const seen = new Set();
  return array.filter(item => {
    const duplicate = seen.has(item._id);
    seen.add(item._id);
    return !duplicate;
  });
}

export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const group = String(item[key]);
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

export function sortBy<T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
} 