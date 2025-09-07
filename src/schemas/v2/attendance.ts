import { z } from 'zod';

export const markAttendanceV2Schema = z.object({
  missionId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  studentId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  missionStudentId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  date: z.string().or(z.date()).optional(),
  status: z.enum(['present', 'absent', 'excused']),
  notes: z.string().max(500).optional(),
  answers: z.record(z.any()).optional()
}).refine((v) => v.studentId || v.missionStudentId, {
  message: 'Either studentId or missionStudentId is required'
});

export const bulkMarkAttendanceV2Schema = z.object({
  missionId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  mentorshipGroupId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  studentIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
  date: z.string().or(z.date()).optional(),
  status: z.enum(['present', 'absent', 'excused']),
  notes: z.string().max(500).optional()
}).refine((v) => v.mentorshipGroupId || (v.studentIds && v.studentIds.length > 0), {
  message: 'Provide mentorshipGroupId or non-empty studentIds'
});

export const attendanceLogsQueryV2Schema = z.object({
  missionId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  studentId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  mentorshipGroupId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20)
});

export const attendanceSummaryStudentQueryV2Schema = z.object({
  missionId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  studentId: z.string().regex(/^[0-9a-fA-F]{24}$/)
});

export const attendanceSummaryGroupQueryV2Schema = z.object({
  missionId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  mentorshipGroupId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  from: z.string().optional(),
  to: z.string().optional()
});

export const attendanceSummaryMissionQueryV2Schema = z.object({
  missionId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  from: z.string().optional(),
  to: z.string().optional()
});

export type MarkAttendanceV2Input = z.infer<typeof markAttendanceV2Schema>;
export type BulkMarkAttendanceV2Input = z.infer<typeof bulkMarkAttendanceV2Schema>;
export type AttendanceLogsQueryV2Input = z.infer<typeof attendanceLogsQueryV2Schema>;
export type AttendanceSummaryStudentQueryV2Input = z.infer<typeof attendanceSummaryStudentQueryV2Schema>;
export type AttendanceSummaryGroupQueryV2Input = z.infer<typeof attendanceSummaryGroupQueryV2Schema>;
export type AttendanceSummaryMissionQueryV2Input = z.infer<typeof attendanceSummaryMissionQueryV2Schema>;


