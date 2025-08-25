import { z } from 'zod';

export const UserCreateSchema = z.object({
  email: z.string().email("Invalid email format"),
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  role: z.enum(['admin', 'developer', 'manager', 'sre', 'mentor', 'student'], {
    required_error: "Role is required",
    invalid_type_error: "Role must be one of: admin, developer, manager, sre, mentor, student"
  }),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  batchId: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const UserUpdateSchema = UserCreateSchema.partial().omit({ password: true }).extend({
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
});

export const UserQuerySchema = z.object({
  role: z.enum(['admin', 'developer', 'manager', 'sre', 'mentor', 'student']).optional(),
  batchId: z.string().optional(),
  isActive: z.boolean().optional(),
  search: z.string().optional(),
  page: z.number().min(1, "Page must be at least 1").optional(),
  limit: z.number().min(1, "Limit must be at least 1").max(100, "Limit must be at most 100").optional(),
  sortBy: z.enum(['name', 'email', 'role', 'createdAt', 'isActive']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const UserBulkCreateSchema = z.object({
  users: z.array(z.object({
    email: z.string().email("Invalid email format"),
    name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
    role: z.enum(['admin', 'developer', 'manager', 'sre', 'mentor', 'student']),
    batchId: z.string().optional(),
  })).min(1, "At least one user is required").max(100, "Maximum 100 users can be created at once"),
});

export const UserPasswordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Password confirmation is required"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const UserPasswordResetSchema = z.object({
  email: z.string().email("Invalid email format"),
});

export const UserProfileUpdateSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50, "First name must be less than 50 characters"),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name must be less than 50 characters"),
  username: z.string().min(3, "Username must be at least 3 characters").max(30, "Username must be less than 30 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 characters").max(15, "Phone number must be less than 15 characters"),
  profilePicture: z.string().url("Invalid profile picture URL").optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  dateOfBirth: z.string().datetime("Invalid date of birth").optional(),
  address: z.string().max(200, "Address must be less than 200 characters").optional(),
  emergencyContact: z.object({
    name: z.string().min(1, "Emergency contact name is required"),
    phone: z.string().min(10, "Emergency contact phone must be at least 10 characters"),
    relationship: z.string().min(1, "Relationship is required"),
  }).optional(),
  academicInfo: z.object({
    previousInstitution: z.string().max(100, "Institution name must be less than 100 characters").optional(),
    graduationYear: z.number().min(1900, "Graduation year must be after 1900").max(new Date().getFullYear(), "Graduation year cannot be in the future").optional(),
    gpa: z.number().min(0, "GPA must be at least 0").max(4, "GPA must be at most 4").optional(),
  }).optional(),
  socialLinks: z.object({
    linkedin: z.string().url("Invalid LinkedIn URL").optional(),
    github: z.string().url("Invalid GitHub URL").optional(),
    portfolio: z.string().url("Invalid portfolio URL").optional(),
  }).optional(),
  skills: z.array(z.string().min(1, "Skill cannot be empty")).optional(),
  interests: z.array(z.string().min(1, "Interest cannot be empty")).optional(),
});

export const UserStatusUpdateSchema = z.object({
  isActive: z.boolean({
    required_error: "Active status is required",
    invalid_type_error: "Active status must be a boolean"
  }),
  reason: z.string().max(200, "Reason must be less than 200 characters").optional(),
});

export const UserRoleUpdateSchema = z.object({
  role: z.enum(['admin', 'developer', 'manager', 'sre', 'mentor', 'student'], {
    required_error: "Role is required",
    invalid_type_error: "Role must be one of: admin, developer, manager, sre, mentor, student"
  }),
});

export const UserBulkStatusUpdateSchema = z.object({
  userIds: z.array(z.string().min(1, "User ID is required")).min(1, "At least one user is required"),
  isActive: z.boolean({
    required_error: "Active status is required",
    invalid_type_error: "Active status must be a boolean"
  }),
  reason: z.string().max(200, "Reason must be less than 200 characters").optional(),
}); 