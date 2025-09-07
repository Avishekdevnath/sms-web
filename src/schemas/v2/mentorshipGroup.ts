import { z } from 'zod';

// ✅ V2 MENTORSHIP GROUP VALIDATION SCHEMA
// Zod validation for MentorshipGroupV2 model with participant management

export const createMentorshipGroupV2Schema = z.object({
  name: z.string()
    .min(1, 'Group name is required')
    .max(100, 'Group name must be less than 100 characters')
    .trim(),
  missionId: z.string()
    .min(1, 'Mission ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid mission ID format'),
  batchId: z.string()
    .min(1, 'Batch ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid batch ID format'),
  // ✅ STUDENT ASSIGNMENT (from MissionStudent)
  studentIds: z.array(z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid student ID format'))
    .default([]),
  maxStudents: z.number()
    .min(0, 'Maximum students must be at least 0 (0 = unlimited)')
    .default(0),
  minStudents: z.number()
    .min(1, 'Minimum students must be at least 1')
    .max(50, 'Minimum students cannot exceed 50')
    .default(5),
  // ✅ MENTOR ASSIGNMENT (from MissionMentor)
  primaryMentorId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid primary mentor ID format')
    .optional(),
  coMentorIds: z.array(z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid co-mentor ID format'))
    .default([]),
  // Group Configuration
  groupType: z.enum(['study', 'project', 'mentorship', 'collaborative'])
    .default('mentorship'),
  focusArea: z.array(z.string()
    .min(1, 'Focus area cannot be empty')
    .max(50, 'Focus area must be less than 50 characters'))
    .max(20, 'Cannot have more than 20 focus areas')
    .default([]),
  skillLevel: z.enum(['beginner', 'intermediate', 'advanced', 'mixed'])
    .default('mixed'),
  // Meeting Schedule
  meetingSchedule: z.object({
    frequency: z.enum(['weekly', 'biweekly', 'monthly', 'on-demand'])
      .default('weekly'),
    dayOfWeek: z.number()
      .min(0, 'Day of week must be between 0-6')
      .max(6, 'Day of week must be between 0-6')
      .optional(),
    time: z.string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format')
      .default('14:00')
      .optional(),
    duration: z.number()
      .min(15, 'Duration must be at least 15 minutes')
      .max(180, 'Duration cannot exceed 180 minutes')
      .default(60),
    timezone: z.string()
      .min(1, 'Timezone is required')
      .default('Asia/Dhaka')
  }).optional(),
  // Communication
  communicationChannel: z.object({
    type: z.enum(['discord', 'slack', 'telegram', 'whatsapp'])
      .optional(),
    channelId: z.string()
      .max(100, 'Channel ID must be less than 100 characters')
      .optional(),
    inviteLink: z.string()
      .url('Invalid invite link format')
      .max(500, 'Invite link must be less than 500 characters')
      .optional()
  }).optional()
});

export const updateMentorshipGroupV2Schema = createMentorshipGroupV2Schema.partial().extend({
  id: z.string()
    .min(1, 'Mentorship group ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid mentorship group ID format')
});

// ✅ PARTICIPANT MANAGEMENT SCHEMAS
export const updateStudentAssignmentsV2Schema = z.object({
  id: z.string()
    .min(1, 'Mentorship group ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid mentorship group ID format'),
  studentIds: z.array(z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid student ID format')),
  action: z.enum(['add', 'remove', 'replace'])
    .default('replace')
});

export const updateMentorAssignmentsV2Schema = z.object({
  id: z.string()
    .min(1, 'Mentorship group ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid mentorship group ID format'),
  primaryMentorId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid primary mentor ID format')
    .optional(),
  coMentorIds: z.array(z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid co-mentor ID format'))
    .optional(),
  action: z.enum(['add', 'remove', 'replace'])
    .default('replace')
});

export const addStudentToGroupV2Schema = z.object({
  id: z.string()
    .min(1, 'Mentorship group ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid mentorship group ID format'),
  studentId: z.string()
    .min(1, 'Student ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid student ID format')
});

export const removeStudentFromGroupV2Schema = z.object({
  id: z.string()
    .min(1, 'Mentorship group ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid mentorship group ID format'),
  studentId: z.string()
    .min(1, 'Student ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid student ID format')
});

export const addCoMentorToGroupV2Schema = z.object({
  id: z.string()
    .min(1, 'Mentorship group ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid mentorship group ID format'),
  mentorId: z.string()
    .min(1, 'Mentor ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid mentor ID format')
});

export const removeCoMentorFromGroupV2Schema = z.object({
  id: z.string()
    .min(1, 'Mentorship group ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid mentorship group ID format'),
  mentorId: z.string()
    .min(1, 'Mentor ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid mentor ID format')
});

// ✅ GROUP MANAGEMENT SCHEMAS
export const updateMentorshipGroupStatusV2Schema = z.object({
  id: z.string()
    .min(1, 'Mentorship group ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid mentorship group ID format'),
  status: z.enum(['forming', 'active', 'inactive', 'completed', 'disbanded'])
});

export const updateMeetingScheduleV2Schema = z.object({
  id: z.string()
    .min(1, 'Mentorship group ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid mentorship group ID format'),
  meetingSchedule: z.object({
    frequency: z.enum(['weekly', 'biweekly', 'monthly', 'on-demand']),
    dayOfWeek: z.number()
      .min(0, 'Day of week must be between 0-6')
      .max(6, 'Day of week must be between 0-6')
      .optional(),
    time: z.string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format')
      .optional(),
    duration: z.number()
      .min(15, 'Duration must be at least 15 minutes')
      .max(180, 'Duration cannot exceed 180 minutes')
      .optional(),
    timezone: z.string()
      .min(1, 'Timezone is required')
      .optional()
  })
});

export const updateCommunicationChannelV2Schema = z.object({
  id: z.string()
    .min(1, 'Mentorship group ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid mentorship group ID format'),
  communicationChannel: z.object({
    type: z.enum(['discord', 'slack', 'telegram', 'whatsapp']),
    channelId: z.string()
      .max(100, 'Channel ID must be less than 100 characters')
      .optional(),
    inviteLink: z.string()
      .url('Invalid invite link format')
      .max(500, 'Invite link must be less than 500 characters')
      .optional()
  })
});

export const recordMeetingV2Schema = z.object({
  id: z.string()
    .min(1, 'Mentorship group ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid mentorship group ID format'),
  meetingNotes: z.string()
    .max(2000, 'Meeting notes must be less than 2000 characters')
    .optional(),
  attendees: z.array(z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid attendee ID format'))
    .optional()
});

// ✅ QUERY SCHEMAS
export const mentorshipGroupQueryV2Schema = z.object({
  page: z.coerce.number()
    .min(1, 'Page must be at least 1')
    .default(1),
  limit: z.coerce.number()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(10),
  sortBy: z.enum(['name', 'status', 'createdAt', 'totalParticipants', 'overallProgress'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc'])
    .default('desc'),
  status: z.enum(['forming', 'active', 'inactive', 'completed', 'disbanded'])
    .optional(),
  missionId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid mission ID format')
    .optional(),
  batchId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid batch ID format')
    .optional(),
  primaryMentorId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid primary mentor ID format')
    .optional(),
  groupType: z.enum(['study', 'project', 'review', 'workshop', 'mixed'])
    .optional(),
  skillLevel: z.enum(['beginner', 'intermediate', 'advanced', 'mixed'])
    .optional(),
  isFull: z.coerce.boolean()
    .optional(),
  isMinimumMet: z.coerce.boolean()
    .optional()
});

export const mentorshipGroupIdParamV2Schema = z.object({
  id: z.string()
    .min(1, 'Mentorship group ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid mentorship group ID format')
});

// ✅ BULK OPERATION SCHEMAS
export const bulkGroupAssignmentV2Schema = z.object({
  groupId: z.string()
    .min(1, 'Group ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid group ID format'),
  studentIds: z.array(z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid student ID format'))
    .optional(),
  mentorIds: z.array(z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid mentor ID format'))
    .optional(),
  action: z.enum(['add', 'remove', 'replace'])
    .default('add')
});

// ✅ GROUP FORMATION SCHEMAS
export const createGroupFromParticipantsV2Schema = z.object({
  name: z.string()
    .min(1, 'Group name is required')
    .max(100, 'Group name must be less than 100 characters')
    .trim(),
  missionId: z.string()
    .min(1, 'Mission ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid mission ID format'),
  batchId: z.string()
    .min(1, 'Batch ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid batch ID format'),
  studentIds: z.array(z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid student ID format'))
    .min(1, 'At least one student is required'),
  primaryMentorId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid primary mentor ID format')
    .optional(),
  coMentorIds: z.array(z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid co-mentor ID format'))
    .default([]),
  groupType: z.enum(['study', 'project', 'mentorship', 'collaborative'])
    .default('mentorship'),
  focusArea: z.array(z.string())
    .default([]),
  skillLevel: z.enum(['beginner', 'intermediate', 'advanced', 'mixed'])
    .default('mixed'),
  meetingSchedule: z.object({
    frequency: z.enum(['weekly', 'biweekly', 'monthly', 'on-demand'])
      .default('weekly'),
    dayOfWeek: z.number()
      .min(0, 'Day of week must be between 0-6')
      .max(6, 'Day of week must be between 0-6')
      .optional(),
    time: z.string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format')
      .default('14:00')
      .optional(),
    duration: z.number()
      .min(15, 'Duration must be at least 15 minutes')
      .max(180, 'Duration cannot exceed 180 minutes')
      .default(60),
    timezone: z.string()
      .default('Asia/Dhaka')
  }).optional()
});

// ✅ EXPORT TYPES
export type CreateMentorshipGroupV2Input = z.infer<typeof createMentorshipGroupV2Schema>;
export type UpdateMentorshipGroupV2Input = z.infer<typeof updateMentorshipGroupV2Schema>;
export type UpdateStudentAssignmentsV2Input = z.infer<typeof updateStudentAssignmentsV2Schema>;
export type UpdateMentorAssignmentsV2Input = z.infer<typeof updateMentorAssignmentsV2Schema>;
export type AddStudentToGroupV2Input = z.infer<typeof addStudentToGroupV2Schema>;
export type RemoveStudentFromGroupV2Input = z.infer<typeof removeStudentFromGroupV2Schema>;
export type AddCoMentorToGroupV2Input = z.infer<typeof addCoMentorToGroupV2Schema>;
export type RemoveCoMentorFromGroupV2Input = z.infer<typeof removeCoMentorFromGroupV2Schema>;
export type UpdateMentorshipGroupStatusV2Input = z.infer<typeof updateMentorshipGroupStatusV2Schema>;
export type UpdateMeetingScheduleV2Input = z.infer<typeof updateMeetingScheduleV2Schema>;
export type UpdateCommunicationChannelV2Input = z.infer<typeof updateCommunicationChannelV2Schema>;
export type RecordMeetingV2Input = z.infer<typeof recordMeetingV2Schema>;
export type MentorshipGroupQueryV2Input = z.infer<typeof mentorshipGroupQueryV2Schema>;
export type MentorshipGroupIdParamV2Input = z.infer<typeof mentorshipGroupIdParamV2Schema>;
export type BulkGroupAssignmentV2Input = z.infer<typeof bulkGroupAssignmentV2Schema>;
export type CreateGroupFromParticipantsV2Input = z.infer<typeof createGroupFromParticipantsV2Schema>;
