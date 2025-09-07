# **Student Mission Management System Architecture**

## **Current Codebase Status**

- ✅ Mission model exists but needs updates (has embedded mentors, missing studentIds/mentorIds arrays)
- ✅ StudentMission collection exists but needs interface updates
- ✅ MissionMentor collection exists but needs interface updates  
- ✅ MentorshipGroup collection exists but needs interface updates
- ✅ Basic API endpoints exist for all collections
- ✅ UI components exist but need updates for new architecture

## **New Architecture: Single Solution**

### **Core Principle**
- **Mission Model**: Contains fast retrieval arrays (studentIds, mentorIds, groupIds) + cached counts
- **MissionStudent Collection**: Detailed student-mission relationships with mission-specific attributes
- **MissionMentor Collection**: Detailed mentor-mission relationships with mission-specific attributes
- **MentorshipGroup Collection**: Groups formed FROM existing mission participants
- **Fast Retrieval**: Mission model stores ObjectIds for quick access, detailed data in separate collections

## **Complete Model Structure**

### **1. Mission Model (Updated - Fast Retrieval + References)**
```typescript
interface IMission {
  _id: string;
  code: string;                    // MISSION-001
  title: string;                   // "Phitron Mission 1"
  description?: string;
  batchId: Types.ObjectId;         // Reference to Batch
  startDate?: Date;
  endDate?: Date;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  
  // ✅ FAST RETRIEVAL FIELDS (Just Object IDs)
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

### **2. MissionStudent Collection (Updated Interface)**
```typescript
interface IMissionStudent {
  _id: string;
  studentId: Types.ObjectId;         // Reference to User (Student)
  missionId: Types.ObjectId;         // Reference to Mission
  batchId: Types.ObjectId;           // Reference to Batch
  
  // ✅ MISSION-LEVEL STATUS (Overall mission participation)
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
  
  // Group Assignment (formed from mission participants)
  mentorshipGroupId?: Types.ObjectId; // Group assignment if any
  
  // ✅ GROUP-LEVEL STATUS (Specific to mentorship group)
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

### **3. MissionMentor Collection (Updated Interface)**
```typescript
interface IMissionMentor {
  _id: string;
  mentorId: Types.ObjectId;          // Reference to User (Mentor)
  missionId: Types.ObjectId;         // Reference to Mission
  batchId: Types.ObjectId;           // Reference to Batch
  
  // ✅ MISSION-LEVEL STATUS (Overall mission participation)
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
  
  // Mission Groups (formed from mission participants)
  assignedGroups: Types.ObjectId[];  // References to MentorshipGroup
  
  // ✅ GROUP-LEVEL STATUS (Specific to mentorship groups)
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

### **4. MentorshipGroup Collection (Updated Interface)**
```typescript
interface IMentorshipGroup {
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



### **5. Supporting Collections**
```typescript
interface IUser {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'mentor' | 'student' | 'developer' | 'sre';
}

interface IBatch {
  _id: string;
  code: string;                     // BATCH-006
  title: string;                    // "Phitron Batch 6"
}

interface IStudentBatchMembership {
  _id: string;
  studentId: Types.ObjectId;        // Reference to User
  batchId: Types.ObjectId;          // Reference to Batch
  status: 'pending' | 'approved' | 'rejected';
}
```

## **Model Relationships**

```
Mission (MISSION-001)
    ↓ (mentorIds array)
User (Mentor records) ← Existing mentor users
    ↓ (mentorshipGroups)
MentorshipGroup (Group Alpha)
    ↓ (primaryMentorId, coMentors)
User (Group-Level Mentors) ← Specific group mentors
    ↓ (students array)
User (Student records)

Mission (MISSION-001)
    ↓ (studentIds array)
User (Student records)

Mission (MISSION-001)
    ↓ (missionId)
StudentMission ← Detailed student-mission data
    ↓ (studentId)
User (Student records)
    ↓ (mentorshipGroupId)
MentorshipGroup ← Group assignment

Mission (MISSION-001)
    ↓ (groupIds array)
MentorshipGroup ← Fast group access
```

## **Data Flow & Operations**

### **✅ DUAL-LEVEL STATUS MANAGEMENT**

The system now supports **two levels of status management** for both students and mentors:

#### **Level 1: Mission-Level Status**
- **Overall participation** in the mission
- **Global status** that affects mission-wide operations
- **Examples**: Student dropped from entire mission, mentor unavailable for all mission activities

#### **Level 2: Group-Level Status**
- **Specific participation** within a mentorship group
- **Local status** that only affects group activities
- **Examples**: Student temporarily inactive in group due to illness, mentor overloaded in specific group

#### **Status Independence**
- A student can be **active in mission** but **deactive in group**
- A mentor can be **active in mission** but **overloaded in group**
- Status changes at one level don't automatically affect the other level

### **Student Assignment Flow**
```
1. Admin adds student to mission
   → Create StudentMission record
   → Add studentId to Mission.studentIds array
   → Update Mission.totalStudents count

2. Admin assigns student to group
   → Update StudentMission.mentorshipGroupId
   → Add studentId to MentorshipGroup.studentIds array
   → Initialize groupStatus (default: active)
   → Update group progress

3. Student progress update
   → Update StudentMission.courseProgress
   → Recalculate StudentMission.progress
   → Update MentorshipGroup.groupProgress

4. Group-specific status change
   → Update MissionStudent.groupStatus
   → Update MentorshipGroup.groupProgress.activeStudents
   → Notify group mentors of status change
```

### **Mentor Assignment Flow**
```
1. Admin creates MentorshipGroup
   → Assign primaryMentorId
   → Assign coMentors array

2. Mentor schedules session
   → Create MentorSession record
   → Link to group and mission

3. Session completion
   → Update session status
   → Record student feedback
   → Update progress metrics
```

## **Query Patterns**

### **✅ DUAL-LEVEL STATUS QUERIES**

#### **Mission-Level Status Queries**
```typescript
// Get all active students in mission
const activeStudents = await MissionStudent.find({
  missionId: missionId,
  status: 'active'
});

// Get all available mentors in mission
const availableMentors = await MissionMentor.find({
  missionId: missionId,
  status: 'active'
});
```

#### **Group-Level Status Queries**
```typescript
// Get students active in specific group
const groupActiveStudents = await MissionStudent.find({
  mentorshipGroupId: groupId,
  'groupStatus.status': 'active'
});

// Get mentors active in specific group
const groupActiveMentors = await MissionMentor.find({
  'groupStatuses.groupId': groupId,
  'groupStatuses.status': 'active'
});

// Get primary mentor for group
const primaryMentor = await MissionMentor.findOne({
  'groupStatuses.groupId': groupId,
  'groupStatuses.role': 'primary',
  'groupStatuses.status': 'active'
});
```

#### **Combined Status Queries**
```typescript
// Get students active in mission but inactive in group
const missionActiveGroupInactive = await MissionStudent.find({
  missionId: missionId,
  status: 'active',
  'groupStatus.status': { $ne: 'active' }
});

// Get mentors available in mission but overloaded in specific group
const missionAvailableGroupOverloaded = await MissionMentor.find({
  missionId: missionId,
  status: 'active',
  'groupStatuses': {
    $elemMatch: {
      groupId: groupId,
      status: 'overloaded'
    }
  }
});
```

### **Fast Student Retrieval (Mission Model)**
```typescript
// Get mission with student count (fast)
const mission = await Mission.findById(missionId);
console.log(`Mission has ${mission.totalStudents} students`);

// Get student IDs for quick operations
const studentIds = mission.studentIds;
```

### **Mission-Level Mentors**
```typescript
// Get mission coordinators and advisors
const mission = await Mission.findById(missionId);
const mentors = await Mentor.find({
  _id: { $in: mission.mentorIds }
}).populate('userId', 'name email');
const missionLeads = mentors.filter(m => m.role === 'mission-lead');
const coordinators = mentors.filter(m => m.role === 'coordinator');
```

### **Mentor Collection Queries**
```typescript
// Find available mentors for a mission
const availableMentors = await Mentor.find({
  missionId: missionId,
  status: 'active',
  $expr: { $lt: ['$currentStudents', '$maxStudents'] }
}).populate('userId', 'name email specialization');

// Find mentors by specialization
const frontendMentors = await Mentor.find({
  missionId: missionId,
  specialization: { $in: ['frontend', 'react'] },
  status: 'active'
}).populate('userId', 'name email');
```

### **Detailed Student Data (StudentMission)**
```typescript
// Get detailed student information
const students = await StudentMission.find({
  missionId: missionId,
  status: { $ne: 'dropped' }
}).populate('studentId', 'name email');
```

### **Group-Specific Mentors**
```typescript
// Get mentors for a specific group
const group = await MentorshipGroup.findById(groupId);
const mentors = await User.find({
  _id: { $in: [group.primaryMentorId, ...group.coMentors] }
});
```

### **Mission Statistics**
```typescript
// Get mission progress from StudentMission
const stats = await StudentMission.aggregate([
  { $match: { missionId: missionId } },
  { $group: {
    _id: '$status',
    count: { $sum: 1 },
    avgProgress: { $avg: '$progress' }
  }}
]);
```

## **Performance Indexes**

### **Mission Indexes**
```typescript
{ code: 1 }                         // Unique mission code
{ batchId: 1, status: 1 }          // Batch + status queries
{ createdBy: 1 }                    // Creator's missions
{ "studentIds": 1 }                 // Fast student lookup
{ "mentorIds": 1 }                  // Fast mentor lookup
{ "groupIds": 1 }                   // Fast group lookup
```

### **User Indexes (for Mentors)**
```typescript
{ role: 1, batchId: 1 }            // Find mentors by role and batch
{ _id: 1 }                          // Fast mentor lookup by ID
```

### **StudentMission Indexes**
```typescript
{ missionId: 1, studentId: 1 }     // Unique constraint
{ studentId: 1, missionId: 1 }     // Student's missions
{ batchId: 1, missionId: 1 }       // Batch-specific missions
{ status: 1, missionId: 1 }        // Status filtering
{ mentorshipGroupId: 1 }            // Group-based queries
{ isActiveInMission: 1, missionId: 1 } // Active students in mission
{ isActiveInGroup: 1, mentorshipGroupId: 1 } // Active students in group
```
### **MissionMentor Indexes**
```typescript
{ missionId: 1, mentorId: 1 }      // Unique constraint
{ mentorId: 1, missionId: 1 }      // Mentor's missions
{ batchId: 1, missionId: 1 }       // Batch-specific missions
{ role: 1, missionId: 1 }          // Role-based queries
{ isActiveInMission: 1, missionId: 1 } // Active mentors in mission
{ status: 1, missionId: 1 }        // Status filtering
{ specialization: 1, missionId: 1 } // Specialization queries
```

### **MentorshipGroup Indexes**
```typescript
{ missionId: 1, status: 1 }        // Mission's groups
{ primaryMentorId: 1 }             // Mentor's primary groups
{ coMentors: 1 }                   // Mentor's co-mentor groups
{ batchId: 1, status: 1 }          // Batch-specific groups
```

## **Implementation Plan**

### **Phase 1: Core Structure (Week 1)**
1. Update Mission model (add studentIds, totalStudents, mentorIds, groupIds, totalGroups)
2. Create MissionStudent collection with proper schema
3. Create MissionMentor collection with proper schema
4. Create MentorshipGroup collection
5. Add proper indexes

### **Phase 2: Mission Participant System (Week 2)**
1. Implement student assignment to missions (MissionStudent)
2. Implement mentor assignment to missions (MissionMentor)
3. Add mission-specific attributes (active, deactive, irregular)
4. Implement status management and tracking

### **Phase 3: Group Formation System (Week 3)**
1. Implement group creation FROM mission participants
2. Update MentorshipGroup with participant references
3. Add group management APIs
4. Implement MentorSession collection

### **Phase 4: UI & Testing (Week 4)**
1. Update admin missions page
2. Update mission hub
3. Test all functionality

## **🔧 API-LEVEL IMPLEMENTATION CHECKLIST**

### **Phase 1: V2 Database Models (Week 1)**

#### **1.1 Create V2 Mission Model**
- [ ] **Create new V2 Mission model with fast retrieval fields:**
  - [ ] `studentIds: [ObjectId]` array
  - [ ] `totalStudents: Number` cached count
  - [ ] `mentorIds: [ObjectId]` array  
  - [ ] `totalMentors: Number` cached count
  - [ ] `groupIds: [ObjectId]` array
  - [ ] `totalGroups: Number` cached count
- [ ] **Add V2 Mission schema indexes:**
  - [ ] `{ "studentIds": 1 }` for fast student lookup
  - [ ] `{ "mentorIds": 1 }` for fast mentor lookup
  - [ ] `{ "groupIds": 1 }` for fast group lookup
- [ ] **Add pre-save middleware** to auto-update cached counts
- [ ] **Create V2 model file**: `src/models/v2/Mission.ts`

#### **1.2 Create V2 MissionStudent Model**
- [ ] **Create new V2 MissionStudent model with dual-level status:**
  - [ ] `isRegular: Boolean` for attendance tracking
  - [ ] `attendanceRate: Number` for attendance percentage
  - [ ] `lastAttendanceDate: Date` for last attendance
  - [ ] `missionNotes: String` for admin notes
  - [ ] `irregularityReason: String` for irregular status
  - [ ] `deactivationReason: String` for deactivation
  - [ ] `status: String` enum with new values (active, deactive, irregular, completed, dropped, on-hold)
  - [ ] **✅ NEW: Group-level status object:**
    - [ ] `groupStatus.status: String` enum (active, deactive, irregular, on-hold)
    - [ ] `groupStatus.reason: String` for status change reason
    - [ ] `groupStatus.changedAt: Date` for timestamp
    - [ ] `groupStatus.changedBy: ObjectId` for who changed it
    - [ ] `groupStatus.notes: String` for group-specific notes
- [ ] **Add V2 MissionStudent indexes:**
  - [ ] `{ status: 1, missionId: 1 }` for status filtering
  - [ ] `{ isRegular: 1, missionId: 1 }` for regular students
  - [ ] `{ mentorshipGroupId: 1 }` for group queries
  - [ ] **✅ NEW: Group-level status indexes:**
    - [ ] `{ "groupStatus.status": 1, mentorshipGroupId: 1 }` for group status filtering
    - [ ] `{ "groupStatus.status": 1, missionId: 1 }` for mission-wide group status
- [ ] **Create V2 model file**: `src/models/v2/MissionStudent.ts`

#### **1.3 Create V2 MissionMentor Model**
- [ ] **Create new V2 MissionMentor model with dual-level status:**
  - [ ] `batchId: ObjectId` for batch reference
  - [ ] `isRegular: Boolean` for availability tracking
  - [ ] `availabilityRate: Number` for availability percentage
  - [ ] `lastAvailableDate: Date` for last availability
  - [ ] `missionNotes: String` for admin notes
  - [ ] `irregularityReason: String` for irregular status
  - [ ] `deactivationReason: String` for deactivation
  - [ ] `status: String` enum with new values (active, deactive, irregular, overloaded, unavailable)
  - [ ] `role: String` enum with new values (mission-lead, coordinator, advisor, supervisor)
  - [ ] `responsibilities: [String]` array for mentor responsibilities
  - [ ] `missionRating: Number` for performance tracking
  - [ ] `totalMentoredStudents: Number` for mission-specific count
  - [ ] `totalSessions: Number` for mission-specific count
  - [ ] `availability: Object` with days, hours, timezone, session duration
  - [ ] `assignedGroups: [ObjectId]` array for group references
  - [ ] **✅ NEW: Group-level statuses array:**
    - [ ] `groupStatuses: Array` of group-specific status objects
    - [ ] `groupStatuses[].groupId: ObjectId` for group reference
    - [ ] `groupStatuses[].status: String` enum (active, deactive, irregular, overloaded, unavailable)
    - [ ] `groupStatuses[].reason: String` for status change reason
    - [ ] `groupStatuses[].changedAt: Date` for timestamp
    - [ ] `groupStatuses[].changedBy: ObjectId` for who changed it
    - [ ] `groupStatuses[].notes: String` for group-specific notes
    - [ ] `groupStatuses[].role: String` enum (primary, co-mentor, moderator) for group role
  - [ ] `stats: Object` with progress, completion rate, satisfaction
- [ ] **Add V2 MissionMentor indexes:**
  - [ ] `{ batchId: 1, missionId: 1 }` for batch-specific queries
  - [ ] `{ role: 1, missionId: 1 }` for role-based queries
  - [ ] `{ status: 1, missionId: 1 }` for status filtering
  - [ ] `{ isRegular: 1, missionId: 1 }` for regular mentors
  - [ ] **✅ NEW: Group-level status indexes:**
    - [ ] `{ "groupStatuses.groupId": 1, "groupStatuses.status": 1 }` for group status filtering
    - [ ] `{ "groupStatuses.role": 1, "groupStatuses.groupId": 1 }` for group role queries
- [ ] **Create V2 model file**: `src/models/v2/MissionMentor.ts`

#### **1.4 Create V2 MentorshipGroup Model**
- [ ] **Create new V2 MentorshipGroup model with participant references:**
  - [ ] `studentIds: [ObjectId]` array (students from MissionStudent collection)
  - [ ] `primaryMentorId: ObjectId` (primary mentor from MissionMentor collection)
  - [ ] `coMentorIds: [ObjectId]` array (co-mentors from MissionMentor collection)
- [ ] **Add new fields:**
  - [ ] `minStudents: Number` for minimum group size
  - [ ] `groupType: String` enum (study, project, review, workshop, mixed)
  - [ ] `focusArea: [String]` array for group focus
  - [ ] `skillLevel: String` enum (beginner, intermediate, advanced, mixed)
  - [ ] `meetingSchedule.frequency: String` enum (weekly, biweekly, monthly, on-demand)
  - [ ] `meetingSchedule.timezone: String` for timezone
  - [ ] `groupProgress.activeStudents: Number` for active student count
- [ ] **Add V2 MentorshipGroup indexes:**
  - [ ] `{ primaryMentorId: 1 }` for primary mentor queries
  - [ ] `{ coMentorIds: 1 }` for co-mentor queries
- [ ] **Create V2 model file**: `src/models/v2/MentorshipGroup.ts`

### **Phase 2: V2 API Routes (Week 2)** ✅ **COMPLETE**

#### **2.1 Create V2 Mission API Routes** ✅ **COMPLETE**
- [x] **Create new V2 API routes with `/api/v2/` prefix:**
  - [x] `GET /api/v2/missions` - Get all missions with participant counts
  - [x] `POST /api/v2/missions` - Create new mission
  - [x] `GET /api/v2/missions/[id]` - Get mission by ID
  - [x] `PUT /api/v2/missions/[id]` - Update mission
  - [x] `DELETE /api/v2/missions/[id]` - Delete mission
- [x] **Add V2 mission endpoints:**
  - [x] `GET /api/v2/missions/[id]/participants` - Get all students and mentors for mission
  - [x] `GET /api/v2/missions/[id]/statistics` - Get mission statistics and progress
  - [x] `GET /api/v2/missions/[id]/groups` - Get all groups for mission
- [x] **Create V2 API file**: `src/app/api/v2/missions/route.ts`

#### **2.2 Create V2 MissionStudent API Routes** ✅ **COMPLETE**
- [x] **Create new V2 API routes with `/api/v2/` prefix:**
  - [x] `GET /api/v2/mission-students` - Get all mission students
  - [x] `POST /api/v2/mission-students` - Assign student to mission (single or bulk)
  - [x] `GET /api/v2/mission-students/[id]` - Get mission student by ID
  - [x] `PUT /api/v2/mission-students/[id]` - Update mission student
  - [x] `DELETE /api/v2/mission-students/[id]` - Remove student from mission
- [x] **Add V2 mission-specific endpoints:**
  - [x] `GET /api/v2/mission-students/mission/[missionId]` - Get all students for mission
  - [x] `GET /api/v2/mission-students/mission/[missionId]/active` - Get active students
  - [x] `GET /api/v2/mission-students/mission/[missionId]/inactive` - Get inactive students
  - [x] `GET /api/v2/mission-students/mission/[missionId]/irregular` - Get irregular students
- [x] **Add V2 group-specific endpoints:**
  - [x] `GET /api/v2/mission-students/group/[groupId]` - Get all students for group
  - [x] `GET /api/v2/mission-students/group/[groupId]/active` - Get active students in group
  - [x] `GET /api/v2/mission-students/group/[groupId]/inactive` - Get inactive students in group
- [x] **Add V2 status management endpoints:**
  - [x] `PUT /api/v2/mission-students/[id]/status` - Update mission-level status
  - [x] `PUT /api/v2/mission-students/[id]/group-status` - Update group-specific status
  - [x] `PUT /api/v2/mission-students/[id]/attendance` - Update attendance
  - [x] `PUT /api/v2/mission-students/[id]/group-notes` - Update group-specific notes
- [x] **Create V2 API file**: `src/app/api/v2/mission-students/route.ts`

#### **2.3 Create V2 MissionMentor API Routes** ✅ **COMPLETE**
- [x] **Create new V2 API routes with `/api/v2/` prefix:**
  - [x] `GET /api/v2/mission-mentors` - Get all mission mentors
  - [x] `POST /api/v2/mission-mentors` - Assign mentor to mission (single or bulk)
  - [x] `GET /api/v2/mission-mentors/[id]` - Get mission mentor by ID
  - [x] `PUT /api/v2/mission-mentors/[id]` - Update mission mentor
  - [x] `DELETE /api/v2/mission-mentors/[id]` - Remove mentor from mission
- [x] **Add V2 mission-specific endpoints:**
  - [x] `GET /api/v2/mission-mentors/mission/[missionId]` - Get all mentors for mission
  - [x] `GET /api/v2/mission-mentors/mission/[missionId]/active` - Get active mentors
  - [x] `GET /api/v2/mission-mentors/mission/[missionId]/available` - Get available mentors
  - [x] `GET /api/v2/mission-mentors/mission/[missionId]/by-role` - Get mentors by role
- [x] **Add V2 group-specific endpoints:**
  - [x] `GET /api/v2/mission-mentors/group/[groupId]` - Get all mentors for group
  - [x] `GET /api/v2/mission-mentors/group/[groupId]/active` - Get active mentors in group
  - [x] `GET /api/v2/mission-mentors/group/[groupId]/by-role` - Get mentors by role in group
- [x] **Add V2 status management endpoints:**
  - [x] `PUT /api/v2/mission-mentors/[id]/status` - Update mission-level status
  - [x] `PUT /api/v2/mission-mentors/[id]/group-status` - Update group-specific status
  - [x] `PUT /api/v2/mission-mentors/[id]/availability` - Update availability
  - [x] `PUT /api/v2/mission-mentors/[id]/capacity` - Update max students
  - [x] `PUT /api/v2/mission-mentors/[id]/group-role` - Update role in specific group
  - [x] `PUT /api/v2/mission-mentors/[id]/group-notes` - Update group-specific notes
- [x] **Create V2 API file**: `src/app/api/v2/mission-mentors/route.ts`

#### **2.4 Create V2 MentorshipGroup API Routes** ✅ **COMPLETE**
- [x] **Create new V2 API routes with `/api/v2/` prefix:**
  - [x] `GET /api/v2/mentorship-groups` - Get all mentorship groups
  - [x] `POST /api/v2/mentorship-groups` - Create new group or group from participants
  - [x] `GET /api/v2/mentorship-groups/[id]` - Get group by ID
  - [x] `PUT /api/v2/mentorship-groups/[id]` - Update group
  - [x] `DELETE /api/v2/mentorship-groups/[id]` - Delete group
- [x] **Add V2 mission-specific endpoints:**
  - [x] `GET /api/v2/mentorship-groups/mission/[missionId]` - Get all groups for mission
  - [x] `GET /api/v2/mentorship-groups/mission/[missionId]/active` - Get active groups
- [x] **Add V2 assignment endpoints:**
  - [x] `PUT /api/v2/mentorship-groups/[id]/students` - Update student assignments
  - [x] `PUT /api/v2/mentorship-groups/[id]/mentors` - Update mentor assignments
  - [x] `PUT /api/v2/mentorship-groups/[id]/progress` - Update group progress
- [x] **Add V2 group management endpoints:**
  - [x] `PUT /api/v2/mentorship-groups/[id]/status` - Update group status
  - [x] `PUT /api/v2/mentorship-groups/[id]/schedule` - Update meeting schedule
  - [x] `PUT /api/v2/mentorship-groups/[id]/communication` - Update communication channels
- [x] **Create V2 API file**: `src/app/api/v2/mentorship-groups/route.ts`

#### **2.5 Create V2 Analytics API Routes** ✅ **COMPLETE**
- [x] **Create new V2 analytics routes with `/api/v2/` prefix:**
  - [x] `GET /api/v2/analytics` - Comprehensive analytics for missions, students, mentors, and groups
  - [x] `GET /api/v2/analytics?missionId=:id` - Analytics for specific mission
  - [x] `GET /api/v2/analytics?batchId=:id` - Analytics for specific batch
  - [x] `GET /api/v2/analytics?timeRange=7d|30d|90d|1y` - Analytics for specific time range
- [x] **Create V2 API file**: `src/app/api/v2/analytics/route.ts`

#### **2.6 V2 API Infrastructure** ✅ **COMPLETE**
- [x] **Create V2 API directory structure**: `/api/v2/` with all subdirectories
- [x] **Create V2 API index file**: `src/app/api/v2/index.ts` with comprehensive documentation
- [x] **Implement authentication**: NextAuth.js session validation for all V2 endpoints
- [x] **Implement validation**: Zod schema validation for all V2 inputs
- [x] **Implement error handling**: Comprehensive error messages and status codes
- [x] **Implement pagination**: Standardized pagination with metadata for all list endpoints
- [x] **Implement filtering**: Advanced filtering and search capabilities
- [x] **Implement bulk operations**: Bulk create, update, and delete operations
- [x] **Implement data population**: Automatic reference population for all responses
- [x] **Implement dual-level status management**: Mission-level and group-level status tracking

### **Phase 3: V2 UI Components (Week 3)**

#### **3.1 Create V2 Admin Dashboard Components**
- [ ] **Create V2 Mission Management components:**
  - [ ] `MissionListV2.tsx` - Enhanced mission list with participant counts
  - [ ] `MissionCreateV2.tsx` - Create new mission form
  - [ ] `MissionEditV2.tsx` - Edit mission form
  - [ ] `MissionOverviewV2.tsx` - Mission dashboard with statistics
  - [ ] `MissionParticipantsV2.tsx` - Manage mission participants
  - [ ] `MissionStatisticsV2.tsx` - Mission performance analytics
- [ ] **Create V2 Participant Management components:**
  - [ ] `StudentAssignmentV2.tsx` - Assign students to missions
  - [ ] `MentorAssignmentV2.tsx` - Assign mentors to missions
  - [ ] `ParticipantStatusV2.tsx` - Manage participant statuses
  - [ ] `AttendanceTrackingV2.tsx` - Track student attendance
  - [ ] `AvailabilityManagementV2.tsx` - Manage mentor availability
  - [ ] `BulkOperationsV2.tsx` - Bulk participant operations
- [ ] **Create V2 Group Management components:**
  - [ ] `GroupFormationV2.tsx` - Create groups from participants
  - [ ] `GroupAssignmentV2.tsx` - Assign participants to groups
  - [ ] `GroupStatusV2.tsx` - Manage group statuses
  - [ ] `GroupScheduleV2.tsx` - Manage group meeting schedules
  - [ ] `GroupCommunicationV2.tsx` - Setup communication channels
  - [ ] `GroupProgressV2.tsx` - Track group progress

#### **3.2 Create V2 Mission Hub Components**
- [ ] **Create V2 Mission Overview components:**
  - [ ] `MissionDashboardV2.tsx` - Enhanced mission dashboard
  - [ ] `ParticipantOverviewV2.tsx` - Participant status overview
  - [ ] `GroupOverviewV2.tsx` - Group status overview
  - [ ] `ProgressTrackingV2.tsx` - Mission progress tracking
  - [ ] `QuickActionsV2.tsx` - Quick action buttons
- [ ] **Create V2 Group Management components:**
  - [ ] `GroupListV2.tsx` - List all groups for mission
  - [ ] `GroupDetailsV2.tsx` - Group detailed view
  - [ ] `GroupParticipantsV2.tsx` - Manage group participants
  - [ ] `GroupScheduleV2.tsx` - Group meeting schedule
  - [ ] `GroupCommunicationV2.tsx` - Group communication tools
  - [ ] `GroupProgressV2.tsx` - Group progress tracking

#### **3.3 Create V2 Student & Mentor Components**
- [ ] **Create V2 Student Dashboard components:**
  - [ ] `StudentMissionViewV2.tsx` - Student's mission overview
  - [ ] `StudentGroupViewV2.tsx` - Student's group information
  - [ ] `StudentProgressV2.tsx` - Student progress tracking
  - [ ] `StudentAttendanceV2.tsx` - Student attendance tracking
  - [ ] `StudentFeedbackV2.tsx` - Student feedback display
- [ ] **Create V2 Mentor Dashboard components:**
  - [ ] `MentorMissionViewV2.tsx` - Mentor's mission overview
  - [ ] `MentorGroupViewV2.tsx` - Mentor's group management
  - [ ] `MentorStudentsV2.tsx` - Mentor's student list
  - [ ] `MentorAvailabilityV2.tsx` - Mentor availability management
  - [ ] `MentorPerformanceV2.tsx` - Mentor performance metrics
  - [ ] `MentorFeedbackV2.tsx` - Mentor feedback submission

#### **3.4 Create V2 Shared Components**
- [ ] **Create V2 Status Management components:**
  - [ ] `StatusBadgeV2.tsx` - Enhanced status badges
  - [ ] `StatusUpdateModalV2.tsx` - Status update modal
  - [ ] `DualStatusDisplayV2.tsx` - Display mission + group status
  - [ ] `StatusHistoryV2.tsx` - Status change history
  - [ ] `StatusFilterV2.tsx` - Status filtering controls
- [ ] **Create V2 Data Display components:**
  - [ ] `ParticipantTableV2.tsx` - Enhanced participant table
  - [ ] `ProgressChartV2.tsx` - Progress visualization
  - [ ] `StatisticsCardV2.tsx` - Statistics display cards
  - [ ] `QuickStatsV2.tsx` - Quick statistics display
  - [ ] `DataExportV2.tsx` - Data export functionality

### **Phase 4: V2 Pages & Integration (Week 4)**

#### **4.1 Create V2 Admin Pages**
- [ ] **Create V2 Admin directory structure:**
  - [ ] `src/app/v2/admin/missions/page.tsx` - Mission list
  - [ ] `src/app/v2/admin/missions/create/page.tsx` - Create mission
  - [ ] `src/app/v2/admin/missions/[id]/page.tsx` - Mission details
  - [ ] `src/app/v2/admin/missions/[id]/edit/page.tsx` - Edit mission
  - [ ] `src/app/v2/admin/missions/[id]/participants/page.tsx` - Manage participants
  - [ ] `src/app/v2/admin/missions/[id]/statistics/page.tsx` - Mission statistics
- [ ] **Create V2 Participant Management pages:**
  - [ ] `src/app/v2/admin/participants/students/page.tsx` - Student management
  - [ ] `src/app/v2/admin/participants/mentors/page.tsx` - Mentor management
  - [ ] `src/app/v2/admin/participants/bulk-operations/page.tsx` - Bulk operations
- [ ] **Create V2 Group Management pages:**
  - [ ] `src/app/v2/admin/groups/page.tsx` - Group management
  - [ ] `src/app/v2/admin/groups/create/page.tsx` - Create group
  - [ ] `src/app/v2/admin/groups/[id]/page.tsx` - Group details

#### **4.2 Create V2 Mission Hub Pages**
- [ ] **Create V2 Mission Hub directory structure:**
  - [ ] `src/app/v2/mission-hub/page.tsx` - Mission hub overview
  - [ ] `src/app/v2/mission-hub/[missionId]/page.tsx` - Mission dashboard
  - [ ] `src/app/v2/mission-hub/[missionId]/participants/page.tsx` - Participant overview
  - [ ] `src/app/v2/mission-hub/[missionId]/groups/page.tsx` - Group overview
  - [ ] `src/app/v2/mission-hub/[missionId]/groups/[groupId]/page.tsx` - Group details
  - [ ] `src/app/v2/mission-hub/[missionId]/statistics/page.tsx` - Mission statistics
  - [ ] `src/app/v2/mission-hub/[missionId]/settings/page.tsx` - Mission settings

#### **4.3 Create V2 Student & Mentor Pages**
- [ ] **Create V2 Student pages:**
  - [ ] `src/app/v2/student/missions/page.tsx` - Student missions
  - [ ] `src/app/v2/student/missions/[missionId]/page.tsx` - Mission details
  - [ ] `src/app/v2/student/groups/[groupId]/page.tsx` - Group details
- [ ] **Create V2 Mentor pages:**
  - [ ] `src/app/v2/mentor/missions/page.tsx` - Mentor missions
  - [ ] `src/app/v2/mentor/missions/[missionId]/page.tsx` - Mission details
  - [ ] `src/app/v2/mentor/groups/[groupId]/page.tsx` - Group management
  - [ ] `src/app/v2/mentor/students/page.tsx` - Student management

### **Phase 5: V2 Testing & Validation (Week 5)**

#### **5.1 V2 API Testing**
- [ ] **Test all V2 CRUD operations:**
  - [ ] Create/Read/Update/Delete V2 MissionStudent records
  - [ ] Create/Read/Update/Delete V2 MissionMentor records
  - [ ] Create/Read/Update/Delete V2 MentorshipGroup records
  - [ ] Test dual-level status updates and transitions
- [ ] **Test V2 data integrity:**
  - [ ] Verify V2 Mission arrays stay in sync with collections
  - [ ] Verify V2 cached counts are accurate
  - [ ] Test V2 referential integrity constraints

#### **5.2 V2 Performance Testing**
- [ ] **Load testing with large datasets:**
  - [ ] Test with 1000+ students per mission
  - [ ] Test with 100+ mentors per mission
  - [ ] Test with 50+ groups per mission
- [ ] **Query performance testing:**
  - [ ] Test V2 mission participant retrieval
  - [ ] Test V2 group formation queries
  - [ ] Test V2 statistics aggregation

## **🎯 V2 UI/UX IMPLEMENTATION PLAN**

### **Phase 6: V2 Admin Interface (Week 6)**

#### **6.1 V2 Mission Management Dashboard**
- [ ] **V2 mission list view:**
  - [ ] Show student count, mentor count, group count from V2 models
  - [ ] Add V2 participant management buttons
  - [ ] Show V2 mission status and progress
- [ ] **V2 mission participant management:**
  - [ ] V2 student assignment interface
  - [ ] V2 mentor assignment interface
  - [ ] V2 dual-level status management (mission + group)
  - [ ] V2 bulk operations for multiple participants

#### **6.2 V2 Participant Management Interface**
- [ ] **V2 student management:**
  - [ ] List all students in mission with dual-level status
  - [ ] Individual student status updates (mission + group)
  - [ ] V2 attendance tracking interface
  - [ ] V2 mission notes and feedback
- [ ] **V2 mentor management:**
  - [ ] List all mentors in mission with role and dual-level status
  - [ ] V2 mentor capacity management
  - [ ] V2 availability scheduling
  - [ ] V2 performance tracking

### **Phase 7: V2 Mission Hub Updates (Week 7)**

#### **7.1 V2 Mission Overview**
- [ ] **V2 mission dashboard:**
  - [ ] Show V2 participant counts and dual-level status
  - [ ] Display V2 group information
  - [ ] Show V2 mission progress
- [ ] **V2 participant status indicators:**
  - [ ] V2 visual status badges (mission + group status)
  - [ ] V2 progress bars for students
  - [ ] V2 availability indicators for mentors

#### **7.2 V2 Group Management Interface**
- [ ] **V2 group formation interface:**
  - [ ] Create V2 groups from existing V2 participants
  - [ ] Assign V2 students to groups
  - [ ] Assign V2 mentors to groups
  - [ ] V2 group progress tracking
- [ ] **V2 group communication:**
  - [ ] V2 meeting schedule management
  - [ ] V2 communication channel setup
  - [ ] V2 group activity feed

### **Phase 8: V2 Student & Mentor Views (Week 8)**

#### **8.1 V2 Student Dashboard**
- [ ] **V2 mission participation view:**
  - [ ] Show V2 mission status and progress
  - [ ] Display V2 group assignment
  - [ ] Show V2 attendance tracking
  - [ ] V2 mission-specific feedback
- [ ] **V2 progress tracking:**
  - [ ] V2 course progress visualization
  - [ ] V2 assignment completion status
  - [ ] V2 mentor feedback display

#### **8.2 V2 Mentor Dashboard**
- [ ] **V2 mission overview:**
  - [ ] Show V2 assigned students and groups
  - [ ] Display V2 availability status
  - [ ] Show V2 performance metrics
- [ ] **V2 student management:**
  - [ ] V2 student progress tracking
  - [ ] V2 feedback submission interface
  - [ ] V2 session scheduling

## **🚀 V2 IMPLEMENTATION PRIORITIES**

### **High Priority (Week 1-2)**
1. **V2 Database Models** - Create new V2 models with dual-level status
2. **V2 API Routes** - Create new `/api/v2/` endpoints
3. **V2 Data Structure** - Implement fast retrieval arrays and cached counts

### **Medium Priority (Week 3-4)**
1. **V2 UI Components** - Create V2 React components
2. **V2 Pages** - Create V2 page structure
3. **V2 Integration** - Connect V2 APIs with V2 UI

### **Low Priority (Week 5-8)**
1. **V2 Testing** - Test V2 functionality and performance
2. **V2 Documentation** - Document V2 system
3. **V2 Migration** - Plan migration from V1 to V2

## **✅ V2 SUCCESS CRITERIA**

- [ ] **V2 Data Integrity**: All V2 Mission arrays stay in sync with V2 collections
- [ ] **V2 Performance**: Fast retrieval of V2 mission participants (< 100ms)
- [ ] **V2 Scalability**: Support 1000+ students per mission in V2 system
- [ ] **V2 Functionality**: All V2 CRUD operations work correctly
- [ ] **V2 User Experience**: Intuitive V2 participant management interface
- [ ] **V2 Dual-Level Status**: Mission and group status management working correctly
- [ ] **V2 No Conflicts**: V2 system runs alongside existing V1 system without conflicts

## **🎯 PRACTICAL USE CASES FOR DUAL-LEVEL STATUS**

### **Student Scenarios**

#### **Scenario 1: Temporary Group Absence**
- **Mission Status**: `active` (student still enrolled in mission)
- **Group Status**: `deactive` (temporarily not participating in group activities)
- **Reason**: Student is sick for 2 weeks but will return
- **Action**: Group can continue without this student, mission progress unaffected

#### **Scenario 2: Group-Specific Issues**
- **Mission Status**: `active` (student performing well overall)
- **Group Status**: `irregular` (missing group meetings, not contributing to group projects)
- **Reason**: Student struggling with group dynamics
- **Action**: Group mentors can address group-specific issues without affecting mission status

#### **Scenario 3: Mission Completion**
- **Mission Status**: `completed` (student finished all mission requirements)
- **Group Status**: `active` (student still helping other group members)
- **Reason**: Student completed early but stays to support peers
- **Action**: Student can mentor others while maintaining completed status

### **Mentor Scenarios**

#### **Scenario 1: Group Overload**
- **Mission Status**: `active` (mentor available for mission)
- **Group Status**: `overloaded` (too many students in specific group)
- **Reason**: Group has 15 students, mentor can only handle 10 effectively
- **Action**: Mission can assign new students to other groups, specific group gets co-mentor

#### **Scenario 2: Temporary Unavailability**
- **Mission Status**: `active` (mentor still mission coordinator)
- **Group Status**: `unavailable` (mentor on vacation for 1 week)
- **Reason**: Personal time off
- **Action**: Co-mentors handle group during absence, mission coordination continues

#### **Scenario 3: Role-Specific Status**
- **Mission Status**: `active` (mentor available for mission)
- **Group Status**: `irregular` (mentor struggling with primary role)
- **Reason**: Mentor better suited as co-mentor than primary
- **Action**: Switch mentor role within group without affecting mission status

### **Administrative Benefits**

1. **Granular Control**: Manage participation at both mission and group levels
2. **Flexible Scheduling**: Handle temporary absences without permanent status changes
3. **Role Optimization**: Adjust mentor roles within groups without mission-wide changes
4. **Progress Tracking**: Monitor both overall mission progress and group-specific participation
5. **Resource Allocation**: Optimize mentor-student assignments based on detailed status
6. **Communication**: Send targeted notifications based on status level (mission vs group)

---

**Document Version**: 5.0  
**Status**: Ready for V2 Implementation  
**Focus**: V2 API-first approach, dual-level status management, comprehensive V2 checklist, no conflicts with existing system

---

**V2 System Features:**
- ✅ **No API Conflicts**: All V2 APIs use `/api/v2/` prefix
- ✅ **Dual-Level Status**: Mission + Group status management
- ✅ **Fast Retrieval**: Cached counts and ID arrays
- ✅ **Scalable Architecture**: Support for 1000+ participants
- ✅ **Modern UI/UX**: Enhanced components and pages
- ✅ **Parallel Development**: V2 runs alongside existing V1 system
