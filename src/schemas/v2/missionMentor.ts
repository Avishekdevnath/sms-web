import { z } from 'zod';

// ✅ V2 MISSION MENTOR VALIDATION SCHEMA
// Zod validation for MissionMentorV2 model with dual-level status

export const createMissionMentorV2Schema = z.object({
  mentorId: z.string()
    .min(1, 'Mentor ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid mentor ID format'),
  missionId: z.string()
    .min(1, 'Mission ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid mission ID format'),
  batchId: z.string()
    .min(1, 'Batch ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid batch ID format'),
  status: z.enum(['active', 'deactive', 'irregular', 'overloaded', 'unavailable'])
    .default('active'),
  role: z.enum(['mission-lead', 'coordinator', 'advisor', 'supervisor'])
    .default('advisor'),
  specialization: z.array(z.string()
    .min(1, 'Specialization cannot be empty')
    .max(50, 'Specialization must be less than 50 characters'))
    .max(20, 'Cannot have more than 20 specializations')
    .default([]),
  responsibilities: z.array(z.string()
    .min(1, 'Responsibility cannot be empty')
    .max(100, 'Responsibility must be less than 100 characters'))
    .max(20, 'Cannot have more than 20 responsibilities')
    .default([]),
  isRegular: z.boolean()
    .default(true),
  availabilityRate: z.number()
    .min(0, 'Availability rate must be at least 0')
    .max(100, 'Availability rate cannot exceed 100')
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
  maxStudents: z.number()
    .min(1, 'Maximum students must be at least 1')
    .max(100, 'Maximum students cannot exceed 100')
    .default(10),
  // Availability validation
  availability: z.object({
    days: z.array(z.number()
      .min(1, 'Day must be between 1-7')
      .max(7, 'Day must be between 1-7'))
      .min(1, 'At least one day must be selected')
      .max(7, 'Cannot select more than 7 days'),
    hours: z.object({
      start: z.string()
        .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format')
        .default('09:00'),
      end: z.string()
        .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format')
        .default('17:00')
    }),
    timezone: z.string()
      .min(1, 'Timezone is required')
      .default('Asia/Dhaka'),
    preferredSessionDuration: z.number()
      .min(15, 'Session duration must be at least 15 minutes')
      .max(180, 'Session duration cannot exceed 180 minutes')
      .default(60)
  }).optional()
});

export const updateMissionMentorV2Schema = createMissionMentorV2Schema.partial().extend({
  id: z.string()
    .min(1, 'Mission mentor ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid mission mentor ID format')
});

// ✅ DUAL-LEVEL STATUS UPDATE SCHEMAS
export const updateMentorMissionStatusV2Schema = z.object({
  id: z.string()
    .min(1, 'Mission mentor ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid mission mentor ID format'),
  status: z.enum(['active', 'deactive', 'irregular', 'overloaded', 'unavailable']),
  reason: z.string()
    .max(500, 'Status reason must be less than 500 characters')
    .optional(),
  notes: z.string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional()
});

export const updateMentorGroupStatusV2Schema = z.object({
  id: z.string()
    .min(1, 'Mission mentor ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid mission mentor ID format'),
  groupId: z.string()
    .min(1, 'Group ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid group ID format'),
  groupStatus: z.object({
    status: z.enum(['active', 'deactive', 'irregular', 'overloaded', 'unavailable']),
    reason: z.string()
      .max(500, 'Group status reason must be less than 500 characters')
      .optional(),
    notes: z.string()
      .max(1000, 'Group status notes must be less than 1000 characters')
      .optional(),
    role: z.enum(['primary', 'co-mentor', 'moderator'])
      .optional()
  })
});

export const updateAvailabilityV2Schema = z.object({
  id: z.string()
    .min(1, 'Mission mentor ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid mission mentor ID format'),
  availability: z.object({
    days: z.array(z.number()
      .min(1, 'Day must be between 1-7')
      .max(7, 'Day must be between 1-7'))
      .min(1, 'At least one day must be selected')
      .max(7, 'Cannot select more than 7 days'),
    hours: z.object({
      start: z.string()
        .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format'),
      end: z.string()
        .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format')
    }),
    timezone: z.string()
      .min(1, 'Timezone is required'),
    preferredSessionDuration: z.number()
      .min(15, 'Session duration must be at least 15 minutes')
      .max(180, 'Session duration cannot exceed 180 minutes')
  })
});

export const updateCapacityV2Schema = z.object({
  id: z.string()
    .min(1, 'Mission mentor ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid mission mentor ID format'),
  maxStudents: z.number()
    .min(1, 'Maximum students must be at least 1')
    .max(100, 'Maximum students cannot exceed 100')
});

export const updateRoleV2Schema = z.object({
  id: z.string()
    .min(1, 'Mission mentor ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid mission mentor ID format'),
  role: z.enum(['mission-lead', 'coordinator', 'advisor', 'supervisor'])
});

// ✅ QUERY SCHEMAS
export const missionMentorQueryV2Schema = z.object({
  page: z.coerce.number()
    .min(1, 'Page must be at least 1')
    .default(1),
  limit: z.coerce.number()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(10),
  sortBy: z.enum(['role', 'status', 'availabilityRate', 'maxStudents', 'currentStudents', 'missionRating'])
    .default('role'),
  sortOrder: z.enum(['asc', 'desc'])
    .default('asc'),
  status: z.enum(['active', 'deactive', 'irregular', 'overloaded', 'unavailable'])
    .optional(),
  role: z.enum(['mission-lead', 'coordinator', 'advisor', 'supervisor'])
    .optional(),
  missionId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid mission ID format')
    .optional(),
  batchId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid batch ID format')
    .optional(),
  specialization: z.string()
    .optional(),
  isRegular: z.coerce.boolean()
    .optional(),
  availabilityRate: z.object({
    min: z.coerce.number().min(0).max(100),
    max: z.coerce.number().min(0).max(100)
  }).optional(),
  maxStudents: z.object({
    min: z.coerce.number().min(1).max(100),
    max: z.coerce.number().min(1).max(100)
  }).optional(),
  currentStudents: z.object({
    min: z.coerce.number().min(0).max(100),
    max: z.coerce.number().min(0).max(100)
  }).optional()
});

export const missionMentorIdParamV2Schema = z.object({
  id: z.string()
    .min(1, 'Mission mentor ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid mission mentor ID format')
});

// ✅ BULK OPERATION SCHEMAS
export const bulkMentorAssignmentV2Schema = z.object({
  mentorIds: z.array(z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid mentor ID format'))
    .min(1, 'At least one mentor ID is required')
    .max(50, 'Cannot assign more than 50 mentors at once'),
  missionId: z.string()
    .min(1, 'Mission ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid mission ID format'),
  batchId: z.string()
    .min(1, 'Batch ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid batch ID format'),
  role: z.enum(['mission-lead', 'coordinator', 'advisor', 'supervisor'])
    .default('advisor'),
  specialization: z.array(z.string())
    .optional(),
  responsibilities: z.array(z.string())
    .optional(),
  maxStudents: z.number()
    .min(1, 'Maximum students must be at least 1')
    .max(100, 'Maximum students cannot exceed 100')
    .default(10)
});

// ✅ GROUP ASSIGNMENT SCHEMAS
export const assignToGroupV2Schema = z.object({
  id: z.string()
    .min(1, 'Mission mentor ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid mission mentor ID format'),
  groupId: z.string()
    .min(1, 'Group ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid group ID format'),
  role: z.enum(['primary', 'co-mentor', 'moderator'])
    .default('co-mentor'),
  notes: z.string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional()
});

export const removeFromGroupV2Schema = z.object({
  id: z.string()
    .min(1, 'Mission mentor ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid mission mentor ID format'),
  groupId: z.string()
    .min(1, 'Group ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid group ID format')
});

// ✅ EXPORT TYPES
export type CreateMissionMentorV2Input = z.infer<typeof createMissionMentorV2Schema>;
export type UpdateMissionMentorV2Input = z.infer<typeof updateMissionMentorV2Schema>;
export type UpdateMentorMissionStatusV2Input = z.infer<typeof updateMentorMissionStatusV2Schema>;
export type UpdateMentorGroupStatusV2Input = z.infer<typeof updateMentorGroupStatusV2Schema>;
export type UpdateAvailabilityV2Input = z.infer<typeof updateAvailabilityV2Schema>;
export type UpdateCapacityV2Input = z.infer<typeof updateCapacityV2Schema>;
export type UpdateRoleV2Input = z.infer<typeof updateRoleV2Schema>;
export type MissionMentorQueryV2Input = z.infer<typeof missionMentorQueryV2Schema>;
export type MissionMentorIdParamV2Input = z.infer<typeof missionMentorIdParamV2Schema>;
export type BulkMentorAssignmentV2Input = z.infer<typeof bulkMentorAssignmentV2Schema>;
export type AssignToGroupV2Input = z.infer<typeof assignToGroupV2Schema>;
export type RemoveFromGroupV2Input = z.infer<typeof removeFromGroupV2Schema>;
