import { z } from 'zod';

export const attendanceFormQuestionSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(['text', 'textarea', 'single-select', 'multi-select', 'boolean', 'number', 'email', 'date', 'time', 'datetime', 'url', 'phone', 'file', 'rating', 'scale', 'paragraph']),
  required: z.boolean().default(false),
  description: z.string().optional(),
  placeholder: z.string().optional(),
  options: z.array(z.string()).optional(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    pattern: z.string().optional(),
    customMessage: z.string().optional()
  }).optional(),
  conditional: z.object({
    dependsOn: z.string(),
    condition: z.enum(['equals', 'not_equals', 'contains', 'not_contains']),
    value: z.any()
  }).optional(),
  order: z.number().default(0)
});

export const createAttendanceFormV2Schema = z.object({
  missionId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  title: z.string().min(1),
  active: z.boolean().optional(),
  questions: z.array(attendanceFormQuestionSchema).min(1)
});

export const updateAttendanceFormV2Schema = createAttendanceFormV2Schema.partial().extend({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/)
});

export type CreateAttendanceFormV2Input = z.infer<typeof createAttendanceFormV2Schema>;
export type UpdateAttendanceFormV2Input = z.infer<typeof updateAttendanceFormV2Schema>;


