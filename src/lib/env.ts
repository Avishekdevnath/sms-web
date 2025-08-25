// Server-side environment variable configuration
// This file should only be imported in server-side code (API routes, middleware, etc.)

// Ensure this file is only used on the server side
if (typeof window !== 'undefined') {
  throw new Error('Environment variables can only be accessed on the server side');
}

export function getEnvVar(key: string): string {
  const value = process.env[key];
  
  if (!value) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  
  return value;
}

// These exports are for server-side use only
export const MONGODB_URI = getEnvVar('MONGODB_URI');
export const JWT_SECRET = getEnvVar('JWT_SECRET');

// Password expiry settings (in days)
export const PASSWORD_EXPIRY_DAYS = parseInt(process.env.PASSWORD_EXPIRY_DAYS || '3');
