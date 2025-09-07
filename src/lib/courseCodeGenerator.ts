import { Course } from "@/models/Course";

/**
 * Generates the next course code for a specific semester
 * Format: CS101 (Semester 1), CS201 (Semester 2), CS301 (Semester 3)
 * 
 * @param semesterNumber - The semester number (1, 2, or 3)
 * @returns Promise<string> - The next available course code
 */
export async function generateNextCourseCode(semesterNumber: number): Promise<string> {
  const prefix = 'CS';
  const semesterPrefix = semesterNumber * 100; // 100, 200, 300
  
  // Find the highest course code for this semester
  const lastCourse = await Course.findOne({
    code: { $regex: `^${prefix}${semesterPrefix}\\d{2}$` }
  }).sort({ code: -1 }).select('code').lean();
  
  let nextNumber = 1;
  if (lastCourse?.code) {
    const courseNumber = parseInt(lastCourse.code.slice(-2));
    nextNumber = courseNumber + 1;
  }
  
  // Ensure the number doesn't exceed 99 for each semester
  if (nextNumber > 99) {
    throw new Error(`Maximum course limit reached for semester ${semesterNumber}`);
  }
  
  return `${prefix}${semesterPrefix + nextNumber}`;
}

/**
 * Generates a course code for a specific position in a semester
 * Useful for creating default courses
 * 
 * @param semesterNumber - The semester number (1, 2, or 3)
 * @param position - The position in the semester (1, 2, 3, etc.)
 * @returns string - The course code
 */
export function generateCourseCodeForPosition(semesterNumber: number, position: number): string {
  const prefix = 'CS';
  const semesterPrefix = semesterNumber * 100;
  const courseNumber = position;
  
  if (courseNumber < 1 || courseNumber > 99) {
    throw new Error('Course position must be between 1 and 99');
  }
  
  return `${prefix}${semesterPrefix + courseNumber}`;
}

/**
 * Validates if a course code follows the semester-based pattern
 * 
 * @param code - The course code to validate
 * @returns boolean - True if valid, false otherwise
 */
export function isValidCourseCode(code: string): boolean {
  const pattern = /^CS[123]\d{2}$/;
  return pattern.test(code);
}

/**
 * Extracts semester number from a course code
 * 
 * @param code - The course code (e.g., CS101, CS201, CS301)
 * @returns number - The semester number (1, 2, or 3)
 */
export function getSemesterFromCode(code: string): number {
  if (!isValidCourseCode(code)) {
    throw new Error('Invalid course code format');
  }
  
  const semesterDigit = parseInt(code.charAt(2));
  return semesterDigit;
}

/**
 * Generates a simple unique course code when no semester is specified
 * Format: CS001, CS002, CS003, etc.
 * 
 * @returns Promise<string> - The next available simple course code
 */
export async function generateSimpleCourseCode(): Promise<string> {
  const prefix = 'CS';
  
  // Find the highest simple course code
  const lastCourse = await Course.findOne({
    code: { $regex: `^${prefix}\\d{3}$` }
  }).sort({ code: -1 }).select('code').lean();
  
  let nextNumber = 1;
  if (lastCourse?.code) {
    const courseNumber = parseInt(lastCourse.code.slice(-3));
    nextNumber = courseNumber + 1;
  }
  
  // Ensure the number doesn't exceed 999
  if (nextNumber > 999) {
    throw new Error('Maximum simple course limit reached');
  }
  
  // Pad with leading zeros
  const paddedNumber = nextNumber.toString().padStart(3, '0');
  return `${prefix}${paddedNumber}`;
}
