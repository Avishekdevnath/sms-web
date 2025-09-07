# **V2 API - Student Mission Management System**

## **🎉 PHASE 2: V2 API ROUTES COMPLETE!**

This directory contains the **V2 API routes** for the enhanced Student Mission Management System. All V2 API endpoints are prefixed with `/api/v2/` to avoid conflicts with the existing V1 system.

## **📋 V2 API OVERVIEW**

### **Core Features**
- **🔐 Authentication**: NextAuth.js session validation for all endpoints
- **✅ Validation**: Zod schema validation for all inputs
- **📊 Pagination**: Standardized pagination with metadata
- **🔍 Filtering**: Advanced filtering and search capabilities
- **📦 Bulk Operations**: Bulk create, update, and delete operations
- **🔗 Data Population**: Automatic reference population for responses
- **📈 Dual-Level Status**: Mission-level and group-level status management

### **API Structure**
```
/api/v2/
├── missions/              # Mission management
├── mission-students/      # Student-mission relationships
├── mission-mentors/       # Mentor-mission relationships
├── mentorship-groups/     # Group management
├── analytics/             # Comprehensive analytics
└── index.ts               # API documentation and exports
```

## **🚀 V2 API ENDPOINTS**

### **1. Missions API** (`/api/v2/missions`)
- **GET /** - List missions with filtering and pagination
- **POST /** - Create new mission
- **GET /[id]** - Get mission by ID with populated data
- **PUT /[id]** - Update mission
- **DELETE /[id]** - Delete mission

**Features:**
- Advanced filtering by status, batch, creator
- Text search in title, code, description
- Flexible sorting and pagination
- Automatic participant count updates

### **2. Mission Students API** (`/api/v2/mission-students`)
- **GET /** - List mission students with filtering and pagination
- **POST /** - Assign student to mission (single or bulk)
- **GET /[id]** - Get mission student by ID
- **PUT /[id]** - Update mission student
- **DELETE /[id]** - Remove student from mission

**Features:**
- Single and bulk student assignment
- Mission-level and group-level status management
- Progress and attendance tracking
- Advanced filtering by status, mission, group, attendance rate

### **3. Mission Mentors API** (`/api/v2/mission-mentors`)
- **GET /** - List mission mentors with filtering and pagination
- **POST /** - Assign mentor to mission (single or bulk)
- **GET /[id]** - Get mission mentor by ID
- **PUT /[id]** - Update mission mentor
- **DELETE /[id]** - Remove mentor from mission

**Features:**
- Single and bulk mentor assignment
- Mission-level and group-level status management
- Availability and capacity tracking
- Role-based filtering and sorting

### **4. Mentorship Groups API** (`/api/v2/mentorship-groups`)
- **GET /** - List mentorship groups with filtering and pagination
- **POST /** - Create new group or group from participants
- **GET /[id]** - Get group by ID
- **PUT /[id]** - Update group
- **DELETE /[id]** - Delete group

**Features:**
- Create groups from existing mission participants
- Student and mentor assignment management
- Meeting schedule and communication setup
- Group performance tracking

### **5. Analytics API** (`/api/v2/analytics`)
- **GET /** - Comprehensive analytics for missions, students, mentors, and groups
- **GET /?missionId=:id** - Analytics for specific mission
- **GET /?batchId=:id** - Analytics for specific batch
- **GET /?timeRange=7d|30d|90d|1y** - Analytics for specific time range

**Features:**
- Real-time statistics and metrics
- Performance analytics and trends
- Top performers identification
- Time-based data aggregation

## **🔧 V2 API IMPLEMENTATION DETAILS**

### **Authentication & Authorization**
```typescript
// All V2 endpoints require valid NextAuth.js session
const session = await getServerSession(authOptions);
if (!session?.user) {
  return NextResponse.json(
    { success: false, error: 'Unauthorized' },
    { status: 401 }
  );
}
```

### **Data Validation**
```typescript
// All inputs validated with Zod schemas
const validatedData = createMissionV2Schema.parse(body);
```

### **Error Handling**
```typescript
// Comprehensive error handling with appropriate status codes
if (error.name === 'ZodError') {
  return NextResponse.json(
    { 
      success: false, 
      error: 'Validation failed', 
      details: error.errors 
    },
    { status: 400 }
  );
}
```

### **Response Format**
```typescript
// Standardized success response
{
  success: true,
  data: responseData,
  message: 'Success message',
  pagination: {
    page: 1,
    limit: 10,
    total: 100,
    totalPages: 10,
    hasNext: true,
    hasPrev: false
  }
}

// Standardized error response
{
  success: false,
  error: 'Error message',
  details: 'Validation errors (if applicable)'
}
```

## **📊 V2 API FEATURES**

### **Dual-Level Status Management**
- **Mission-Level Status**: Overall participation status in the mission
- **Group-Level Status**: Specific status within individual mentorship groups
- **Independent Tracking**: Status changes don't affect other levels
- **Audit Trail**: Complete history of status changes with reasons

### **Bulk Operations**
- **Bulk Student Assignment**: Assign multiple students to a mission at once
- **Bulk Mentor Assignment**: Assign multiple mentors to a mission at once
- **Validation**: Ensures all participants are valid before assignment
- **Transaction Safety**: Maintains data consistency across operations

### **Advanced Filtering**
- **Status Filtering**: Filter by mission-level and group-level statuses
- **Range Filtering**: Filter by progress ranges, attendance rates, etc.
- **Text Search**: Search across titles, descriptions, and codes
- **Boolean Filtering**: Filter by regular attendance, group capacity, etc.

### **Real-Time Updates**
- **Automatic Count Updates**: Mission participant counts update automatically
- **Reference Population**: All responses include populated reference data
- **Performance Optimization**: Efficient queries with proper indexing

## **🧪 V2 API TESTING**

### **Test Endpoints**
```bash
# Test mission creation
curl -X POST /api/v2/missions \
  -H "Content-Type: application/json" \
  -d '{"code":"MISSION-001","title":"Test Mission","batchId":"..."}'

# Test student assignment
curl -X POST /api/v2/mission-students \
  -H "Content-Type: application/json" \
  -d '{"studentId":"...","missionId":"...","batchId":"..."}'

# Test analytics
curl -X GET "/api/v2/analytics?timeRange=30d"
```

### **Validation Testing**
- Test all required fields
- Test field format validation
- Test enum value validation
- Test bulk operation validation

## **📈 V2 API PERFORMANCE**

### **Database Optimization**
- **Indexed Queries**: All common query patterns are indexed
- **Population Strategy**: Efficient reference population
- **Pagination**: Prevents large result sets
- **Filtering**: Reduces data transfer

### **Response Optimization**
- **Lean Queries**: Minimize memory usage
- **Selective Population**: Only populate necessary fields
- **Cached Counts**: Fast participant statistics
- **Efficient Sorting**: Optimized sort operations

## **🔗 V2 API INTEGRATION**

### **Frontend Integration**
```typescript
// Example: Fetch missions with pagination
const response = await fetch('/api/v2/missions?page=1&limit=10&status=active');
const data = await response.json();

// Example: Create new mission
const response = await fetch('/api/v2/missions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(missionData)
});
```

### **Error Handling**
```typescript
// Handle API responses
if (data.success) {
  // Process successful response
  setMissions(data.data);
  setPagination(data.pagination);
} else {
  // Handle error
  setError(data.error);
  if (data.details) {
    // Handle validation errors
    setValidationErrors(data.details);
  }
}
```

## **📚 V2 API DOCUMENTATION**

### **Complete API Reference**
See `src/app/api/v2/index.ts` for:
- Complete endpoint documentation
- Query parameter specifications
- Response format examples
- Status code definitions
- Usage examples

### **Schema Definitions**
See `src/schemas/v2/` for:
- Input validation schemas
- Type definitions
- Field constraints
- Error messages

## **🎯 NEXT STEPS**

### **Phase 2 Status**: ✅ **COMPLETE**
- ✅ V2 Database Models
- ✅ V2 API Routes
- ✅ V2 API Infrastructure
- ✅ V2 API Documentation

### **Phase 3**: 🚧 **NEXT**
- 🚧 V2 UI Components
- 🚧 V2 Pages
- 🚧 V2 Integration

### **Phase 4**: 📋 **PLANNED**
- 📋 V2 Testing & Validation
- 📋 V2 Performance Optimization
- 📋 V2 Deployment

## **🔗 RELATED DOCUMENTS**

- **Architecture Document**: `STUDENT_MISSION_ARCHITECTURE.md`
- **V2 Models**: `src/models/v2/README.md`
- **V2 Schemas**: `src/schemas/v2/index.ts`
- **V2 API Index**: `src/app/api/v2/index.ts`

---

**🎉 V2 API is ready for Phase 3: UI Component Implementation!**
