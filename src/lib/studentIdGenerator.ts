import { connectToDatabase } from "./mongodb";
import { User } from "@/models/User";
import { Batch } from "@/models/Batch";

/**
 * Generates a unique student ID in format: B{batchNumber}{sequentialNumber}
 * Example: B001001, B001002, etc.
 */
export async function generateStudentId(batchId: string): Promise<string> {
  await connectToDatabase();
  
  // Get batch information
  const batch = await Batch.findById(batchId).lean();
  if (!batch) {
    throw new Error('Batch not found');
  }
  
  // Extract batch number from batch code (assuming format like "B001", "B002", etc.)
  const batchNumber = batch.code.replace(/[^0-9]/g, '').padStart(3, '0');
  
  // Find the highest student ID for this batch
  const pattern = new RegExp(`^B${batchNumber}\\d{3}$`);
  const lastStudent = await User.findOne({
    studentId: pattern,
    role: 'student'
  }).sort({ studentId: -1 }).lean();
  
  let sequenceNumber = 1;
  if (lastStudent && lastStudent.studentId) {
    const lastSequence = parseInt(lastStudent.studentId.slice(-3));
    sequenceNumber = lastSequence + 1;
  }
  
  // Generate new student ID
  const studentId = `B${batchNumber}${sequenceNumber.toString().padStart(3, '0')}`;
  
  return studentId;
}

/**
 * Generates a unique username based on email
 */
export function generateUsername(email: string): string {
  const baseUsername = email.split('@')[0];
  const timestamp = Date.now().toString().slice(-4);
  return `${baseUsername}${timestamp}`;
}

/**
 * Validates if a username is available
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  await connectToDatabase();
  
  const existingUser = await User.findOne({ username }).lean();
  return !existingUser;
}

/**
 * Generates a unique username that's available
 */
export async function generateUniqueUsername(email: string): Promise<string> {
  let username = generateUsername(email);
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    if (await isUsernameAvailable(username)) {
      return username;
    }
    
    // Try with different suffix
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    username = `${email.split('@')[0]}${randomSuffix}`;
    attempts++;
  }
  
  // Fallback: use timestamp
  const timestamp = Date.now();
  return `${email.split('@')[0]}${timestamp}`;
}

/**
 * Validates phone number format
 */
export function validatePhoneNumber(phone: string): boolean {
  // Basic phone validation - can be enhanced based on requirements
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Formats phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
}

/**
 * Validates email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitizes user input for safe storage
 */
export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}
