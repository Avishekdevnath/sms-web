import { z } from 'zod';

// ✅ V2 MISSION STUDENT VALIDATION SCHEMA
// Zod validation for MissionStudentV2 model with dual-level status

export const createMissionStudentV2Schema = z.object({
  studentId: z.string()
    .min(1, 'Student ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid student ID format'),
  missionId: z.string()
    .min(1, 'Mission ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid mission ID format'),
  batchId: z.string()
    .min(1, 'Batch ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid batch ID format'),
  status: z.enum(['active', 'deactive', 'irregular', 'completed', 'dropped', 'on-hold'])
    .default('active'),
  progress: z.number()
    .min(0, 'Progress must be at least 0')
    .max(100, 'Progress cannot exceed 100')
    .default(0),
  isRegular: z.boolean()
    .default(true),
  attendanceRate: z.number()
    .min(0, 'Attendance rate must be at least 0')
    .max(100, 'Attendance rate cannot exceed 100')
    .default(100),
  missionNotes: z.string()
    .max(1000, 'Mission notes must be less than 1000 characters')
    .optional(),
  irregularityReason: z.string()
    .max(500, 'Irregularity reason must be less than 500 characters')
    .optional(),
  deactivationReason: z.string()
    .max(500, 'Deactivation reason must be less than 500 characters')
    .optional(),
  mentorshipGroupId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid mentorship group ID format')
    .optional(),
  // ✅ GROUP-LEVEL STATUS VALIDATION
  groupStatus: z.object({
    status: z.enum(['active', 'deactive', 'irregular', 'on-hold'])
      .default('active'),
    reason: z.string()
      .max(500, 'Group status reason must be less than 500 characters')
      .optional(),
    notes: z.string()
      .max(1000, 'Group status notes must be less than 1000 characters')
      .optional()
  }).optional(),
  // Course progress validation
  courseProgress: z.array(z.object({
    courseOfferingId: z.string()
      .min(1, 'Course offering ID is required')
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid course offering ID format'),
    progress: z.number()
      .min(0, 'Course progress must be at least 0')
      .max(100, 'Course progress cannot exceed 100'),
    completedAssignments: z.array(z.string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid assignment ID format')),
    mentorFeedback: z.string()
      .max(1000, 'Mentor feedback must be less than 1000 characters')
      .optional()
  }))
    .max(50, 'Cannot have more than 50 courses')
    .default([])
});

export const updateMissionStudentV2Schema = createMissionStudentV2Schema.partial().extend({
  id: z.string()
    .min(1, 'Mission student ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid mission student ID format')
});

// ✅ DUAL-LEVEL STATUS UPDATE SCHEMAS
export const updateStudentMissionStatusV2Schema = z.object({
  id: z.string()
    .min(1, 'Mission student ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid mission student ID format'),
  status: z.enum(['active', 'deactive', 'irregular', 'completed', 'dropped', 'on-hold']),
  reason: z.string()
    .max(500, 'Status reason must be less than 500 characters')
    .optional(),
  notes: z.string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional()
});

export const updateStudentGroupStatusV2Schema = z.object({
  id: z.string()
    .min(1, 'Mission student ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid mission student ID format'),
  groupStatus: z.object({
    status: z.enum(['active', 'deactive', 'irregular', 'on-hold']),
    reason: z.string()
      .max(500, 'Group status reason must be less than 500 characters')
      .optional(),
    notes: z.string()
      .max(1000, 'Group status notes must be less than 1000 characters')
      .optional()
  })
});

export const updateProgressV2Schema = z.object({
  id: z.string()
    .min(1, 'Mission student ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid mission student ID format'),
  courseOfferingId: z.string()
    .min(1, 'Course offering ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid course offering ID format'),
  progress: z.number()
    .min(0, 'Progress must be at least 0')
    .max(100, 'Progress cannot exceed 100'),
  completedAssignments: z.array(z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid assignment ID format'))
    .optional(),
  mentorFeedback: z.string()
    .max(1000, 'Mentor feedback must be less than 1000 characters')
    .optional()
});

export const updateAttendanceV2Schema = z.object({
  id: z.string()
    .min(1, 'Mission student ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid mission student ID format'),
  present: z.boolean(),
  notes: z.string()
    .max(500, 'Attendance notes must be less than 500 characters')
    .optional()
});

// ✅ QUERY SCHEMAS
export const missionStudentQueryV2Schema = z.object({
  page: z.coerce.number()
    .min(1, 'Page must be at least 1')
    .default(1),
  limit: z.coerce.number()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(10),
  sortBy: z.enum(['progress', 'attendanceRate', 'startedAt', 'lastActivity', 'status', 'isRegular'])
    .default('startedAt'),
  sortOrder: z.enum(['asc', 'desc'])
    .default('desc'),
  status: z.enum(['active', 'deactive', 'irregular', 'completed', 'dropped', 'on-hold'])
    .optional(),
  missionId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid mission ID format')
    .optional(),
  batchId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid batch ID format')
    .optional(),
  mentorshipGroupId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid mentorship group ID format')
    .optional(),
  isRegular: z.coerce.boolean()
    .optional(),
  attendanceRate: z.object({
    min: z.coerce.number().min(0).max(100),
    max: z.coerce.number().min(0).max(100)
  }).optional(),
  progress: z.object({
    min: z.coerce.number().min(0).max(100),
    max: z.coerce.number().min(0).max(100)
  }).optional()
});

export const missionStudentIdParamV2Schema = z.object({
  id: z.string()
    .min(1, 'Mission student ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid mission student ID format')
});

// ✅ BULK OPERATION SCHEMAS
export const bulkStudentAssignmentV2Schema = z.object({
  studentIds: z.array(z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid student ID format'))
    .min(1, 'At least one student ID is required')
    .max(100, 'Cannot assign more than 100 students at once'),
  missionId: z.string()
    .min(1, 'Mission ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid mission ID format'),
  batchId: z.string()
    .min(1, 'Batch ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid batch ID format'),
  status: z.enum(['active', 'deactive', 'irregular', 'completed', 'dropped', 'on-hold'])
    .default('active'),
  missionNotes: z.string()
    .max(1000, 'Mission notes must be less than 1000 characters')
    .optional()
});

// ✅ EXPORT TYPES
export type CreateMissionStudentV2Input = z.infer<typeof createMissionStudentV2Schema>;
export type UpdateMissionStudentV2Input = z.infer<typeof updateMissionStudentV2Schema>;
export type UpdateStudentMissionStatusV2Input = z.infer<typeof updateStudentMissionStatusV2Schema>;
export type UpdateStudentGroupStatusV2Input = z.infer<typeof updateStudentGroupStatusV2Schema>;
export type UpdateProgressV2Input = z.infer<typeof updateProgressV2Schema>;
export type UpdateAttendanceV2Input = z.infer<typeof updateAttendanceV2Schema>;
export type MissionStudentQueryV2Input = z.infer<typeof missionStudentQueryV2Schema>;
export type MissionStudentIdParamV2Input = z.infer<typeof missionStudentIdParamV2Schema>;
export type BulkStudentAssignmentV2Input = z.infer<typeof bulkStudentAssignmentV2Schema>;
