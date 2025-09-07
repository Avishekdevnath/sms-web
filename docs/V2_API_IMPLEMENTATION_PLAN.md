# **V2 API Implementation Plan - Student Mission Management System**

## **📋 OVERVIEW**

This document outlines the **V2 API implementation** for the new Student Mission Management System architecture. All V2 APIs will be prefixed with `/api/v2/` to avoid conflicts with existing APIs.

## **🚀 IMPLEMENTATION PHASES**

### **Phase 1: V2 Database Models (Week 1)**
### **Phase 2: V2 API Routes (Week 2)**  
### **Phase 3: V2 UI Components (Week 3)**
### **Phase 4: Integration & Testing (Week 4)**

---

## **🗄️ PHASE 1: V2 DATABASE MODELS**

### **1.1 V2 Mission Model**
```typescript
// src/models/v2/Mission.ts
interface IMissionV2 {
  _id: string;
  code: string;                    // MISSION-001
  title: string;                   // "Phitron Mission 1"
  description?: string;
  batchId: Types.ObjectId;         // Reference to Batch
  startDate?: Date;
  endDate?: Date;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  
  // ✅ FAST RETRIEVAL FIELDS
  studentIds: Types.ObjectId[];    // Fast student count/listing
  totalStudents: number;           // Cached count
  mentorIds: Types.ObjectId[];     // Fast mentor count/listing
  totalMentors: number;            // Cached count
  groupIds: Types.ObjectId[];      // Fast group count/listing
  totalGroups: number;             // Cached count
  
  // Course Configuration
  courses: Array<{
    courseOfferingId: Types.ObjectId;
    weight: number;                // Percentage weight
    requiredAssignments: Types.ObjectId[];
    minProgress: number;
  }>;
  
  // Mission Configuration
  maxStudents?: number;
  requirements?: string[];
  rewards?: string[];
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
```

### **1.2 V2 MissionStudent Model**
```typescript
// src/models/v2/MissionStudent.ts
interface IMissionStudentV2 {
  _id: string;
  studentId: Types.ObjectId;         // Reference to User (Student)
  missionId: Types.ObjectId;         // Reference to Mission
  batchId: Types.ObjectId;           // Reference to Batch
  
  // ✅ MISSION-LEVEL STATUS
  status: 'active' | 'deactive' | 'irregular' | 'completed' | 'dropped' | 'on-hold';
  progress: number;                  // Overall mission progress (0-100)
  startedAt: Date;
  completedAt?: Date;
  lastActivity: Date;
  
  // Mission Participation
  isRegular: boolean;                // Regular attendance/participation
  attendanceRate: number;            // Attendance percentage (0-100)
  lastAttendanceDate?: Date;         // Last time student was present
  
  // Mission-Specific Notes
  missionNotes?: string;             // Admin notes about this student in mission
  irregularityReason?: string;       // Why marked as irregular
  deactivationReason?: string;       // Why deactivated
  
  // Group Assignment
  mentorshipGroupId?: Types.ObjectId; // Group assignment if any
  
  // ✅ GROUP-LEVEL STATUS
  groupStatus?: {
    status: 'active' | 'deactive' | 'irregular' | 'on-hold';
    reason?: string;                 // Why status changed in group
    changedAt: Date;                 // When group status was last changed
    changedBy: Types.ObjectId;       // Who changed the group status
    notes?: string;                  // Group-specific notes
  };
  
  // Progress Tracking
  courseProgress: Array<{
    courseOfferingId: Types.ObjectId;
    progress: number;                // Course-specific progress
    completedAssignments: Types.ObjectId[];
    lastActivity: Date;
    mentorFeedback?: string;         // Mentor's feedback on this course
  }>;
  createdAt: Date;
  updatedAt: Date;
}
```

### **1.3 V2 MissionMentor Model**
```typescript
// src/models/v2/MissionMentor.ts
interface IMissionMentorV2 {
  _id: string;
  mentorId: Types.ObjectId;          // Reference to User (Mentor)
  missionId: Types.ObjectId;         // Reference to Mission
  batchId: Types.ObjectId;           // Reference to Batch
  
  // ✅ MISSION-LEVEL STATUS
  status: 'active' | 'deactive' | 'irregular' | 'overloaded' | 'unavailable';
  role: 'mission-lead' | 'coordinator' | 'advisor' | 'supervisor';
  specialization: string[];          // e.g., ['frontend', 'react', 'javascript']
  responsibilities: string[];        // e.g., ['progress-review', 'quality-control', 'student-support']
  
  // Mission Participation
  isRegular: boolean;                // Regular availability/participation
  availabilityRate: number;          // Availability percentage (0-100)
  lastAvailableDate?: Date;          // Last time mentor was available
  
  // Mission-Specific Notes
  missionNotes?: string;             // Admin notes about this mentor in mission
  irregularityReason?: string;       // Why marked as irregular
  deactivationReason?: string;       // Why deactivated
  
  // Mentor Capacity & Status
  maxStudents: number;               // Maximum students this mentor can handle in mission
  currentStudents: number;           // Current student count in mission
  
  // Mission-Specific Mentor Performance
  missionRating: number;             // Average student rating for this mission (1-5)
  totalMentoredStudents: number;     // Total students mentored in this mission
  totalSessions: number;             // Total sessions conducted for this mission
  
  // Availability & Schedule
  availability: {
    days: number[];                  // [1,2,3,4,5] for Mon-Fri
    hours: { start: string, end: string }; // "09:00" to "17:00"
    timezone: string;                // "Asia/Dhaka"
    preferredSessionDuration: number; // Preferred session length in minutes
  };
  
  // Mission Groups
  assignedGroups: Types.ObjectId[];  // References to MentorshipGroup
  
  // ✅ GROUP-LEVEL STATUSES
  groupStatuses: Array<{
    groupId: Types.ObjectId;         // Reference to specific group
    status: 'active' | 'deactive' | 'irregular' | 'overloaded' | 'unavailable';
    reason?: string;                 // Why status changed in group
    changedAt: Date;                 // When group status was last changed
    changedBy: Types.ObjectId;       // Who changed the group status
    notes?: string;                  // Group-specific notes
    role: 'primary' | 'co-mentor' | 'moderator'; // Role in this specific group
  }>;
  
  // Mission Statistics
  stats: {
    avgStudentProgress: number;      // Average progress of mentored students in mission
    sessionCompletionRate: number;   // Percentage of completed sessions
    studentSatisfaction: number;     // Average satisfaction score
  };
  
  createdAt: Date;
  updatedAt: Date;
}
```

### **1.4 V2 MentorshipGroup Model**
```typescript
// src/models/v2/MentorshipGroup.ts
interface IMentorshipGroupV2 {
  _id: string;
  name: string;                      // "Group Alpha" or "React Masters"
  missionId: Types.ObjectId;         // Reference to Mission
  batchId: Types.ObjectId;           // Reference to Batch
  
  // ✅ GROUP IS FORMED FROM EXISTING MISSION PARTICIPANTS
  // Students must already be in MissionStudent collection
  // Mentors must already be in MissionMentor collection
  
  // Student Assignment (from MissionStudent)
  studentIds: Types.ObjectId[];      // Students from MissionStudent collection
  maxStudents: number;               // Maximum group size
  minStudents: number;               // Minimum group size
  
  // Mentor Assignment (from MissionMentor)
  primaryMentorId: Types.ObjectId;   // Primary mentor from MissionMentor collection
  coMentorIds: Types.ObjectId[];     // Co-mentors from MissionMentor collection
  
  // Group Status
  status: 'forming' | 'active' | 'inactive' | 'completed' | 'disbanded';
  
  // Group Configuration
  groupType: 'study' | 'project' | 'review' | 'workshop' | 'mixed';
  focusArea: string[];               // e.g., ['frontend', 'react', 'state-management']
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'mixed';
  
  // Meeting Schedule
  meetingSchedule: {
    frequency: 'weekly' | 'biweekly' | 'monthly' | 'on-demand';
    dayOfWeek?: number;              // 0-6 (Sunday-Saturday)
    time?: string;                   // "14:00"
    duration: number;                // Duration in minutes
    timezone: string;                // "Asia/Dhaka"
  };
  
  // Group Progress
  groupProgress: {
    overallProgress: number;          // Average of all students (0-100)
    lastMeetingDate?: Date;
    nextMeetingDate?: Date;
    totalMeetings: number;
    activeStudents: number;
  };
  
  // Communication
  communicationChannel?: {
    type: 'discord' | 'slack' | 'telegram' | 'whatsapp';
    channelId?: string;
    inviteLink?: string;
  };
  
  createdAt: Date;
  updatedAt: Date;
}
```

---

## **🔌 PHASE 2: V2 API ROUTES**

### **2.1 V2 Mission Routes**
```typescript
// src/app/api/v2/missions/route.ts
GET    /api/v2/missions                    // Get all missions with participant counts
POST   /api/v2/missions                    // Create new mission
GET    /api/v2/missions/[id]               // Get mission by ID
PUT    /api/v2/missions/[id]               // Update mission
DELETE /api/v2/missions/[id]               // Delete mission

// Additional mission endpoints
GET    /api/v2/missions/[id]/participants  // Get all students and mentors for mission
GET    /api/v2/missions/[id]/statistics    // Get mission statistics and progress
GET    /api/v2/missions/[id]/groups        // Get all groups for mission
```

### **2.2 V2 MissionStudent Routes**
```typescript
// src/app/api/v2/mission-students/route.ts
GET    /api/v2/mission-students                    // Get all mission students
POST   /api/v2/mission-students                    // Assign student to mission
GET    /api/v2/mission-students/[id]               // Get mission student by ID
PUT    /api/v2/mission-students/[id]               // Update mission student
DELETE /api/v2/mission-students/[id]               // Remove student from mission

// Mission-specific endpoints
GET    /api/v2/mission-students/mission/[missionId]           // Get all students for mission
GET    /api/v2/mission-students/mission/[missionId]/active    // Get active students
GET    /api/v2/mission-students/mission/[missionId]/inactive  // Get inactive students
GET    /api/v2/mission-students/mission/[missionId]/irregular // Get irregular students

// Group-specific endpoints
GET    /api/v2/mission-students/group/[groupId]               // Get all students for group
GET    /api/v2/mission-students/group/[groupId]/active        // Get active students in group
GET    /api/v2/mission-students/group/[groupId]/inactive      // Get inactive students in group

// Status management endpoints
PUT    /api/v2/mission-students/[id]/status                   // Update mission-level status
PUT    /api/v2/mission-students/[id]/group-status             // Update group-level status
PUT    /api/v2/mission-students/[id]/attendance               // Update attendance
PUT    /api/v2/mission-students/[id]/group-notes              // Update group-specific notes
```

### **2.3 V2 MissionMentor Routes**
```typescript
// src/app/api/v2/mission-mentors/route.ts
GET    /api/v2/mission-mentors                    // Get all mission mentors
POST   /api/v2/mission-mentors                    // Assign mentor to mission
GET    /api/v2/mission-mentors/[id]               // Get mission mentor by ID
PUT    /api/v2/mission-mentors/[id]               // Update mission mentor
DELETE /api/v2/mission-mentors/[id]               // Remove mentor from mission

// Mission-specific endpoints
GET    /api/v2/mission-mentors/mission/[missionId]           // Get all mentors for mission
GET    /api/v2/mission-mentors/mission/[missionId]/active    // Get active mentors
GET    /api/v2/mission-mentors/mission/[missionId]/available // Get available mentors
GET    /api/v2/mission-mentors/mission/[missionId]/by-role   // Get mentors by role

// Group-specific endpoints
GET    /api/v2/mission-mentors/group/[groupId]               // Get all mentors for group
GET    /api/v2/mission-mentors/group/[groupId]/active        // Get active mentors in group
GET    /api/v2/mission-mentors/group/[groupId]/by-role       // Get mentors by role in group

// Status management endpoints
PUT    /api/v2/mission-mentors/[id]/status                   // Update mission-level status
PUT    /api/v2/mission-mentors/[id]/group-status             // Update group-level status
PUT    /api/v2/mission-mentors/[id]/availability             // Update availability
PUT    /api/v2/mission-mentors/[id]/capacity                 // Update max students
PUT    /api/v2/mission-mentors/[id]/group-role               // Update role in specific group
PUT    /api/v2/mission-mentors/[id]/group-notes              // Update group-specific notes
```

### **2.4 V2 MentorshipGroup Routes**
```typescript
// src/app/api/v2/mentorship-groups/route.ts
GET    /api/v2/mentorship-groups                    // Get all mentorship groups
POST   /api/v2/mentorship-groups                    // Create new group
GET    /api/v2/mentorship-groups/[id]               // Get group by ID
PUT    /api/v2/mentorship-groups/[id]               // Update group
DELETE /api/v2/mentorship-groups/[id]               // Delete group

// Mission-specific endpoints
GET    /api/v2/mentorship-groups/mission/[missionId]         // Get all groups for mission
GET    /api/v2/mentorship-groups/mission/[missionId]/active  // Get active groups

// Assignment endpoints
PUT    /api/v2/mentorship-groups/[id]/students               // Update student assignments
PUT    /api/v2/mentorship-groups/[id]/mentors                // Update mentor assignments
PUT    /api/v2/mentorship-groups/[id]/progress               // Update group progress

// Group management endpoints
PUT    /api/v2/mentorship-groups/[id]/status                 // Update group status
PUT    /api/v2/mentorship-groups/[id]/schedule               // Update meeting schedule
PUT    /api/v2/mentorship-groups/[id]/communication          // Update communication channels
```

### **2.5 V2 Statistics & Analytics Routes**
```typescript
// src/app/api/v2/analytics/route.ts
GET    /api/v2/analytics/mission/[missionId]/overview        // Mission overview statistics
GET    /api/v2/analytics/mission/[missionId]/students        // Student performance analytics
GET    /api/v2/analytics/mission/[missionId]/mentors         // Mentor performance analytics
GET    /api/v2/analytics/mission/[missionId]/groups          // Group performance analytics
GET    /api/v2/analytics/group/[groupId]/overview            // Group overview statistics
GET    /api/v2/analytics/group/[groupId]/students            // Group student analytics
GET    /api/v2/analytics/group/[groupId]/mentors             // Group mentor analytics
```

---

## **🎨 PHASE 3: V2 UI COMPONENTS & PAGES**

### **3.1 V2 Admin Dashboard Components**

#### **3.1.1 V2 Mission Management**
```typescript
// src/components/v2/admin/MissionManagement/
├── MissionListV2.tsx              // Enhanced mission list with participant counts
├── MissionCreateV2.tsx            // Create new mission form
├── MissionEditV2.tsx              // Edit mission form
├── MissionOverviewV2.tsx          // Mission dashboard with statistics
├── MissionParticipantsV2.tsx      // Manage mission participants
└── MissionStatisticsV2.tsx        // Mission performance analytics
```

#### **3.1.2 V2 Participant Management**
```typescript
// src/components/v2/admin/ParticipantManagement/
├── StudentAssignmentV2.tsx        // Assign students to missions
├── MentorAssignmentV2.tsx         // Assign mentors to missions
├── ParticipantStatusV2.tsx        // Manage participant statuses
├── AttendanceTrackingV2.tsx       // Track student attendance
├── AvailabilityManagementV2.tsx   // Manage mentor availability
└── BulkOperationsV2.tsx           // Bulk participant operations
```

#### **3.1.3 V2 Group Management**
```typescript
// src/components/v2/admin/GroupManagement/
├── GroupFormationV2.tsx           // Create groups from participants
├── GroupAssignmentV2.tsx          // Assign participants to groups
├── GroupStatusV2.tsx              // Manage group statuses
├── GroupScheduleV2.tsx            // Manage group meeting schedules
├── GroupCommunicationV2.tsx       // Setup communication channels
└── GroupProgressV2.tsx            // Track group progress
```

### **3.2 V2 Mission Hub Components**

#### **3.2.1 V2 Mission Overview**
```typescript
// src/components/v2/mission-hub/
├── MissionDashboardV2.tsx         // Enhanced mission dashboard
├── ParticipantOverviewV2.tsx      // Participant status overview
├── GroupOverviewV2.tsx            // Group status overview
├── ProgressTrackingV2.tsx         // Mission progress tracking
└── QuickActionsV2.tsx             // Quick action buttons
```

#### **3.2.2 V2 Group Management**
```typescript
// src/components/v2/mission-hub/groups/
├── GroupListV2.tsx                // List all groups for mission
├── GroupDetailsV2.tsx             // Group detailed view
├── GroupParticipantsV2.tsx        // Manage group participants
├── GroupScheduleV2.tsx            // Group meeting schedule
├── GroupCommunicationV2.tsx       // Group communication tools
└── GroupProgressV2.tsx            // Group progress tracking
```

### **3.3 V2 Student & Mentor Views**

#### **3.3.1 V2 Student Dashboard**
```typescript
// src/components/v2/student/
├── StudentMissionViewV2.tsx       // Student's mission overview
├── StudentGroupViewV2.tsx         // Student's group information
├── StudentProgressV2.tsx          // Student progress tracking
├── StudentAttendanceV2.tsx        // Student attendance tracking
└── StudentFeedbackV2.tsx          // Student feedback display
```

#### **3.3.2 V2 Mentor Dashboard**
```typescript
// src/components/v2/mentor/
├── MentorMissionViewV2.tsx        // Mentor's mission overview
├── MentorGroupViewV2.tsx          // Mentor's group management
├── MentorStudentsV2.tsx           // Mentor's student list
├── MentorAvailabilityV2.tsx       // Mentor availability management
├── MentorPerformanceV2.tsx        // Mentor performance metrics
└── MentorFeedbackV2.tsx           // Mentor feedback submission
```

### **3.4 V2 Shared Components**

#### **3.4.1 V2 Status Management**
```typescript
// src/components/v2/shared/
├── StatusBadgeV2.tsx              // Enhanced status badges
├── StatusUpdateModalV2.tsx        // Status update modal
├── DualStatusDisplayV2.tsx        // Display mission + group status
├── StatusHistoryV2.tsx            // Status change history
└── StatusFilterV2.tsx             // Status filtering controls
```

#### **3.4.2 V2 Data Display**
```typescript
// src/components/v2/shared/
├── ParticipantTableV2.tsx         // Enhanced participant table
├── ProgressChartV2.tsx            // Progress visualization
├── StatisticsCardV2.tsx           // Statistics display cards
├── QuickStatsV2.tsx               // Quick statistics display
└── DataExportV2.tsx               // Data export functionality
```

---

## **📱 PHASE 4: V2 PAGES STRUCTURE**

### **4.1 V2 Admin Pages**
```typescript
// src/app/v2/admin/
├── missions/
│   ├── page.tsx                    // Mission list
│   ├── create/page.tsx             // Create mission
│   ├── [id]/page.tsx               // Mission details
│   ├── [id]/edit/page.tsx          // Edit mission
│   ├── [id]/participants/page.tsx  // Manage participants
│   └── [id]/statistics/page.tsx    // Mission statistics
├── participants/
│   ├── students/page.tsx           // Student management
│   ├── mentors/page.tsx            // Mentor management
│   └── bulk-operations/page.tsx    // Bulk operations
└── groups/
    ├── page.tsx                    // Group management
    ├── create/page.tsx             // Create group
    └── [id]/page.tsx               // Group details
```

### **4.2 V2 Mission Hub Pages**
```typescript
// src/app/v2/mission-hub/
├── page.tsx                        // Mission hub overview
├── [missionId]/page.tsx            // Mission dashboard
├── [missionId]/participants/page.tsx // Participant overview
├── [missionId]/groups/page.tsx     // Group overview
├── [missionId]/groups/[groupId]/page.tsx // Group details
├── [missionId]/statistics/page.tsx // Mission statistics
└── [missionId]/settings/page.tsx   // Mission settings
```

### **4.3 V2 Student & Mentor Pages**
```typescript
// src/app/v2/
├── student/
│   ├── missions/page.tsx           // Student missions
│   ├── missions/[missionId]/page.tsx // Mission details
│   └── groups/[groupId]/page.tsx   // Group details
└── mentor/
    ├── missions/page.tsx           // Mentor missions
    ├── missions/[missionId]/page.tsx // Mission details
    ├── groups/[groupId]/page.tsx   // Group management
    └── students/page.tsx           // Student management
```

---

## **🔧 IMPLEMENTATION CHECKLIST**

### **Week 1: V2 Database Models**
- [ ] Create V2 Mission model with fast retrieval arrays
- [ ] Create V2 MissionStudent model with dual-level status
- [ ] Create V2 MissionMentor model with dual-level status
- [ ] Create V2 MentorshipGroup model
- [ ] Add proper indexes and validation
- [ ] Create data migration scripts

### **Week 2: V2 API Routes**
- [ ] Implement V2 Mission routes
- [ ] Implement V2 MissionStudent routes
- [ ] Implement V2 MissionMentor routes
- [ ] Implement V2 MentorshipGroup routes
- [ ] Implement V2 Analytics routes
- [ ] Add proper error handling and validation

### **Week 3: V2 UI Components**
- [ ] Create V2 Admin components
- [ ] Create V2 Mission Hub components
- [ ] Create V2 Student & Mentor components
- [ ] Create V2 Shared components
- [ ] Implement dual-level status management UI
- [ ] Add responsive design and accessibility

### **Week 4: V2 Pages & Integration**
- [ ] Create V2 Admin pages
- [ ] Create V2 Mission Hub pages
- [ ] Create V2 Student & Mentor pages
- [ ] Integrate V2 components with pages
- [ ] Add navigation and routing
- [ ] Test all functionality

---

## **✅ SUCCESS CRITERIA**

- [ ] **No API Conflicts**: All V2 APIs use `/api/v2/` prefix
- [ ] **Dual-Level Status**: Mission and group status management working
- [ ] **Performance**: Fast retrieval with cached counts
- [ ] **UI Integration**: All components properly integrated
- [ ] **Responsive Design**: Mobile and desktop compatible
- [ ] **Accessibility**: WCAG 2.1 AA compliant
- [ ] **Testing**: All CRUD operations tested
- [ ] **Documentation**: Complete API documentation

---

**Document Version**: 1.0  
**Status**: Ready for Implementation  
**Focus**: V2 API-first approach, no conflicts with existing system
