import { z } from 'zod';

export const FeatureRequestCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.enum(['bug', 'enhancement', 'new-feature', 'improvement', 'other'], {
    required_error: "Category is required",
    invalid_type_error: "Category must be one of: bug, enhancement, new-feature, improvement, other"
  }),
  priority: z.enum(['low', 'medium', 'high', 'critical'], {
    required_error: "Priority is required",
    invalid_type_error: "Priority must be one of: low, medium, high, critical"
  }),
  tags: z.array(z.string()).optional(),
  attachments: z.array(z.string().url("Invalid attachment URL")).optional(),
});

export const FeatureRequestUpdateSchema = FeatureRequestCreateSchema.partial().extend({
  status: z.enum(['pending', 'under-review', 'approved', 'in-progress', 'completed', 'rejected']).optional(),
  assignedTo: z.string().optional(),
  estimatedEffort: z.number().min(0, "Estimated effort must be at least 0").optional(),
  actualEffort: z.number().min(0, "Actual effort must be at least 0").optional(),
  targetVersion: z.string().optional(),
  notes: z.string().optional(),
  completedAt: z.string().datetime("Invalid completion date").optional(),
});

export const FeatureRequestQuerySchema = z.object({
  category: z.enum(['bug', 'enhancement', 'new-feature', 'improvement', 'other']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  status: z.enum(['pending', 'under-review', 'approved', 'in-progress', 'completed', 'rejected']).optional(),
  userRole: z.enum(['admin', 'developer', 'manager', 'sre', 'mentor', 'student']).optional(),
  assignedTo: z.string().optional(),
  submittedBy: z.string().optional(),
  page: z.number().min(1, "Page must be at least 1").optional(),
  limit: z.number().min(1, "Limit must be at least 1").max(100, "Limit must be at most 100").optional(),
  search: z.string().optional(),
  sortBy: z.enum(['title', 'category', 'priority', 'status', 'votes', 'createdAt', 'updatedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const FeatureRequestStatusUpdateSchema = z.object({
  status: z.enum(['pending', 'under-review', 'approved', 'in-progress', 'completed', 'rejected'], {
    required_error: "Status is required",
    invalid_type_error: "Status must be one of: pending, under-review, approved, in-progress, completed, rejected"
  }),
  notes: z.string().optional(),
});

export const FeatureRequestAssignmentSchema = z.object({
  assignedTo: z.string().min(1, "Assignee ID is required"),
  estimatedEffort: z.number().min(0, "Estimated effort must be at least 0").optional(),
  targetVersion: z.string().optional(),
  notes: z.string().optional(),
});

export const FeatureRequestVoteSchema = z.object({
  featureRequestId: z.string().min(1, "Feature request ID is required"),
  vote: z.boolean().optional(), // true for upvote, false for downvote, undefined to remove vote
});

export const FeatureRequestBulkUpdateSchema = z.object({
  ids: z.array(z.string().min(1, "Feature request ID is required")).min(1, "At least one feature request is required"),
  status: z.enum(['pending', 'under-review', 'approved', 'in-progress', 'completed', 'rejected']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
});

export const FeatureRequestCommentSchema = z.object({
  featureRequestId: z.string().min(1, "Feature request ID is required"),
  content: z.string().min(1, "Comment content is required").max(1000, "Comment must be less than 1000 characters"),
  isInternal: z.boolean().optional(), // Internal comments only visible to admins/devs
}); 