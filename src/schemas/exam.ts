import { z } from 'zod';

export const ExamCreateSchema = z.object({
  courseOfferingId: z.string().min(1, "Course offering is required"),
  type: z.enum(["mid", "final", "quiz", "lab", "other"], {
    required_error: "Exam type is required",
    invalid_type_error: "Exam type must be one of: mid, final, quiz, lab, other"
  }),
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  totalMarks: z.number().positive("Total marks must be positive").max(1000, "Total marks must be at most 1000"),
  scheduledAt: z.string().datetime("Invalid scheduled date").optional(),
  durationMinutes: z.number().positive("Duration must be positive").max(480, "Duration must be at most 480 minutes").optional(),
  instructions: z.string().max(1000, "Instructions must be less than 1000 characters").optional(),
  location: z.string().max(200, "Location must be less than 200 characters").optional(),
  published: z.boolean().optional(),
});

export const ExamUpdateSchema = ExamCreateSchema.partial().omit({ published: true });

export const ExamQuerySchema = z.object({
  courseOfferingId: z.string().optional(),
  type: z.enum(["mid", "final", "quiz", "lab", "other"]).optional(),
  published: z.boolean().optional(),
  scheduledBefore: z.string().datetime("Invalid scheduled before date").optional(),
  scheduledAfter: z.string().datetime("Invalid scheduled after date").optional(),
  page: z.number().min(1, "Page must be at least 1").optional(),
  limit: z.number().min(1, "Limit must be at least 1").max(100, "Limit must be at most 100").optional(),
  search: z.string().optional(),
  sortBy: z.enum(['title', 'scheduledAt', 'createdAt', 'totalMarks', 'type']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const ExamPublishSchema = z.object({
  id: z.string().min(1, "Exam ID is required"),
});

export const ExamUnpublishSchema = z.object({
  id: z.string().min(1, "Exam ID is required"),
});

export const ExamBulkDeleteSchema = z.object({
  ids: z.array(z.string().min(1, "Exam ID is required")).min(1, "At least one exam is required"),
});

export const ExamResultSchema = z.object({
  examId: z.string().min(1, "Exam ID is required"),
  studentId: z.string().min(1, "Student ID is required"),
  marks: z.number().min(0, "Marks must be at least 0"),
  maxMarks: z.number().positive("Max marks must be positive"),
  submittedAt: z.string().datetime("Invalid submitted date").optional(),
  feedback: z.string().max(500, "Feedback must be less than 500 characters").optional(),
  gradedBy: z.string().min(1, "Grader ID is required").optional(),
  gradedAt: z.string().datetime("Invalid graded date").optional(),
});

export const ExamScheduleSchema = z.object({
  examId: z.string().min(1, "Exam ID is required"),
  scheduledAt: z.string().datetime("Invalid scheduled date"),
  durationMinutes: z.number().positive("Duration must be positive").max(480, "Duration must be at most 480 minutes").optional(),
  location: z.string().max(200, "Location must be less than 200 characters").optional(),
  instructions: z.string().max(1000, "Instructions must be less than 1000 characters").optional(),
}); 