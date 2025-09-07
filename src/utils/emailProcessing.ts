import { Types } from "mongoose";

export interface EmailProcessingResult {
  validEmails: string[];
  invalidEmails: string[];
  duplicateEmails: string[];
  cleanedEmails: string[];
  processingStats: {
    total: number;
    valid: number;
    invalid: number;
    duplicates: number;
    new: number;
  };
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingEmail?: {
    email: string;
    addedAt: Date;
    addedBy: Types.ObjectId;
  };
}

/**
 * Validates email format using a comprehensive regex
 */
export function validateEmailFormat(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
}

/**
 * Cleans and normalizes email addresses
 */
export function cleanEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Processes a list of emails and returns validation results
 */
export function processEmailList(
  emailList: string[],
  existingEmails: string[] = []
): EmailProcessingResult {
  const validEmails: string[] = [];
  const invalidEmails: string[] = [];
  const duplicateEmails: string[] = [];
  const cleanedEmails: string[] = [];
  
  // Clean and validate each email
  for (const email of emailList) {
    const cleanedEmail = cleanEmail(email);
    
    if (!cleanedEmail) {
      continue; // Skip empty emails
    }
    
    cleanedEmails.push(cleanedEmail);
    
    if (!validateEmailFormat(cleanedEmail)) {
      invalidEmails.push(email);
      continue;
    }
    
    // Check for duplicates within the submission
    if (validEmails.includes(cleanedEmail)) {
      duplicateEmails.push(email);
      continue;
    }
    
    // Check for duplicates with existing emails
    if (existingEmails.includes(cleanedEmail)) {
      duplicateEmails.push(email);
      continue;
    }
    
    validEmails.push(cleanedEmail);
  }
  
  const processingStats = {
    total: emailList.length,
    valid: validEmails.length,
    invalid: invalidEmails.length,
    duplicates: duplicateEmails.length,
    new: validEmails.length
  };
  
  return {
    validEmails,
    invalidEmails,
    duplicateEmails,
    cleanedEmails,
    processingStats
  };
}

/**
 * Checks if an email already exists in the assignment
 */
export function checkEmailDuplicate(
  email: string,
  completedEmails: Array<{ email: string; addedAt: Date; addedBy: Types.ObjectId }>
): DuplicateCheckResult {
  const cleanedEmail = cleanEmail(email);
  
  const existingEmail = completedEmails.find(
    completed => cleanEmail(completed.email) === cleanedEmail
  );
  
  return {
    isDuplicate: !!existingEmail,
    existingEmail: existingEmail || undefined
  };
}

/**
 * Extracts emails from text (handles various formats)
 */
export function extractEmailsFromText(text: string): string[] {
  // Split by common delimiters
  const emailRegex = /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*/g;
  
  const matches = text.match(emailRegex) || [];
  return matches.map(email => cleanEmail(email));
}

/**
 * Formats email list for display
 */
export function formatEmailList(emails: string[], maxDisplay: number = 10): string {
  if (emails.length === 0) return 'No emails';
  if (emails.length <= maxDisplay) return emails.join(', ');
  
  const displayed = emails.slice(0, maxDisplay);
  const remaining = emails.length - maxDisplay;
  
  return `${displayed.join(', ')} and ${remaining} more...`;
}

/**
 * Generates email processing summary
 */
export function generateProcessingSummary(result: EmailProcessingResult): string {
  const { processingStats } = result;
  
  let summary = `Processed ${processingStats.total} emails: `;
  const parts: string[] = [];
  
  if (processingStats.new > 0) {
    parts.push(`${processingStats.new} new`);
  }
  if (processingStats.duplicates > 0) {
    parts.push(`${processingStats.duplicates} duplicates`);
  }
  if (processingStats.invalid > 0) {
    parts.push(`${processingStats.invalid} invalid`);
  }
  
  return summary + parts.join(', ');
}

/**
 * Validates email submission constraints
 */
export function validateEmailSubmission(
  emailList: string[],
  maxEmailsPerSubmission: number = 1000
): { isValid: boolean; error?: string } {
  if (!emailList || emailList.length === 0) {
    return { isValid: false, error: 'Email list cannot be empty' };
  }
  
  if (emailList.length > maxEmailsPerSubmission) {
    return { 
      isValid: false, 
      error: `Too many emails. Maximum ${maxEmailsPerSubmission} emails per submission.` 
    };
  }
  
  return { isValid: true };
}
