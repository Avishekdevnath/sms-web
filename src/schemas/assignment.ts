import { z } from 'zod';

export const AssignmentCreateSchema = z.object({
  courseOfferingId: z.string().min(1, "Course offering is required"),
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  description: z.string().optional(),
  dueAt: z.string().optional().refine((val) => {
    if (!val) return true; // Allow empty/undefined
    try {
      new Date(val).toISOString();
      return true;
    } catch {
      return false;
    }
  }, "Invalid due date"),
  maxPoints: z.number().min(0, "Max points must be at least 0").max(1000, "Max points must be at most 1000").optional(),
  attachments: z.array(z.object({
    name: z.string().min(1, "Attachment name is required"),
    url: z.string().url("Invalid attachment URL")
  })).optional(),
  published: z.boolean().optional(),
});

export const AssignmentUpdateSchema = AssignmentCreateSchema.partial().omit({ published: true });

export const AssignmentQuerySchema = z.object({
  courseOfferingId: z.string().optional(),
  published: z.boolean().optional(),
  dueBefore: z.string().datetime("Invalid due before date").optional(),
  dueAfter: z.string().datetime("Invalid due after date").optional(),
  page: z.number().min(1, "Page must be at least 1").optional(),
  limit: z.number().min(1, "Limit must be at least 1").max(100, "Limit must be at most 100").optional(),
  search: z.string().optional(),
  sortBy: z.enum(['title', 'dueAt', 'createdAt', 'maxPoints']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const AssignmentPublishSchema = z.object({
  id: z.string().min(1, "Assignment ID is required"),
});

export const AssignmentUnpublishSchema = z.object({
  id: z.string().min(1, "Assignment ID is required"),
});

export const AssignmentBulkDeleteSchema = z.object({
  ids: z.array(z.string().min(1, "Assignment ID is required")).min(1, "At least one assignment is required"),
});

export const AssignmentAttachmentSchema = z.object({
  name: z.string().min(1, "Attachment name is required").max(100, "Attachment name must be less than 100 characters"),
  url: z.string().url("Invalid attachment URL"),
});

export const AssignmentSubmissionSchema = z.object({
  assignmentId: z.string().min(1, "Assignment ID is required"),
  fileUrl: z.string().url("Invalid file URL").optional(),
  textSubmission: z.string().optional(),
  attachments: z.array(AssignmentAttachmentSchema).optional(),
}).refine((data) => {
  // At least one submission method must be provided
  return data.fileUrl || data.textSubmission || (data.attachments && data.attachments.length > 0);
}, {
  message: "At least one submission method (file, text, or attachments) is required",
  path: ["fileUrl"]
}); 