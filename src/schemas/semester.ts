import { z } from 'zod';

export const SemesterCreateSchema = z.object({
  batchId: z.string().min(1, "Batch is required"),
  number: z.enum(["1", "2", "3"], {
    required_error: "Semester number is required",
    invalid_type_error: "Semester number must be 1, 2, or 3"
  }).transform(n => Number(n) as 1 | 2 | 3),
  title: z.string().max(100, "Title must be less than 100 characters").optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Invalid start date format").optional().or(z.literal("")),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Invalid end date format").optional().or(z.literal("")),
}).refine((data) => {
  // Validate that end date is after start date if both are provided
  if (data.startDate && data.startDate !== '' && data.endDate && data.endDate !== '') {
    return new Date(data.endDate) > new Date(data.startDate);
  }
  return true;
}, {
  message: "End date must be after start date",
  path: ["endDate"]
});

export const SemesterUpdateSchema = SemesterCreateSchema.partial().omit({ batchId: true, number: true });

export const SemesterQuerySchema = z.object({
  batchId: z.string().optional(),
  number: z.enum(["1", "2", "3"]).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Invalid start date format").optional().or(z.literal("")),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Invalid end date format").optional().or(z.literal("")),
  page: z.number().min(1, "Page must be at least 1").optional(),
  limit: z.number().min(1, "Limit must be at least 1").max(100, "Limit must be at most 100").optional(),
  search: z.string().optional(),
  sortBy: z.enum(['number', 'startDate', 'endDate', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const SemesterBulkCreateSchema = z.object({
  semesters: z.array(z.object({
    batchId: z.string().min(1, "Batch is required"),
    number: z.enum(["1", "2", "3"]),
    title: z.string().max(100, "Title must be less than 100 characters").optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Invalid start date format").optional().or(z.literal("")),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Invalid end date format").optional().or(z.literal("")),
  })).min(1, "At least one semester is required").max(10, "Maximum 10 semesters can be created at once"),
});

export const SemesterDateUpdateSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Invalid start date format").optional().or(z.literal("")),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Invalid end date format").optional().or(z.literal("")),
}).refine((data) => {
  // Validate that end date is after start date if both are provided
  if (data.startDate && data.startDate !== '' && data.endDate && data.endDate !== '') {
    return new Date(data.endDate) > new Date(data.startDate);
  }
  return true;
}, {
  message: "End date must be after start date",
  path: ["endDate"]
}); 