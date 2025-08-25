// Standard API response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Common query parameters
export interface BaseQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Specific query parameters
export interface MissionQueryParams extends BaseQueryParams {
  batchId?: string;
  status?: 'draft' | 'active' | 'completed' | 'archived';
  createdBy?: string;
}

export interface UserQueryParams extends BaseQueryParams {
  role?: 'admin' | 'developer' | 'manager' | 'sre' | 'mentor' | 'student';
  batchId?: string;
  isActive?: boolean;
}

export interface StudentQueryParams extends BaseQueryParams {
  batchId?: string;
  status?: 'pending' | 'approved' | 'active' | 'suspended';
  profileCompleted?: boolean;
}

export interface CourseQueryParams extends BaseQueryParams {
  batchId?: string;
  semesterId?: string;
  status?: 'active' | 'inactive';
}

// Error response types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Standard error responses
export interface ValidationError extends ApiError {
  code: 'VALIDATION_ERROR';
  details: Record<string, string[]>;
}

export interface NotFoundError extends ApiError {
  code: 'NOT_FOUND';
}

export interface UnauthorizedError extends ApiError {
  code: 'UNAUTHORIZED';
}

export interface ForbiddenError extends ApiError {
  code: 'FORBIDDEN';
}

export interface InternalError extends ApiError {
  code: 'INTERNAL';
} 