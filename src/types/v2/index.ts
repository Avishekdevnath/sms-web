// ✅ V2 TYPES INDEX FILE
// Common types and interfaces for V2 system

import { Types } from 'mongoose';

// ✅ STATUS ENUMS
export type MissionStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';
export type StudentStatus = 'active' | 'deactive' | 'irregular' | 'completed' | 'dropped' | 'on-hold';
export type MentorStatus = 'active' | 'deactive' | 'irregular' | 'overloaded' | 'unavailable';
export type GroupStatus = 'forming' | 'active' | 'inactive' | 'completed' | 'disbanded';
export type GroupStudentStatus = 'active' | 'deactive' | 'irregular' | 'on-hold';
export type GroupMentorStatus = 'active' | 'deactive' | 'irregular' | 'overloaded' | 'unavailable';

// ✅ ROLE ENUMS
export type MissionMentorRole = 'mission-lead' | 'coordinator' | 'advisor' | 'supervisor';
export type GroupMentorRole = 'primary' | 'co-mentor' | 'moderator';
export type GroupType = 'study' | 'project' | 'review' | 'workshop' | 'mixed';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'mixed';
export type MeetingFrequency = 'weekly' | 'biweekly' | 'monthly' | 'on-demand';
export type CommunicationType = 'discord' | 'slack' | 'telegram' | 'whatsapp';

// ✅ COMMON INTERFACES
export interface BaseEntity {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeRange {
  start: string;  // "09:00"
  end: string;    // "17:00"
}

export interface Availability {
  days: number[];                    // [1,2,3,4,5] for Mon-Fri
  hours: TimeRange;
  timezone: string;                  // "Asia/Dhaka"
  preferredSessionDuration: number;  // Duration in minutes
}

export interface MeetingSchedule {
  frequency: MeetingFrequency;
  dayOfWeek?: number;               // 0-6 (Sunday-Saturday)
  time?: string;                    // "14:00"
  duration: number;                 // Duration in minutes
  timezone: string;                 // "Asia/Dhaka"
}

export interface CommunicationChannel {
  type: CommunicationType;
  channelId?: string;
  inviteLink?: string;
}

// ✅ STATUS CHANGE INTERFACES
export interface StatusChange {
  status: string;
  reason?: string;
  changedAt: Date;
  changedBy: Types.ObjectId;
  notes?: string;
}

export interface GroupStatusChange extends StatusChange {
  groupId: Types.ObjectId;
  role?: GroupMentorRole;
}

// ✅ PROGRESS INTERFACES
export interface CourseProgress {
  courseOfferingId: Types.ObjectId;
  progress: number;                  // 0-100
  completedAssignments: Types.ObjectId[];
  lastActivity: Date;
  mentorFeedback?: string;
}

export interface GroupProgress {
  overallProgress: number;           // 0-100
  lastMeetingDate?: Date;
  nextMeetingDate?: Date;
  totalMeetings: number;
  activeStudents: number;
}

export interface MentorStats {
  avgStudentProgress: number;        // 0-100
  sessionCompletionRate: number;     // 0-100
  studentSatisfaction: number;       // 1-5
}

// ✅ COURSE CONFIGURATION
export interface CourseConfig {
  courseOfferingId: Types.ObjectId;
  weight: number;                    // Percentage weight
  requiredAssignments: Types.ObjectId[];
  minProgress: number;               // 0-100
}

// ✅ API RESPONSE INTERFACES
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  status?: string;
  batchId?: string;
  missionId?: string;
  groupId?: string;
  role?: string;
  specialization?: string;
  groupType?: string;
  skillLevel?: string;
}

// ✅ QUERY INTERFACES
export interface MissionQuery extends PaginationParams, FilterParams {
  code?: string;
  title?: string;
  startDate?: Date;
  endDate?: Date;
  createdBy?: string;
}

export interface StudentQuery extends PaginationParams, FilterParams {
  studentId?: string;
  isRegular?: boolean;
  attendanceRate?: { min: number; max: number };
  progress?: { min: number; max: number };
}

export interface MentorQuery extends PaginationParams, FilterParams {
  mentorId?: string;
  isRegular?: boolean;
  availabilityRate?: { min: number; max: number };
  maxStudents?: { min: number; max: number };
  currentStudents?: { min: number; max: number };
}

export interface GroupQuery extends PaginationParams, FilterParams {
  name?: string;
  primaryMentorId?: string;
  coMentorIds?: string[];
  isFull?: boolean;
  isMinimumMet?: boolean;
}

// ✅ CREATE/UPDATE INTERFACES
export interface CreateMissionData {
  code: string;
  title: string;
  description?: string;
  batchId: string;
  startDate?: Date;
  endDate?: Date;
  maxStudents?: number;
  requirements?: string[];
  rewards?: string[];
  courses?: CourseConfig[];
}

export interface CreateStudentData {
  studentId: string;
  missionId: string;
  batchId: string;
  status?: StudentStatus;
  missionNotes?: string;
}

export interface CreateMentorData {
  mentorId: string;
  missionId: string;
  batchId: string;
  role?: MissionMentorRole;
  specialization?: string[];
  responsibilities?: string[];
  maxStudents?: number;
  availability?: Availability;
}

export interface CreateGroupData {
  name: string;
  missionId: string;
  batchId: string;
  primaryMentorId: string;
  coMentorIds?: string[];
  studentIds?: string[];
  groupType?: GroupType;
  focusArea?: string[];
  skillLevel?: SkillLevel;
  meetingSchedule?: MeetingSchedule;
  maxStudents?: number;
  minStudents?: number;
}

// ✅ UPDATE INTERFACES
export interface UpdateMissionData {
  title?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  status?: MissionStatus;
  maxStudents?: number;
  requirements?: string[];
  rewards?: string[];
  courses?: CourseConfig[];
}

export interface UpdateStudentData {
  status?: StudentStatus;
  progress?: number;
  isRegular?: boolean;
  attendanceRate?: number;
  missionNotes?: string;
  irregularityReason?: string;
  deactivationReason?: string;
  mentorshipGroupId?: string;
}

export interface UpdateMentorData {
  status?: MentorStatus;
  role?: MissionMentorRole;
  specialization?: string[];
  responsibilities?: string[];
  maxStudents?: number;
  availability?: Availability;
  missionNotes?: string;
}

export interface UpdateGroupData {
  name?: string;
  status?: GroupStatus;
  groupType?: GroupType;
  focusArea?: string[];
  skillLevel?: SkillLevel;
  meetingSchedule?: MeetingSchedule;
  maxStudents?: number;
  minStudents?: number;
  communicationChannel?: CommunicationChannel;
}

// ✅ STATUS UPDATE INTERFACES
export interface UpdateStudentGroupStatusData {
  status: GroupStudentStatus;
  reason?: string;
  notes?: string;
}

export interface UpdateMentorGroupStatusData {
  status: GroupMentorStatus;
  reason?: string;
  notes?: string;
  role?: GroupMentorRole;
}

// ✅ BULK OPERATION INTERFACES
export interface BulkStudentAssignment {
  studentIds: string[];
  missionId: string;
  batchId: string;
  status?: StudentStatus;
}

export interface BulkMentorAssignment {
  mentorIds: string[];
  missionId: string;
  batchId: string;
  role?: MissionMentorRole;
}

export interface BulkGroupAssignment {
  groupId: string;
  studentIds?: string[];
  mentorIds?: string[];
}

// ✅ STATISTICS INTERFACES
export interface MissionStatistics {
  totalStudents: number;
  activeStudents: number;
  totalMentors: number;
  activeMentors: number;
  totalGroups: number;
  activeGroups: number;
  overallProgress: number;
  averageAttendance: number;
  averageMentorRating: number;
}

export interface GroupStatistics {
  totalStudents: number;
  activeStudents: number;
  totalMentors: number;
  overallProgress: number;
  totalMeetings: number;
  lastMeetingDate?: Date;
  nextMeetingDate?: Date;
}

// ✅ EXPORT ALL TYPES
export type {
  MissionStatus,
  StudentStatus,
  MentorStatus,
  GroupStatus,
  GroupStudentStatus,
  GroupMentorStatus,
  MissionMentorRole,
  GroupMentorRole,
  GroupType,
  SkillLevel,
  MeetingFrequency,
  CommunicationType
};
