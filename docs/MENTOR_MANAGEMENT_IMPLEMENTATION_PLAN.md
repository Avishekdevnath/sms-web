# Mentor Management System Implementation Plan

## Overview
This document outlines the implementation of a comprehensive mentor management system that integrates with existing models (MentorAssignment, MentorMeeting, User) and introduces new models for mission-specific mentor management.

## Existing Models Analysis

### 1. User Model (src/models/User.ts)
- **Role Support**: Already supports "mentor" role
- **Mentor Fields**: 
  - `mentorId`: Reference to another user (mentor)
  - `studentsCount`: Current number of assigned students
  - `maxStudents`: Maximum capacity
- **Status**: Active/inactive, banned, deleted

### 2. MentorAssignment Model (src/models/MentorAssignment.ts)
- **Purpose**: Batch-level mentor assignments
- **Fields**: mentorId, studentIds, batchId, maxStudents, currentWorkload
- **Status**: active, inactive, overloaded
- **Limitations**: Only batch-level, no mission-specific assignments

### 3. MentorMeeting Model (src/models/MentorMeeting.ts)
- **Purpose**: Track mentor-student meetings
- **Fields**: mentorId, studentIds, batchId, meeting details
- **Types**: weekly, special, rescue, one-on-one

### 4. Mission Model (src/models/Mission.ts)
- **Current**: Has students with optional mentorId
- **Limitation**: Only single mentor per student
- **Need**: Support for multiple mentors and mentorship groups

## New Models to Create

### 1. MissionMentor Model
**Purpose**: Track mentors assigned to specific missions with roles and responsibilities

**Fields**:
```typescript
interface IMissionMentor {
  _id: string;
  missionId: mongoose.Types.ObjectId; // Reference to Mission
  mentorId: mongoose.Types.ObjectId;  // Reference to User (mentor)
  role: 'primary' | 'secondary' | 'moderator';
  assignedStudents: mongoose.Types.ObjectId[]; // Students directly assigned
  specialization: string[]; // Areas of expertise
  maxStudents: number; // Maximum students this mentor can handle
  currentWorkload: number; // Current number of assigned students
  status: 'active' | 'inactive' | 'overloaded';
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
```

### 2. MentorshipGroup Model
**Purpose**: Group students under multiple mentors for collaborative mentoring

**Fields**:
```typescript
interface IMentorshipGroup {
  _id: string;
  missionId: mongoose.Types.ObjectId; // Reference to Mission
  groupName: string; // Descriptive name for the group
  mentors: {
    mentorId: mongoose.Types.ObjectId;
    role: 'primary' | 'secondary' | 'moderator';
    specialization: string[];
  }[];
  students: mongoose.Types.ObjectId[]; // Students in this group
  meetingSchedule: {
    dayOfWeek: number; // 0-6 (Sunday-Saturday)
    time: string; // HH:MM format
    duration: number; // minutes
  }[];
  status: 'active' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
}
```

## Enhanced Models

### 1. Enhanced Mission Model
**Add to IMission interface**:
```typescript
mentors: {
  mentorId: mongoose.Types.ObjectId;
  role: 'primary' | 'secondary' | 'moderator';
  specialization: string[];
}[];
mentorshipGroups: mongoose.Types.ObjectId[]; // References to MentorshipGroup
```

**Update IMissionStudent**:
```typescript
mentors: mongoose.Types.ObjectId[]; // Multiple mentors
primaryMentorId: mongoose.Types.ObjectId; // Primary mentor reference
mentorshipGroupId?: mongoose.Types.ObjectId; // Optional group membership
```

## API Endpoints Structure

### 1. Mission Mentor Management
```
POST   /api/mission-mentors/assign          # Assign mentor to mission
DELETE /api/mission-mentors/unassign        # Remove mentor from mission
GET    /api/mission-mentors/mission/:missionId      # Get mission mentors
PUT    /api/mission-mentors/mentor/:id      # Update mentor details
```

### 2. Student Assignment
```
POST   /api/mission-mentors/assign-students     # Assign students to mentors
POST   /api/mission-mentors/reassign-students   # Reassign students
GET    /api/mission-mentors/mentor/:mentorId/students  # Get mentor's students
```

### 3. Mentorship Groups
```
POST   /api/mentorship-groups/create        # Create new group
PUT    /api/mentorship-groups/:id           # Update group
GET    /api/mentorship-groups/mission/:missionId  # Get mission groups
DELETE /api/mentorship-groups/:id           # Delete group
```

### 4. Mentor Dashboard
```
GET    /api/mentors/dashboard               # Mentor overview
GET    /api/mentors/workload                # Workload statistics
GET    /api/mentors/meetings                # Meeting schedule
```

## Business Logic Rules

### 1. Mentor Assignment Rules
- **Capacity Check**: Prevent assigning more students than maxStudents
- **Role Hierarchy**: Primary mentors have priority over secondary
- **Specialization Matching**: Match mentors to students based on expertise
- **Workload Balancing**: Distribute students evenly among available mentors

### 2. Student Assignment Logic
- **Automatic Assignment**: Based on mentor capacity and specialization
- **Manual Override**: Admin/SRE/Dev can manually assign students
- **Conflict Resolution**: Handle cases where students need multiple mentors
- **Group Assignment**: Students can be part of mentorship groups

### 3. Mission Mentor List Generation
- **Active Mentors**: Only show mentors with assigned students
- **Role-based Display**: Differentiate between primary, secondary, and moderator
- **Workload Indicators**: Show current vs. maximum capacity

## Implementation Phases

### Phase 1: Core Models (Week 1)
1. Create MissionMentor model
2. Create MentorshipGroup model
3. Enhance Mission model
4. Update models/index.ts

### Phase 2: API Development (Week 2)
1. Mission mentor management endpoints
2. Student assignment endpoints
3. Mentorship group endpoints
4. Basic validation and error handling

### Phase 3: Frontend Components (Week 3)
1. Mission mentors management page
2. Mentor assignment interface
3. Student assignment interface
4. Basic mentor dashboard

### Phase 4: Advanced Features (Week 4)
1. Workload management
2. Meeting coordination
3. Progress tracking integration
4. Analytics and reporting

## Database Indexes

### MissionMentor Indexes
```typescript
// Compound indexes for efficient queries
{ missionId: 1, mentorId: 1 } // Unique constraint
{ missionId: 1, role: 1 }     // Role-based queries
{ mentorId: 1, status: 1 }    // Mentor status queries
{ currentWorkload: 1, maxStudents: 1 } // Capacity queries
```

### MentorshipGroup Indexes
```typescript
{ missionId: 1, status: 1 }   // Mission group queries
{ "mentors.mentorId": 1 }     // Mentor lookup
{ "students": 1 }              // Student lookup
```

## Integration Points

### 1. Existing MentorAssignment
- **Keep**: For batch-level assignments
- **Enhance**: Add mission-specific fields
- **Migration**: Gradually move to mission-based system

### 2. Existing MentorMeeting
- **Enhance**: Support mission-specific meetings
- **Add**: Group meeting support
- **Integrate**: With new mentorship groups

### 3. User Model
- **Enhance**: Add mission-specific mentor fields
- **Add**: Workload tracking across missions
- **Support**: Multiple mentor roles

## Security & Permissions

### 1. Role-based Access
- **Admin**: Full access to all mentor management
- **SRE/Dev**: Can assign mentors and students
- **Mentor**: Can view assigned students and manage meetings
- **Student**: Can view assigned mentors

### 2. Data Validation
- **Capacity Limits**: Enforce mentor student limits
- **Role Validation**: Ensure valid mentor roles
- **Assignment Conflicts**: Prevent duplicate assignments
- **Status Checks**: Validate mentor and student status

## Testing Strategy

### 1. Unit Tests
- Model validation
- Business logic rules
- API endpoint validation

### 2. Integration Tests
- Mentor assignment workflows
- Student assignment flows
- Group management operations

### 3. End-to-End Tests
- Complete mentor assignment process
- Student onboarding with mentors
- Mission mentor management

## Migration Strategy

### 1. Phase 1: Add New Models
- Create new models without breaking existing functionality
- Add optional fields to existing models

### 2. Phase 2: Gradual Migration
- Migrate existing mentor assignments to new system
- Update existing interfaces to use new models

### 3. Phase 3: Deprecation
- Mark old fields as deprecated
- Remove old functionality after migration

## Monitoring & Analytics

### 1. Key Metrics
- Mentor workload distribution
- Student assignment success rates
- Meeting attendance rates
- Mentor performance indicators

### 2. Alerts
- Mentor capacity warnings
- Assignment conflicts
- Meeting scheduling issues
- Workload imbalances

## Future Enhancements

### 1. AI-powered Matching
- Intelligent mentor-student pairing
- Workload optimization algorithms
- Performance-based assignments

### 2. Advanced Collaboration
- Multi-mentor coordination tools
- Shared progress tracking
- Collaborative meeting notes

### 3. Mobile Support
- Mentor mobile dashboard
- Meeting scheduling on mobile
- Real-time notifications
