// API Helpers
export * from './apiHelpers';

// Type Guards
export * from './typeGuards';

// Re-export common utilities for convenience
export {
  createSuccessResponse,
  createPaginatedResponse,
  createErrorResponse,
  createValidationErrorResponse,
  handleApiError,
  parseQueryParams,
  getPaginationFromQuery,
  buildSearchFilter,
  calculatePagination,
  transformMongoResponse
} from './apiHelpers';

export {
  isPopulatedBatch,
  isPopulatedUser,
  isPopulatedCourseOffering,
  safeExtractBatchId,
  safeExtractBatchCode,
  safeExtractUserName,
  getBatchDisplayName,
  getUserDisplayName,
  getCourseDisplayName,
  isValidObjectId,
  isValidEmail,
  isValidDate,
  uniqueById,
  groupBy,
  sortBy
} from './typeGuards'; 