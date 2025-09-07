# **V2 Models - Student Mission Management System**

## **📋 OVERVIEW**

This directory contains the **V2 database models** for the enhanced Student Mission Management System. These models implement a **dual-level status management** architecture that separates mission-level and group-level participant statuses.

## **🏗️ ARCHITECTURE PRINCIPLES**

### **Core Design Philosophy**
- **Groups are formed FROM existing mission participants** (not the other way around)
- **Dual-level status management**: Mission status + Group status for each participant
- **Fast retrieval arrays** with cached counts for performance
- **No conflicts with V1 system** - runs in parallel with separate collections

### **Data Flow**
```
Mission → MissionStudent/MissionMentor → MentorshipGroup
   ↓              ↓                           ↓
Fast Arrays   Dual Status              Group Management
```

## **📊 V2 MODELS STRUCTURE**

### **1. MissionV2** (`Mission.ts`)
**Purpose**: Enhanced mission model with fast participant retrieval

**Key Features**:
- `studentIds[]`, `mentorIds[]`, `groupIds[]` - Fast lookup arrays
- `totalStudents`, `totalMentors`, `totalGroups` - Cached counts
- Auto-updating counts via pre-save middleware
- Comprehensive indexing for performance

**Collections**: `missions_v2`

### **2. MissionStudentV2** (`MissionStudent.ts`)
**Purpose**: Student-mission relationship with dual-level status

**Key Features**:
- **Mission-level status**: `active`, `deactive`, `irregular`, `completed`, `dropped`, `on-hold`
- **Group-level status**: `active`, `deactive`, `irregular`, `on-hold`
- Attendance tracking and progress monitoring
- Course-specific progress tracking

**Collections**: `mission_students_v2`

### **3. MissionMentorV2** (`MissionMentor.ts`)
**Purpose**: Mentor-mission relationship with dual-level status

**Key Features**:
- **Mission-level status**: `active`, `deactive`, `irregular`, `overloaded`, `unavailable`
- **Group-level statuses**: Array of group-specific statuses with roles
- Availability management and capacity tracking
- Performance metrics and statistics

**Collections**: `mission_mentors_v2`

### **4. MentorshipGroupV2** (`MentorshipGroup.ts`)
**Purpose**: Groups formed from existing mission participants

**Key Features**:
- References to existing `MissionStudent` and `MissionMentor` records
- Meeting schedule management
- Communication channel setup
- Progress tracking and statistics

**Collections**: `mentorship_groups_v2`

## **🔧 DUAL-LEVEL STATUS MANAGEMENT**

### **Student Status Example**
```typescript
// Mission-level status
student.status = 'active'; // Student is active in mission

// Group-level status
student.groupStatus = {
  status: 'deactive',        // Temporarily inactive in group
  reason: 'Sick leave',
  changedAt: new Date(),
  changedBy: mentorId,
  notes: 'Will return in 2 weeks'
};
```

### **Mentor Status Example**
```typescript
// Mission-level status
mentor.status = 'active'; // Mentor is active in mission

// Group-level statuses
mentor.groupStatuses = [
  {
    groupId: group1Id,
    status: 'active',        // Active in group 1
    role: 'primary',
    changedAt: new Date()
  },
  {
    groupId: group2Id,
    status: 'overloaded',    // Overloaded in group 2
    role: 'co-mentor',
    reason: 'Too many students',
    changedAt: new Date()
  }
];
```

## **📁 FILE STRUCTURE**

```
src/models/v2/
├── Mission.ts              # MissionV2 model
├── MissionStudent.ts       # MissionStudentV2 model
├── MissionMentor.ts        # MissionMentorV2 model
├── MentorshipGroup.ts      # MentorshipGroupV2 model
├── index.ts                # Export all models
├── test.ts                 # Model testing utilities
└── README.md               # This documentation
```

## **🚀 USAGE EXAMPLES**

### **Importing Models**
```typescript
import { 
  MissionV2, 
  MissionStudentV2, 
  MissionMentorV2, 
  MentorshipGroupV2 
} from '@/models/v2';
```

### **Creating a Mission**
```typescript
const mission = new MissionV2({
  code: 'MISSION-001',
  title: 'Phitron Mission 1',
  batchId: batchId,
  createdBy: userId
});

await mission.save();
```

### **Assigning a Student**
```typescript
const missionStudent = new MissionStudentV2({
  studentId: studentId,
  missionId: missionId,
  batchId: batchId,
  status: 'active'
});

await missionStudent.save();

// Mission arrays are automatically updated
await mission.addStudent(studentId);
```

### **Creating a Group from Participants**
```typescript
const group = new MentorshipGroupV2({
  name: 'React Masters',
  missionId: missionId,
  batchId: batchId,
  studentIds: [student1Id, student2Id, student3Id],
  primaryMentorId: mentorId,
  groupType: 'study',
  focusArea: ['frontend', 'react']
});

await group.save();
```

## **🔍 QUERYING EXAMPLES**

### **Find Active Students in Mission**
```typescript
const activeStudents = await MissionStudentV2.findActiveByMission(missionId);
```

### **Find Available Mentors**
```typescript
const availableMentors = await MissionMentorV2.findAvailableByMission(missionId);
```

### **Find Groups by Mission**
```typescript
const groups = await MentorshipGroupV2.findActiveByMission(missionId);
```

### **Get Mission Statistics**
```typescript
const mission = await MissionV2.findById(missionId);
console.log(`Mission has ${mission.totalStudents} students and ${mission.totalMentors} mentors`);
```

## **⚡ PERFORMANCE FEATURES**

### **Indexes**
- **Mission**: `{ code: 1 }`, `{ batchId: 1, status: 1 }`, `{ "studentIds": 1 }`
- **MissionStudent**: `{ missionId: 1, studentId: 1 }`, `{ status: 1, missionId: 1 }`
- **MissionMentor**: `{ missionId: 1, mentorId: 1 }`, `{ role: 1, missionId: 1 }`
- **MentorshipGroup**: `{ missionId: 1, status: 1 }`, `{ primaryMentorId: 1 }`

### **Cached Counts**
- Auto-updating counts via pre-save middleware
- Fast retrieval without aggregation queries
- Real-time participant statistics

## **🧪 TESTING**

### **Run Model Tests**
```typescript
import { V2ModelsTest } from '@/models/v2';

// Test all V2 models
await V2ModelsTest.runAllV2Tests();

// Test specific aspects
await V2ModelsTest.testV2Models();
await V2ModelsTest.testV2ModelValidation();
await V2ModelsTest.testV2ModelStaticMethods();
```

## **📈 NEXT STEPS**

### **Phase 1 Status**: ✅ **COMPLETE**
- ✅ V2 Database Models
- ✅ V2 Validation Schemas
- ✅ V2 Types and Interfaces
- ✅ V2 Testing Utilities

### **Phase 2**: 🚧 **NEXT**
- 🚧 V2 API Routes (`/api/v2/*`)
- 🚧 V2 API Controllers
- 🚧 V2 API Middleware

### **Phase 3**: 📋 **PLANNED**
- 📋 V2 UI Components
- 📋 V2 Pages
- 📋 V2 Integration

## **🔗 RELATED DOCUMENTS**

- **Architecture Document**: `STUDENT_MISSION_ARCHITECTURE.md`
- **V2 API Plan**: `V2_API_IMPLEMENTATION_PLAN.md`
- **V2 Roadmap**: `V2_IMPLEMENTATION_ROADMAP.md`

## **📞 SUPPORT**

For questions about V2 models:
1. Check this README
2. Review the architecture document
3. Run the test utilities
4. Check the TypeScript interfaces

---

**🎉 V2 Models are ready for Phase 2: API Implementation!**
