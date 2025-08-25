/**
 * Utility functions for managing page titles
 */

export const APP_NAME = "Student Management System";
export const APP_SHORT_NAME = "SMS";

/**
 * Formats a page title with the app name
 * @param pageTitle - The specific page title
 * @param separator - Separator between page title and app name (default: "|")
 * @returns Formatted title string
 */
export function formatPageTitle(pageTitle: string, separator: string = "|"): string {
  return `${pageTitle} ${separator} ${APP_NAME}`;
}

/**
 * Formats a page title with the short app name
 * @param pageTitle - The specific page title
 * @param separator - Separator between page title and app name (default: "|")
 * @returns Formatted title string
 */
export function formatPageTitleShort(pageTitle: string, separator: string = "|"): string {
  return `${pageTitle} ${separator} ${APP_SHORT_NAME}`;
}

/**
 * Common page titles used throughout the application
 */
export const PAGE_TITLES = {
  // Auth pages
  LOGIN: "Login",
  REGISTER: "Register",
  FORGOT_PASSWORD: "Forgot Password",
  RESET_PASSWORD: "Reset Password",
  
  // Dashboard pages
  DASHBOARD: "Dashboard",
  ADMIN_DASHBOARD: "Admin Dashboard",
  STUDENT_DASHBOARD: "Student Dashboard",
  MENTOR_DASHBOARD: "Mentor Dashboard",
  MANAGER_DASHBOARD: "Manager Dashboard",
  DEVELOPER_DASHBOARD: "Developer Dashboard",
  SRE_DASHBOARD: "SRE Dashboard",
  
  // Management pages
  MISSIONS: "Mission Management",
  CREATE_MISSION: "Create Mission",
  EDIT_MISSION: "Edit Mission",
  STUDENTS: "Student Management",
  COURSES: "Course Management",
  BATCHES: "Batch Management",
  SEMESTERS: "Semester Management",
  OFFERINGS: "Course Offerings",
  
  // Profile pages
  PROFILE: "Profile",
  EDIT_PROFILE: "Edit Profile",
  COMPLETE_PROFILE: "Complete Profile",
  
  // Utility pages
  SETTINGS: "Settings",
  NOTIFICATIONS: "Notifications",
  HELP: "Help",
  ABOUT: "About",
  
  // Error pages
  NOT_FOUND: "Page Not Found",
  ERROR: "Error",
  UNAUTHORIZED: "Unauthorized",
  
  // Loading states
  LOADING: "Loading",
} as const;

/**
 * Generates metadata for a page
 * @param title - Page title
 * @param description - Page description
 * @param keywords - Additional keywords
 * @returns Metadata object
 */
export function generateMetadata(
  title: string,
  description?: string,
  keywords?: string[]
): {
  title: string;
  description: string;
  keywords: string;
} {
  return {
    title: formatPageTitle(title),
    description: description || `Manage ${title.toLowerCase()} in the Student Management System`,
    keywords: keywords ? [...keywords, "student management", "education"].join(", ") : "student management, education",
  };
} 