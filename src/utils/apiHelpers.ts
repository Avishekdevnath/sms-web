import { NextResponse } from 'next/server';
import { ApiResponse, PaginatedResponse, ApiError, ValidationError, NotFoundError, UnauthorizedError, ForbiddenError, InternalError } from '@/types/api';

// Success response helpers
export function createSuccessResponse<T>(data: T, message?: string): NextResponse {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message
  };
  return NextResponse.json(response);
}

export function createPaginatedResponse<T>(
  data: T[], 
  pagination: { page: number; limit: number; total: number; totalPages: number }
): NextResponse {
  const response: PaginatedResponse<T> = {
    success: true,
    data,
    pagination
  };
  return NextResponse.json(response);
}

export function createMessageResponse(message: string, status: number = 200): NextResponse {
  const response: ApiResponse<null> = {
    success: true,
    data: null,
    message
  };
  return NextResponse.json(response, { status });
}

// Error response helpers
export function createErrorResponse(error: string, status: number = 400): NextResponse {
  const response: ApiResponse<never> = {
    success: false,
    error
  };
  return NextResponse.json(response, { status });
}

export function createValidationErrorResponse(errors: Record<string, string[]>): NextResponse {
  const response: ValidationError = {
    code: 'VALIDATION_ERROR',
    message: 'Validation failed',
    details: errors
  };
  return NextResponse.json({ success: false, error: response }, { status: 400 });
}

export function createNotFoundErrorResponse(message: string = 'Resource not found'): NextResponse {
  const response: NotFoundError = {
    code: 'NOT_FOUND',
    message
  };
  return NextResponse.json({ success: false, error: response }, { status: 404 });
}

export function createUnauthorizedErrorResponse(message: string = 'Unauthorized'): NextResponse {
  const response: UnauthorizedError = {
    code: 'UNAUTHORIZED',
    message
  };
  return NextResponse.json({ success: false, error: response }, { status: 401 });
}

export function createForbiddenErrorResponse(message: string = 'Forbidden'): NextResponse {
  const response: ForbiddenError = {
    code: 'FORBIDDEN',
    message
  };
  return NextResponse.json({ success: false, error: response }, { status: 403 });
}

export function createInternalErrorResponse(message: string = 'Internal server error'): NextResponse {
  const response: InternalError = {
    code: 'INTERNAL',
    message
  };
  return NextResponse.json({ success: false, error: response }, { status: 500 });
}

// Bulk operation response helpers
export function createBulkOperationResponse(
  processed: number,
  succeeded: number,
  failed: number,
  errors: Array<{ id: string; error: string }> = []
): NextResponse {
  const response = {
    success: true,
    data: {
      processed,
      succeeded,
      failed,
      errors
    }
  };
  return NextResponse.json(response);
}

export function createBulkDeleteResponse(
  processed: number,
  deleted: number,
  failed: number,
  errors: Array<{ id: string; error: string }> = []
): NextResponse {
  const response = {
    success: true,
    data: {
      processed,
      deleted,
      failed,
      errors
    }
  };
  return NextResponse.json(response);
}

export function createBulkUpdateResponse(
  processed: number,
  updated: number,
  failed: number,
  errors: Array<{ id: string; error: string }> = []
): NextResponse {
  const response = {
    success: true,
    data: {
      processed,
      updated,
      failed,
      errors
    }
  };
  return NextResponse.json(response);
}

// Query parameter helpers
export function parseQueryParams<T extends Record<string, any>>(searchParams: URLSearchParams): T {
  const params: any = {};
  
  for (const [key, value] of searchParams.entries()) {
    // Handle boolean values
    if (value === 'true') {
      params[key] = true;
    } else if (value === 'false') {
      params[key] = false;
    }
    // Handle numeric values
    else if (!isNaN(Number(value)) && value !== '') {
      params[key] = Number(value);
    }
    // Handle arrays (comma-separated values)
    else if (value.includes(',')) {
      params[key] = value.split(',').map(v => v.trim());
    }
    // Handle regular strings
    else {
      params[key] = value;
    }
  }
  
  return params as T;
}

export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        searchParams.set(key, value.join(','));
      } else {
        searchParams.set(key, String(value));
      }
    }
  });
  
  return searchParams.toString();
}

// Pagination helpers
export function calculatePagination(page: number, limit: number, total: number) {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage,
    hasPrevPage,
    nextPage: hasNextPage ? page + 1 : null,
    prevPage: hasPrevPage ? page - 1 : null
  };
}

export function getPaginationFromQuery(searchParams: URLSearchParams) {
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // Max 100 items per page
  
  return {
    page: Math.max(1, page),
    limit: Math.max(1, limit),
    skip: (page - 1) * limit
  };
}

// Search and filter helpers
export function buildSearchFilter(search?: string, fields: string[] = ['name', 'title', 'email']) {
  if (!search) return {};
  
  const searchRegex = { $regex: search, $options: 'i' };
  const searchConditions = fields.map(field => ({ [field]: searchRegex }));
  
  return { $or: searchConditions };
}

export function buildDateRangeFilter(startDate?: string, endDate?: string, field: string = 'createdAt') {
  const filter: any = {};
  
  if (startDate) {
    filter[field] = { ...filter[field], $gte: new Date(startDate) };
  }
  
  if (endDate) {
    filter[field] = { ...filter[field], $lte: new Date(endDate) };
  }
  
  return Object.keys(filter).length > 0 ? filter : {};
}

// Response transformation helpers
export function transformMongoResponse<T>(data: T): T {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => transformMongoResponse(item)) as T;
  }
  
  // Handle objects
  const transformed: any = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === 'object') {
      if (Array.isArray(value)) {
        transformed[key] = value.map(item => transformMongoResponse(item));
      } else {
        // Check if it's a MongoDB ObjectId
        if (value && typeof value === 'object' && value.constructor && value.constructor.name === 'ObjectId') {
          transformed[key] = value.toString();
        } else if (value && typeof value === 'object' && value.buffer) {
          // Handle ObjectId buffer representation
          transformed[key] = value.toString();
        } else {
          transformed[key] = transformMongoResponse(value);
        }
      }
    } else {
      transformed[key] = value;
    }
  }
  
  // Convert MongoDB ObjectId to string
  if ('_id' in transformed && transformed._id) {
    if (typeof transformed._id === 'object' && transformed._id.constructor && transformed._id.constructor.name === 'ObjectId') {
      transformed._id = transformed._id.toString();
    } else if (typeof transformed._id === 'object' && transformed._id.buffer) {
      transformed._id = transformed._id.toString();
    }
  }
  
  return transformed;
}

// Error handling helpers
export function handleApiError(error: any): NextResponse {
  console.error('API Error:', error);
  
  // Handle Zod validation errors
  if (error.name === 'ZodError') {
    const validationErrors: Record<string, string[]> = {};
    
    // Check if error.errors exists and is an array
    if (error.errors && Array.isArray(error.errors)) {
      error.errors.forEach((err: any) => {
        const field = err.path.join('.');
        if (!validationErrors[field]) {
          validationErrors[field] = [];
        }
        validationErrors[field].push(err.message);
      });
    } else {
      // Fallback for malformed ZodError
      validationErrors['general'] = ['Validation failed'];
    }
    
    return createValidationErrorResponse(validationErrors);
  }
  
  // Handle MongoDB errors
  if (error.name === 'MongoError' || error.name === 'MongoServerError') {
    if (error.code === 11000) {
      return createErrorResponse('Duplicate entry found', 409);
    }
    return createInternalErrorResponse('Database operation failed');
  }

  // Handle Mongoose errors
  if (error.name === 'MissingSchemaError') {
    return createInternalErrorResponse('Database schema error');
  }
  
  // Handle custom API errors
  if (error.code && error.message) {
    switch (error.code) {
      case 'NOT_FOUND':
        return createNotFoundErrorResponse(error.message);
      case 'UNAUTHORIZED':
        return createUnauthorizedErrorResponse(error.message);
      case 'FORBIDDEN':
        return createForbiddenErrorResponse(error.message);
      case 'VALIDATION_ERROR':
        return createValidationErrorResponse(error.details || {});
      default:
        return createErrorResponse(error.message, error.status || 400);
    }
  }
  
  // Default internal error
  return createInternalErrorResponse();
} 