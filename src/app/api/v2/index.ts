// ✅ V2 API INDEX FILE
// Export all V2 API routes and provide documentation

export const V2_API_ROUTES = {
  // ✅ MISSIONS API
  missions: {
    base: '/api/v2/missions',
    endpoints: {
      'GET /': 'List missions with filtering and pagination',
      'POST /': 'Create new mission',
      'GET /[id]': 'Get mission by ID with populated data',
      'PUT /[id]': 'Update mission',
      'DELETE /[id]': 'Delete mission'
    }
  },
  
  // ✅ MISSION STUDENTS API
  missionStudents: {
    base: '/api/v2/mission-students',
    endpoints: {
      'GET /': 'List mission students with filtering and pagination',
      'POST /': 'Create new mission student assignment (single or bulk)',
      'GET /[id]': 'Get mission student by ID',
      'PUT /[id]': 'Update mission student',
      'DELETE /[id]': 'Remove student from mission',
      'PATCH /[id]/status': 'Update student mission status',
      'PATCH /[id]/group-status': 'Update student group status',
      'PATCH /[id]/progress': 'Update student progress',
      'PATCH /[id]/attendance': 'Update student attendance'
    }
  },
  
  // ✅ MISSION MENTORS API
  missionMentors: {
    base: '/api/v2/mission-mentors',
    endpoints: {
      'GET /': 'List mission mentors with filtering and pagination',
      'POST /': 'Create new mission mentor assignment (single or bulk)',
      'GET /[id]': 'Get mission mentor by ID',
      'PUT /[id]': 'Update mission mentor',
      'DELETE /[id]': 'Remove mentor from mission',
      'PATCH /[id]/status': 'Update mentor mission status',
      'PATCH /[id]/group-status': 'Update mentor group status',
      'PATCH /[id]/availability': 'Update mentor availability',
      'PATCH /[id]/capacity': 'Update mentor capacity',
      'PATCH /[id]/role': 'Update mentor role'
    }
  },
  
  // ✅ MENTORSHIP GROUPS API
  mentorshipGroups: {
    base: '/api/v2/mentorship-groups',
    endpoints: {
      'GET /': 'List mentorship groups with filtering and pagination',
      'POST /': 'Create new mentorship group or group from participants',
      'GET /[id]': 'Get mentorship group by ID',
      'PUT /[id]': 'Update mentorship group',
      'DELETE /[id]': 'Delete mentorship group',
      'PATCH /[id]/students': 'Update student assignments',
      'PATCH /[id]/mentors': 'Update mentor assignments',
      'PATCH /[id]/status': 'Update group status',
      'PATCH /[id]/schedule': 'Update meeting schedule',
      'PATCH /[id]/communication': 'Update communication channels',
      'POST /[id]/meetings': 'Record group meeting'
    }
  },
  
  // ✅ ANALYTICS API
  analytics: {
    base: '/api/v2/analytics',
    endpoints: {
      'GET /': 'Get comprehensive analytics for missions, students, mentors, and groups',
      'GET /?missionId=:id': 'Get analytics for specific mission',
      'GET /?batchId=:id': 'Get analytics for specific batch',
      'GET /?timeRange=7d|30d|90d|1y': 'Get analytics for specific time range'
    }
  }
};

// ✅ V2 API FEATURES
export const V2_API_FEATURES = {
  // Authentication & Authorization
  auth: {
    session: 'NextAuth.js session validation',
    roleBased: 'Role-based access control',
    userContext: 'User context in all operations'
  },
  
  // Data Validation
  validation: {
    zod: 'Zod schema validation for all inputs',
    typeSafe: 'TypeScript type safety',
    errorHandling: 'Comprehensive error messages'
  },
  
  // Database Operations
  database: {
    mongodb: 'MongoDB with Mongoose ODM',
    population: 'Automatic reference population',
    indexing: 'Optimized database queries',
    transactions: 'Data consistency across operations'
  },
  
  // API Features
  features: {
    pagination: 'Standardized pagination with metadata',
    filtering: 'Advanced filtering and search',
    sorting: 'Flexible sorting options',
    bulkOperations: 'Bulk create, update, and delete',
    realTimeUpdates: 'Automatic count updates'
  },
  
  // Dual-Level Status Management
  statusManagement: {
    missionLevel: 'Mission-wide participant status',
    groupLevel: 'Group-specific participant status',
    independent: 'Independent status tracking',
    auditTrail: 'Status change history and reasons'
  }
};

// ✅ V2 API RESPONSE FORMAT
export const V2_API_RESPONSE_FORMAT = {
  success: {
    success: true,
    data: 'Response data or array',
    message: 'Success message (optional)',
    pagination: {
      page: 'Current page number',
      limit: 'Items per page',
      total: 'Total items count',
      totalPages: 'Total pages count',
      hasNext: 'Has next page boolean',
      hasPrev: 'Has previous page boolean'
    }
  },
  
  error: {
    success: false,
    error: 'Error message',
    details: 'Validation errors (if applicable)',
    code: 'Error code (optional)'
  }
};

// ✅ V2 API QUERY PARAMETERS
export const V2_API_QUERY_PARAMS = {
  // Common Parameters
  common: {
    page: 'Page number (default: 1)',
    limit: 'Items per page (default: 10, max: 100)',
    sortBy: 'Sort field name',
    sortOrder: 'Sort direction: asc | desc'
  },
  
  // Mission Parameters
  mission: {
    status: 'Mission status filter',
    batchId: 'Batch ID filter',
    search: 'Text search in title, code, description',
    createdBy: 'Creator user ID filter'
  },
  
  // Student Parameters
  student: {
    status: 'Student status filter',
    missionId: 'Mission ID filter',
    batchId: 'Batch ID filter',
    groupId: 'Mentorship group ID filter',
    isRegular: 'Regular attendance filter',
    attendanceRate: 'Attendance rate range filter',
    progress: 'Progress range filter'
  },
  
  // Mentor Parameters
  mentor: {
    status: 'Mentor status filter',
    role: 'Mentor role filter',
    missionId: 'Mission ID filter',
    batchId: 'Batch ID filter',
    specialization: 'Specialization filter',
    availabilityRate: 'Availability rate range filter',
    maxStudents: 'Max students capacity range filter'
  },
  
  // Group Parameters
  group: {
    status: 'Group status filter',
    missionId: 'Mission ID filter',
    batchId: 'Batch ID filter',
    primaryMentorId: 'Primary mentor ID filter',
    groupType: 'Group type filter',
    skillLevel: 'Skill level filter',
    isFull: 'Full capacity filter',
    isMinimumMet: 'Minimum participants filter'
  }
};

// ✅ V2 API STATUS CODES
export const V2_API_STATUS_CODES = {
  200: 'OK - Request successful',
  201: 'Created - Resource created successfully',
  400: 'Bad Request - Validation error or invalid input',
  401: 'Unauthorized - Authentication required',
  403: 'Forbidden - Insufficient permissions',
  404: 'Not Found - Resource not found',
  409: 'Conflict - Resource already exists',
  500: 'Internal Server Error - Server error'
};

// ✅ V2 API USAGE EXAMPLES
export const V2_API_USAGE_EXAMPLES = {
  // Create Mission
  createMission: {
    method: 'POST',
    url: '/api/v2/missions',
    body: {
      code: 'MISSION-001',
      title: 'Phitron Mission 1',
      description: 'Advanced web development mission',
      batchId: 'batchId123',
      startDate: '2024-01-01',
      endDate: '2024-03-31',
      maxStudents: 50
    }
  },
  
  // Assign Students
  assignStudents: {
    method: 'POST',
    url: '/api/v2/mission-students',
    body: {
      studentIds: ['student1', 'student2', 'student3'],
      missionId: 'missionId123',
      batchId: 'batchId123',
      status: 'active'
    }
  },
  
  // Create Group from Participants
  createGroup: {
    method: 'POST',
    url: '/api/v2/mentorship-groups',
    body: {
      name: 'React Masters',
      missionId: 'missionId123',
      batchId: 'batchId123',
      studentIds: ['student1', 'student2', 'student3'],
      primaryMentorId: 'mentorId123',
      groupType: 'study',
      focusArea: ['frontend', 'react']
    }
  },
  
  // Get Analytics
  getAnalytics: {
    method: 'GET',
    url: '/api/v2/analytics?missionId=missionId123&timeRange=30d'
  }
};

export default {
  V2_API_ROUTES,
  V2_API_FEATURES,
  V2_API_RESPONSE_FORMAT,
  V2_API_QUERY_PARAMS,
  V2_API_STATUS_CODES,
  V2_API_USAGE_EXAMPLES
};
