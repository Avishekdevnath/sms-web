# **V2 Implementation Roadmap - Step by Step Guide**

## **🎯 IMPLEMENTATION OVERVIEW**

This document provides a **step-by-step implementation guide** for the V2 Student Mission Management System. Each step includes specific file locations, code examples, and testing instructions.

---

## **📁 PHASE 1: V2 DATABASE MODELS (Week 1)**

### **Step 1.1: Create V2 Models Directory Structure**
```bash
mkdir -p src/models/v2
mkdir -p src/schemas/v2
mkdir -p src/types/v2
```

### **Step 1.2: Create V2 Mission Model**
```typescript
// src/models/v2/Mission.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IMissionV2 extends Document {
  code: string;
  title: string;
  description?: string;
  batchId: mongoose.Types.ObjectId;
  startDate?: Date;
  endDate?: Date;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  
  // ✅ FAST RETRIEVAL FIELDS
  studentIds: mongoose.Types.ObjectId[];
  totalStudents: number;
  mentorIds: mongoose.Types.ObjectId[];
  totalMentors: number;
  groupIds: mongoose.Types.ObjectId[];
  totalGroups: number;
  
  // Course Configuration
  courses: Array<{
    courseOfferingId: mongoose.Types.ObjectId;
    weight: number;
    requiredAssignments: mongoose.Types.ObjectId[];
    minProgress: number;
  }>;
  
  // Mission Configuration
  maxStudents?: number;
  requirements?: string[];
  rewards?: string[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MissionV2Schema = new Schema<IMissionV2>({
  code: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String },
  batchId: { type: Schema.Types.ObjectId, ref: 'Batch', required: true },
  startDate: { type: Date },
  endDate: { type: Date },
  status: { 
    type: String, 
    enum: ['draft', 'active', 'paused', 'completed', 'archived'], 
    default: 'draft' 
  },
  
  // ✅ FAST RETRIEVAL FIELDS
  studentIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  totalStudents: { type: Number, default: 0 },
  mentorIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  totalMentors: { type: Number, default: 0 },
  groupIds: [{ type: Schema.Types.ObjectId, ref: 'MentorshipGroupV2' }],
  totalGroups: { type: Number, default: 0 },
  
  // Course Configuration
  courses: [{
    courseOfferingId: { type: Schema.Types.ObjectId, ref: 'CourseOffering' },
    weight: { type: Number, min: 0, max: 100 },
    requiredAssignments: [{ type: Schema.Types.ObjectId, ref: 'Assignment' }],
    minProgress: { type: Number, min: 0, max: 100, default: 0 }
  }],
  
  // Mission Configuration
  maxStudents: { type: Number },
  requirements: [String],
  rewards: [String],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

// ✅ INDEXES FOR FAST RETRIEVAL
MissionV2Schema.index({ code: 1 });
MissionV2Schema.index({ batchId: 1, status: 1 });
MissionV2Schema.index({ createdBy: 1 });
MissionV2Schema.index({ "studentIds": 1 });
MissionV2Schema.index({ "mentorIds": 1 });
MissionV2Schema.index({ "groupIds": 1 });

// ✅ PRE-SAVE MIDDLEWARE TO UPDATE CACHED COUNTS
MissionV2Schema.pre('save', function(next) {
  if (this.isModified('studentIds')) {
    this.totalStudents = this.studentIds.length;
  }
  if (this.isModified('mentorIds')) {
    this.totalMentors = this.mentorIds.length;
  }
  if (this.isModified('groupIds')) {
    this.totalGroups = this.groupIds.length;
  }
  next();
});

export const MissionV2 = mongoose.model<IMissionV2>('MissionV2', MissionV2Schema);
```

### **Step 1.3: Create V2 MissionStudent Model**
```typescript
// src/models/v2/MissionStudent.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IMissionStudentV2 extends Document {
  studentId: mongoose.Types.ObjectId;
  missionId: mongoose.Types.ObjectId;
  batchId: mongoose.Types.ObjectId;
  
  // ✅ MISSION-LEVEL STATUS
  status: 'active' | 'deactive' | 'irregular' | 'completed' | 'dropped' | 'on-hold';
  progress: number;
  startedAt: Date;
  completedAt?: Date;
  lastActivity: Date;
  
  // Mission Participation
  isRegular: boolean;
  attendanceRate: number;
  lastAttendanceDate?: Date;
  
  // Mission-Specific Notes
  missionNotes?: string;
  irregularityReason?: string;
  deactivationReason?: string;
  
  // Group Assignment
  mentorshipGroupId?: mongoose.Types.ObjectId;
  
  // ✅ GROUP-LEVEL STATUS
  groupStatus?: {
    status: 'active' | 'deactive' | 'irregular' | 'on-hold';
    reason?: string;
    changedAt: Date;
    changedBy: mongoose.Types.ObjectId;
    notes?: string;
  };
  
  // Progress Tracking
  courseProgress: Array<{
    courseOfferingId: mongoose.Types.ObjectId;
    progress: number;
    completedAssignments: mongoose.Types.ObjectId[];
    lastActivity: Date;
    mentorFeedback?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const MissionStudentV2Schema = new Schema<IMissionStudentV2>({
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  missionId: { type: Schema.Types.ObjectId, ref: 'MissionV2', required: true },
  batchId: { type: Schema.Types.ObjectId, ref: 'Batch', required: true },
  
  // ✅ MISSION-LEVEL STATUS
  status: { 
    type: String, 
    enum: ['active', 'deactive', 'irregular', 'completed', 'dropped', 'on-hold'], 
    default: 'active' 
  },
  progress: { type: Number, min: 0, max: 100, default: 0 },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  lastActivity: { type: Date, default: Date.now },
  
  // Mission Participation
  isRegular: { type: Boolean, default: true },
  attendanceRate: { type: Number, min: 0, max: 100, default: 100 },
  lastAttendanceDate: { type: Date },
  
  // Mission-Specific Notes
  missionNotes: { type: String },
  irregularityReason: { type: String },
  deactivationReason: { type: String },
  
  // Group Assignment
  mentorshipGroupId: { type: Schema.Types.ObjectId, ref: 'MentorshipGroupV2' },
  
  // ✅ GROUP-LEVEL STATUS
  groupStatus: {
    status: { 
      type: String, 
      enum: ['active', 'deactive', 'irregular', 'on-hold'], 
      default: 'active' 
    },
    reason: { type: String },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String }
  },
  
  // Progress Tracking
  courseProgress: [{
    courseOfferingId: { type: Schema.Types.ObjectId, ref: 'CourseOffering' },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    completedAssignments: [{ type: Schema.Types.ObjectId, ref: 'Assignment' }],
    lastActivity: { type: Date, default: Date.now },
    mentorFeedback: { type: String }
  }]
}, {
  timestamps: true
});

// ✅ INDEXES FOR DUAL-LEVEL STATUS QUERIES
MissionStudentV2Schema.index({ missionId: 1, studentId: 1 }, { unique: true });
MissionStudentV2Schema.index({ studentId: 1, missionId: 1 });
MissionStudentV2Schema.index({ batchId: 1, missionId: 1 });
MissionStudentV2Schema.index({ status: 1, missionId: 1 });
MissionStudentV2Schema.index({ mentorshipGroupId: 1 });
MissionStudentV2Schema.index({ "groupStatus.status": 1, mentorshipGroupId: 1 });
MissionStudentV2Schema.index({ "groupStatus.status": 1, missionId: 1 });

export const MissionStudentV2 = mongoose.model<IMissionStudentV2>('MissionStudentV2', MissionStudentV2Schema);
```

### **Step 1.4: Create V2 MissionMentor Model**
```typescript
// src/models/v2/MissionMentor.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IMissionMentorV2 extends Document {
  mentorId: mongoose.Types.ObjectId;
  missionId: mongoose.Types.ObjectId;
  batchId: mongoose.Types.ObjectId;
  
  // ✅ MISSION-LEVEL STATUS
  status: 'active' | 'deactive' | 'irregular' | 'overloaded' | 'unavailable';
  role: 'mission-lead' | 'coordinator' | 'advisor' | 'supervisor';
  specialization: string[];
  responsibilities: string[];
  
  // Mission Participation
  isRegular: boolean;
  availabilityRate: number;
  lastAvailableDate?: Date;
  
  // Mission-Specific Notes
  missionNotes?: string;
  irregularityReason?: string;
  deactivationReason?: string;
  
  // Mentor Capacity & Status
  maxStudents: number;
  currentStudents: number;
  
  // Mission-Specific Mentor Performance
  missionRating: number;
  totalMentoredStudents: number;
  totalSessions: number;
  
  // Availability & Schedule
  availability: {
    days: number[];
    hours: { start: string; end: string };
    timezone: string;
    preferredSessionDuration: number;
  };
  
  // Mission Groups
  assignedGroups: mongoose.Types.ObjectId[];
  
  // ✅ GROUP-LEVEL STATUSES
  groupStatuses: Array<{
    groupId: mongoose.Types.ObjectId;
    status: 'active' | 'deactive' | 'irregular' | 'overloaded' | 'unavailable';
    reason?: string;
    changedAt: Date;
    changedBy: mongoose.Types.ObjectId;
    notes?: string;
    role: 'primary' | 'co-mentor' | 'moderator';
  }>;
  
  // Mission Statistics
  stats: {
    avgStudentProgress: number;
    sessionCompletionRate: number;
    studentSatisfaction: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const MissionMentorV2Schema = new Schema<IMissionMentorV2>({
  mentorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  missionId: { type: Schema.Types.ObjectId, ref: 'MissionV2', required: true },
  batchId: { type: Schema.Types.ObjectId, ref: 'Batch', required: true },
  
  // ✅ MISSION-LEVEL STATUS
  status: { 
    type: String, 
    enum: ['active', 'deactive', 'irregular', 'overloaded', 'unavailable'], 
    default: 'active' 
  },
  role: { 
    type: String, 
    enum: ['mission-lead', 'coordinator', 'advisor', 'supervisor'], 
    default: 'advisor' 
  },
  specialization: [String],
  responsibilities: [String],
  
  // Mission Participation
  isRegular: { type: Boolean, default: true },
  availabilityRate: { type: Number, min: 0, max: 100, default: 100 },
  lastAvailableDate: { type: Date },
  
  // Mission-Specific Notes
  missionNotes: { type: String },
  irregularityReason: { type: String },
  deactivationReason: { type: String },
  
  // Mentor Capacity & Status
  maxStudents: { type: Number, default: 10 },
  currentStudents: { type: Number, default: 0 },
  
  // Mission-Specific Mentor Performance
  missionRating: { type: Number, min: 1, max: 5, default: 0 },
  totalMentoredStudents: { type: Number, default: 0 },
  totalSessions: { type: Number, default: 0 },
  
  // Availability & Schedule
  availability: {
    days: [Number], // [1,2,3,4,5] for Mon-Fri
    hours: {
      start: { type: String, default: "09:00" },
      end: { type: String, default: "17:00" }
    },
    timezone: { type: String, default: "Asia/Dhaka" },
    preferredSessionDuration: { type: Number, default: 60 }
  },
  
  // Mission Groups
  assignedGroups: [{ type: Schema.Types.ObjectId, ref: 'MentorshipGroupV2' }],
  
  // ✅ GROUP-LEVEL STATUSES
  groupStatuses: [{
    groupId: { type: Schema.Types.ObjectId, ref: 'MentorshipGroupV2' },
    status: { 
      type: String, 
      enum: ['active', 'deactive', 'irregular', 'overloaded', 'unavailable'], 
      default: 'active' 
    },
    reason: { type: String },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String },
    role: { 
      type: String, 
      enum: ['primary', 'co-mentor', 'moderator'], 
      default: 'co-mentor' 
    }
  }],
  
  // Mission Statistics
  stats: {
    avgStudentProgress: { type: Number, min: 0, max: 100, default: 0 },
    sessionCompletionRate: { type: Number, min: 0, max: 100, default: 0 },
    studentSatisfaction: { type: Number, min: 1, max: 5, default: 0 }
  }
}, {
  timestamps: true
});

// ✅ INDEXES FOR DUAL-LEVEL STATUS QUERIES
MissionMentorV2Schema.index({ missionId: 1, mentorId: 1 }, { unique: true });
MissionMentorV2Schema.index({ mentorId: 1, missionId: 1 });
MissionMentorV2Schema.index({ batchId: 1, missionId: 1 });
MissionMentorV2Schema.index({ role: 1, missionId: 1 });
MissionMentorV2Schema.index({ status: 1, missionId: 1 });
MissionMentorV2Schema.index({ isRegular: 1, missionId: 1 });
MissionMentorV2Schema.index({ "groupStatuses.groupId": 1, "groupStatuses.status": 1 });
MissionMentorV2Schema.index({ "groupStatuses.role": 1, "groupStatuses.groupId": 1 });

export const MissionMentorV2 = mongoose.model<IMissionMentorV2>('MissionMentorV2', MissionMentorV2Schema);
```

### **Step 1.5: Create V2 MentorshipGroup Model**
```typescript
// src/models/v2/MentorshipGroup.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IMentorshipGroupV2 extends Document {
  name: string;
  missionId: mongoose.Types.ObjectId;
  batchId: mongoose.Types.ObjectId;
  
  // Student Assignment (from MissionStudent)
  studentIds: mongoose.Types.ObjectId[];
  maxStudents: number;
  minStudents: number;
  
  // Mentor Assignment (from MissionMentor)
  primaryMentorId: mongoose.Types.ObjectId;
  coMentorIds: mongoose.Types.ObjectId[];
  
  // Group Status
  status: 'forming' | 'active' | 'inactive' | 'completed' | 'disbanded';
  
  // Group Configuration
  groupType: 'study' | 'project' | 'review' | 'workshop' | 'mixed';
  focusArea: string[];
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'mixed';
  
  // Meeting Schedule
  meetingSchedule: {
    frequency: 'weekly' | 'biweekly' | 'monthly' | 'on-demand';
    dayOfWeek?: number;
    time?: string;
    duration: number;
    timezone: string;
  };
  
  // Group Progress
  groupProgress: {
    overallProgress: number;
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

const MentorshipGroupV2Schema = new Schema<IMentorshipGroupV2>({
  name: { type: String, required: true },
  missionId: { type: Schema.Types.ObjectId, ref: 'MissionV2', required: true },
  batchId: { type: Schema.Types.ObjectId, ref: 'Batch', required: true },
  
  // Student Assignment (from MissionStudent)
  studentIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  maxStudents: { type: Number, default: 15 },
  minStudents: { type: Number, default: 5 },
  
  // Mentor Assignment (from MissionMentor)
  primaryMentorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  coMentorIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  
  // Group Status
  status: { 
    type: String, 
    enum: ['forming', 'active', 'inactive', 'completed', 'disbanded'], 
    default: 'forming' 
  },
  
  // Group Configuration
  groupType: { 
    type: String, 
    enum: ['study', 'project', 'review', 'workshop', 'mixed'], 
    default: 'mixed' 
  },
  focusArea: [String],
  skillLevel: { 
    type: String, 
    enum: ['beginner', 'intermediate', 'advanced', 'mixed'], 
    default: 'mixed' 
  },
  
  // Meeting Schedule
  meetingSchedule: {
    frequency: { 
      type: String, 
      enum: ['weekly', 'biweekly', 'monthly', 'on-demand'], 
      default: 'weekly' 
    },
    dayOfWeek: { type: Number, min: 0, max: 6 }, // 0-6 (Sunday-Saturday)
    time: { type: String }, // "14:00"
    duration: { type: Number, default: 60 }, // Duration in minutes
    timezone: { type: String, default: "Asia/Dhaka" }
  },
  
  // Group Progress
  groupProgress: {
    overallProgress: { type: Number, min: 0, max: 100, default: 0 },
    lastMeetingDate: { type: Date },
    nextMeetingDate: { type: Date },
    totalMeetings: { type: Number, default: 0 },
    activeStudents: { type: Number, default: 0 }
  },
  
  // Communication
  communicationChannel: {
    type: { 
      type: String, 
      enum: ['discord', 'slack', 'telegram', 'whatsapp'] 
    },
    channelId: { type: String },
    inviteLink: { type: String }
  }
}, {
  timestamps: true
});

// ✅ INDEXES FOR GROUP QUERIES
MentorshipGroupV2Schema.index({ missionId: 1, status: 1 });
MentorshipGroupV2Schema.index({ primaryMentorId: 1 });
MentorshipGroupV2Schema.index({ coMentorIds: 1 });
MentorshipGroupV2Schema.index({ batchId: 1, status: 1 });

export const MentorshipGroupV2 = mongoose.model<IMentorshipGroupV2>('MentorshipGroupV2', MentorshipGroupV2Schema);
```

---

## **🔌 PHASE 2: V2 API ROUTES (Week 2)**

### **Step 2.1: Create V2 API Directory Structure**
```bash
mkdir -p src/app/api/v2/missions
mkdir -p src/app/api/v2/mission-students
mkdir -p src/app/api/v2/mission-mentors
mkdir -p src/app/api/v2/mentorship-groups
mkdir -p src/app/api/v2/analytics
```

### **Step 2.2: Create V2 Mission Routes**
```typescript
// src/app/api/v2/missions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MissionV2 } from '@/models/v2/Mission';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');
    const status = searchParams.get('status');
    
    let query: any = {};
    if (batchId) query.batchId = batchId;
    if (status) query.status = status;
    
    const missions = await MissionV2.find(query)
      .populate('batchId', 'code title')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    return NextResponse.json({ success: true, data: missions });
  } catch (error) {
    console.error('Error fetching missions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch missions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    
    // Initialize fast retrieval fields
    const missionData = {
      ...body,
      studentIds: [],
      totalStudents: 0,
      mentorIds: [],
      totalMentors: 0,
      groupIds: [],
      totalGroups: 0
    };
    
    const mission = new MissionV2(missionData);
    await mission.save();
    
    return NextResponse.json({ success: true, data: mission }, { status: 201 });
  } catch (error) {
    console.error('Error creating mission:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create mission' },
      { status: 500 }
    );
  }
}
```

### **Step 2.3: Create V2 MissionStudent Routes**
```typescript
// src/app/api/v2/mission-students/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MissionStudentV2 } from '@/models/v2/MissionStudent';
import { MissionV2 } from '@/models/v2/Mission';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const { studentId, missionId, batchId } = body;
    
    // Check if student is already assigned to this mission
    const existingAssignment = await MissionStudentV2.findOne({
      studentId,
      missionId
    });
    
    if (existingAssignment) {
      return NextResponse.json(
        { success: false, error: 'Student already assigned to this mission' },
        { status: 400 }
      );
    }
    
    // Create mission student record
    const missionStudent = new MissionStudentV2({
      studentId,
      missionId,
      batchId,
      startedAt: new Date(),
      lastActivity: new Date(),
      status: 'active',
      isRegular: true,
      attendanceRate: 100,
      progress: 0,
      courseProgress: []
    });
    
    await missionStudent.save();
    
    // Update mission studentIds array and totalStudents count
    await MissionV2.findByIdAndUpdate(missionId, {
      $push: { studentIds: studentId },
      $inc: { totalStudents: 1 }
    });
    
    return NextResponse.json({ success: true, data: missionStudent }, { status: 201 });
  } catch (error) {
    console.error('Error assigning student to mission:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to assign student to mission' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const missionId = searchParams.get('missionId');
    const status = searchParams.get('status');
    
    let query: any = {};
    if (missionId) query.missionId = missionId;
    if (status) query.status = status;
    
    const missionStudents = await MissionStudentV2.find(query)
      .populate('studentId', 'name email')
      .populate('missionId', 'title code')
      .populate('batchId', 'code title')
      .sort({ createdAt: -1 });
    
    return NextResponse.json({ success: true, data: missionStudents });
  } catch (error) {
    console.error('Error fetching mission students:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch mission students' },
      { status: 500 }
    );
  }
}
```

### **Step 2.4: Create V2 Group Status Update Endpoint**
```typescript
// src/app/api/v2/mission-students/[id]/group-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MissionStudentV2 } from '@/models/v2/MissionStudent';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    const { id } = params;
    const body = await request.json();
    const { status, reason, notes, changedBy } = body;
    
    // Update group status
    const updatedStudent = await MissionStudentV2.findByIdAndUpdate(
      id,
      {
        'groupStatus.status': status,
        'groupStatus.reason': reason,
        'groupStatus.notes': notes,
        'groupStatus.changedAt': new Date(),
        'groupStatus.changedBy': changedBy
      },
      { new: true }
    ).populate('studentId', 'name email');
    
    if (!updatedStudent) {
      return NextResponse.json(
        { success: false, error: 'Mission student not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: updatedStudent });
  } catch (error) {
    console.error('Error updating group status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update group status' },
      { status: 500 }
    );
  }
}
```

---

## **🎨 PHASE 3: V2 UI COMPONENTS (Week 3)**

### **Step 3.1: Create V2 Components Directory Structure**
```bash
mkdir -p src/components/v2/admin/MissionManagement
mkdir -p src/components/v2/admin/ParticipantManagement
mkdir -p src/components/v2/admin/GroupManagement
mkdir -p src/components/v2/mission-hub
mkdir -p src/components/v2/shared
```

### **Step 3.2: Create V2 Status Badge Component**
```typescript
// src/components/v2/shared/StatusBadgeV2.tsx
'use client';

import React from 'react';

interface StatusBadgeV2Props {
  status: string;
  level: 'mission' | 'group';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const StatusBadgeV2: React.FC<StatusBadgeV2Props> = ({ 
  status, 
  level, 
  size = 'md',
  className = '' 
}) => {
  const getStatusColor = (status: string, level: 'mission' | 'group') => {
    const colors = {
      active: 'bg-green-100 text-green-800 border-green-200',
      deactive: 'bg-red-100 text-red-800 border-red-200',
      irregular: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      completed: 'bg-blue-100 text-blue-800 border-blue-200',
      dropped: 'bg-gray-100 text-gray-800 border-gray-200',
      'on-hold': 'bg-orange-100 text-orange-800 border-orange-200',
      overloaded: 'bg-purple-100 text-purple-800 border-purple-200',
      unavailable: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    
    return colors[status as keyof typeof colors] || colors.active;
  };
  
  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'lg':
        return 'px-4 py-2 text-base';
      default:
        return 'px-3 py-1.5 text-sm';
    }
  };
  
  return (
    <span
      className={`
        inline-flex items-center rounded-full border font-medium
        ${getStatusColor(status, level)}
        ${getSizeClasses(size)}
        ${className}
      `}
    >
      <span className="capitalize">{status}</span>
      <span className="ml-1 text-xs opacity-75">({level})</span>
    </span>
  );
};

export default StatusBadgeV2;
```

### **Step 3.3: Create V2 Dual Status Display Component**
```typescript
// src/components/v2/shared/DualStatusDisplayV2.tsx
'use client';

import React from 'react';
import StatusBadgeV2 from './StatusBadgeV2';

interface DualStatusDisplayV2Props {
  missionStatus: string;
  groupStatus?: string;
  showLabels?: boolean;
  className?: string;
}

const DualStatusDisplayV2: React.FC<DualStatusDisplayV2Props> = ({
  missionStatus,
  groupStatus,
  showLabels = true,
  className = ''
}) => {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {showLabels && (
        <div className="text-xs text-gray-500 font-medium">Status</div>
      )}
      
      <div className="flex flex-wrap gap-2">
        <StatusBadgeV2
          status={missionStatus}
          level="mission"
          size="sm"
        />
        
        {groupStatus && (
          <StatusBadgeV2
            status={groupStatus}
            level="group"
            size="sm"
          />
        )}
      </div>
      
      {!groupStatus && (
        <div className="text-xs text-gray-400">
          No group assignment
        </div>
      )}
    </div>
  );
};

export default DualStatusDisplayV2;
```

---

## **📱 PHASE 4: V2 PAGES & INTEGRATION (Week 4)**

### **Step 4.1: Create V2 Admin Mission List Page**
```typescript
// src/app/v2/admin/missions/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { MissionV2 } from '@/models/v2/Mission';

interface MissionV2Data {
  _id: string;
  code: string;
  title: string;
  status: string;
  totalStudents: number;
  totalMentors: number;
  totalGroups: number;
  batchId: {
    code: string;
    title: string;
  };
  createdAt: string;
}

export default function MissionsV2Page() {
  const [missions, setMissions] = useState<MissionV2Data[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchMissions();
  }, []);
  
  const fetchMissions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v2/missions');
      const result = await response.json();
      
      if (result.success) {
        setMissions(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to fetch missions');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl font-semibold mb-2">Error</div>
          <div className="text-gray-600">{error}</div>
          <button
            onClick={fetchMissions}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">V2 Missions</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Create Mission
        </button>
      </div>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mission
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Batch
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Participants
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {missions.map((mission) => (
              <tr key={mission._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {mission.title}
                    </div>
                    <div className="text-sm text-gray-500">
                      {mission.code}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {mission.batchId.code}
                  </div>
                  <div className="text-sm text-gray-500">
                    {mission.batchId.title}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    mission.status === 'active' ? 'bg-green-100 text-green-800' :
                    mission.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                    mission.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {mission.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex space-x-4">
                    <div>
                      <span className="font-medium">{mission.totalStudents}</span>
                      <span className="text-gray-500 ml-1">Students</span>
                    </div>
                    <div>
                      <span className="font-medium">{mission.totalMentors}</span>
                      <span className="text-gray-500 ml-1">Mentors</span>
                    </div>
                    <div>
                      <span className="font-medium">{mission.totalGroups}</span>
                      <span className="text-gray-500 ml-1">Groups</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(mission.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-900 mr-3">
                    View
                  </button>
                  <button className="text-green-600 hover:text-green-900 mr-3">
                    Edit
                  </button>
                  <button className="text-red-600 hover:text-red-900">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

## **🔧 TESTING & VALIDATION**

### **Step 5.1: Test V2 Models**
```bash
# Test model creation
npm run test:models

# Test database connections
npm run test:db

# Test validation
npm run test:validation
```

### **Step 5.2: Test V2 APIs**
```bash
# Test API endpoints
npm run test:api

# Test error handling
npm run test:errors

# Test performance
npm run test:performance
```

### **Step 5.3: Test V2 UI Components**
```bash
# Test component rendering
npm run test:components

# Test user interactions
npm run test:interactions

# Test accessibility
npm run test:accessibility
```

---

## **✅ SUCCESS CRITERIA CHECKLIST**

### **Week 1: V2 Database Models**
- [ ] V2 Mission model with fast retrieval arrays
- [ ] V2 MissionStudent model with dual-level status
- [ ] V2 MissionMentor model with dual-level status
- [ ] V2 MentorshipGroup model
- [ ] Proper indexes and validation
- [ ] Data migration scripts

### **Week 2: V2 API Routes**
- [ ] V2 Mission routes working
- [ ] V2 MissionStudent routes working
- [ ] V2 MissionMentor routes working
- [ ] V2 MentorshipGroup routes working
- [ ] V2 Analytics routes working
- [ ] Error handling and validation

### **Week 3: V2 UI Components**
- [ ] V2 Admin components created
- [ ] V2 Mission Hub components created
- [ ] V2 Student & Mentor components created
- [ ] V2 Shared components created
- [ ] Dual-level status management UI
- [ ] Responsive design and accessibility

### **Week 4: V2 Pages & Integration**
- [ ] V2 Admin pages working
- [ ] V2 Mission Hub pages working
- [ ] V2 Student & Mentor pages working
- [ ] Components integrated with pages
- [ ] Navigation and routing working
- [ ] All functionality tested

---

**Document Version**: 1.0  
**Status**: Ready for Implementation  
**Focus**: Step-by-step implementation guide with code examples
