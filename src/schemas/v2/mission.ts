import { z } from 'zod';

// ✅ V2 MISSION VALIDATION SCHEMA
// Zod validation for MissionV2 model

export const createMissionV2Schema = z.object({
  code: z.string()
    .regex(/^MISSION-\d+$/, 'Mission code must be in format MISSION-XXX')
    .optional(), // Make code optional - system will generate if not provided
  title: z.string()
    .min(1, 'Mission title is required')
    .max(100, 'Mission title must be less than 100 characters'),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  batchId: z.string()
    .min(1, 'Batch ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid batch ID format'),
  startDate: z.union([
    z.date(),
    z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid start date format')
  ]).optional(),
  endDate: z.union([
    z.date(),
    z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid end date format')
  ]).optional(),
  maxStudents: z.number()
    .min(1, 'Maximum students must be at least 1')
    .optional(), // Remove artificial 1000 limit
  requirements: z.array(z.string())
    .max(20, 'Cannot have more than 20 requirements')
    .optional(),
  rewards: z.array(z.string())
    .max(20, 'Cannot have more than 20 rewards')
    .optional(),
  courses: z.array(z.object({
    courseOfferingId: z.string()
      .min(1, 'Course offering ID is required')
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid course offering ID format'),
    weight: z.number()
      .min(0, 'Weight must be at least 0')
      .max(100, 'Weight cannot exceed 100'),
    requiredAssignments: z.array(z.string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid assignment ID format')),
    minProgress: z.number()
      .min(0, 'Minimum progress must be at least 0')
      .max(100, 'Minimum progress cannot exceed 100')
      .default(70)
  }))
    .max(50, 'Cannot have more than 50 courses')
    .optional()
}).refine((data) => {
  // Validate that endDate is after startDate if both are provided
  if (data.startDate && data.endDate) {
    return data.endDate > data.startDate;
  }
  return true;
}, {
  message: 'End date must be after start date',
  path: ['endDate']
}).refine((data) => {
  // Validate that course weights sum to 100 if courses are provided
  if (data.courses && data.courses.length > 0) {
    const totalWeight = data.courses.reduce((sum, course) => sum + course.weight, 0);
    return Math.abs(totalWeight - 100) < 0.01; // Allow for floating point precision
  }
  return true;
}, {
  message: 'Course weights must sum to 100%',
  path: ['courses']
});

export const updateMissionV2Schema = createMissionV2Schema.partial().extend({
  id: z.string()
    .min(1, 'Mission ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid mission ID format'),
  status: z.enum(['draft', 'active', 'paused', 'completed', 'archived'])
    .optional()
});

// Simple schema for status-only updates
export const updateMissionStatusV2Schema = z.object({
  status: z.enum(['draft', 'active', 'paused', 'completed', 'archived'], {
    required_error: "Status is required",
    invalid_type_error: "Status must be one of: draft, active, paused, completed, archived"
  })
});

export const missionQueryV2Schema = z.object({
  page: z.coerce.number()
    .min(1, 'Page must be at least 1')
    .default(1),
  limit: z.coerce.number()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(10),
  sortBy: z.enum(['code', 'title', 'startDate', 'endDate', 'status', 'totalStudents', 'totalMentors', 'totalGroups', 'createdAt'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc'])
    .default('desc'),
  status: z.enum(['draft', 'active', 'paused', 'completed', 'archived'])
    .optional(),
  batchId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid batch ID format')
    .optional(),
  code: z.string()
    .optional(),
  title: z.string()
    .optional(),
  startDate: z.coerce.date()
    .optional(),
  endDate: z.coerce.date()
    .optional(),
  createdBy: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format')
    .optional()
});

export const missionIdParamV2Schema = z.object({
  id: z.string()
    .min(1, 'Mission ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid mission ID format')
});

// ✅ EXPORT TYPES
export type CreateMissionV2Input = z.infer<typeof createMissionV2Schema>;
export type UpdateMissionV2Input = z.infer<typeof updateMissionV2Schema>;
export type UpdateMissionStatusV2Input = z.infer<typeof updateMissionStatusV2Schema>;
export type MissionQueryV2Input = z.infer<typeof missionQueryV2Schema>;
export type MissionIdParamV2Input = z.infer<typeof missionIdParamV2Schema>;
