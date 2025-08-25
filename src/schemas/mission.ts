import { z } from 'zod';

export const MissionCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  description: z.string().optional(),
  batchId: z.string().min(1, "Batch is required"),
  startDate: z.string().datetime("Invalid start date").optional(),
  endDate: z.string().datetime("Invalid end date").optional(),
  maxStudents: z.number().min(1, "Max students must be at least 1").optional(),
  requirements: z.array(z.string()).optional(),
  rewards: z.array(z.string()).optional(),
  status: z.enum(['draft', 'active', 'paused', 'completed', 'archived']).optional(),
  courses: z.array(z.object({
    courseOfferingId: z.string().min(1, "Course offering is required"),
    weight: z.number().min(0, "Weight must be at least 0").max(100, "Weight must be at most 100"),
    requiredAssignments: z.array(z.string()).optional(),
    minProgress: z.number().min(0, "Min progress must be at least 0").max(100, "Min progress must be at most 100").optional()
  })).min(1, "At least one course is required")
}).refine((data) => {
  // Validate that end date is after start date if both are provided
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) > new Date(data.startDate);
  }
  return true;
}, {
  message: "End date must be after start date",
  path: ["endDate"]
}).refine((data) => {
  // Validate that course weights sum to 100
  const totalWeight = data.courses.reduce((sum, course) => sum + course.weight, 0);
  return Math.abs(totalWeight - 100) < 0.01;
}, {
  message: "Course weights must sum to 100%",
  path: ["courses"]
});

export const MissionUpdateSchema = MissionCreateSchema.partial().refine((data) => {
  // Validate that end date is after start date if both are provided
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) > new Date(data.startDate);
  }
  return true;
}, {
  message: "End date must be after start date",
  path: ["endDate"]
}).refine((data) => {
  // Validate that course weights sum to 100 if courses are provided
  if (data.courses && data.courses.length > 0) {
    const totalWeight = data.courses.reduce((sum, course) => sum + course.weight, 0);
    return Math.abs(totalWeight - 100) < 0.01;
  }
  return true;
}, {
  message: "Course weights must sum to 100%",
  path: ["courses"]
});

export const MissionQuerySchema = z.object({
  batchId: z.string().optional(),
  status: z.enum(['draft', 'active', 'paused', 'completed', 'archived']).optional(),
  createdBy: z.string().optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['title', 'status', 'startDate', 'endDate', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const MissionStatusUpdateSchema = z.object({
  status: z.enum(['draft', 'active', 'paused', 'completed', 'archived'], {
    required_error: "Status is required",
    invalid_type_error: "Status must be one of: draft, active, paused, completed, archived"
  }),
});

export const MissionStudentAddSchema = z.object({
  studentIds: z.array(z.string().min(1, "Student ID is required")).min(1, "At least one student is required"),
  mentorId: z.string().optional(),
});

export const MissionStudentRemoveSchema = z.object({
  studentIds: z.array(z.string().min(1, "Student ID is required")).min(1, "At least one student is required"),
});

export const MissionCourseUpdateSchema = z.object({
  courses: z.array(z.object({
    courseOfferingId: z.string().min(1, "Course offering is required"),
    weight: z.number().min(0, "Weight must be at least 0").max(100, "Weight must be at most 100"),
    requiredAssignments: z.array(z.string()).optional(),
    minProgress: z.number().min(0, "Min progress must be at least 0").max(100, "Min progress must be at most 100").optional()
  })).min(1, "At least one course is required")
}).refine((data) => {
  // Validate that course weights sum to 100
  const totalWeight = data.courses.reduce((sum, course) => sum + course.weight, 0);
  return Math.abs(totalWeight - 100) < 0.01;
}, {
  message: "Course weights must sum to 100%",
  path: ["courses"]
}); 