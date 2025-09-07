import { IUser, IBatch, IMission, ICourseOffering, IAssignment, ISemester, IGroup } from '@/models';

// Extended model interfaces for API responses
export interface UserWithBatches extends IUser {
  batches: IBatch[];
  needsInvitation: boolean;
  profileCompleted: boolean;
}

export interface MissionWithDetails extends IMission {
  // The IMission interface already has these fields, so we don't need to redefine them
  // Just ensure proper typing for populated fields
  createdBy: IUser;
  batchId: IBatch;
  courses: Array<{
    courseOfferingId: ICourseOffering;
    weight: number;
    requiredAssignments?: IAssignment[];
    minProgress?: number;
  }>;
  // REMOVED: students array - now using StudentMission collection
  mentors: Array<{
    mentorId: IUser;
    role: 'primary' | 'secondary' | 'moderator';
    specialization: string[];
  }>;
  mentorshipGroups: IGroup[];
}

export interface PopulatedBatch extends IBatch {
  semesters: ISemester[];
  students: IUser[];
}

export interface CourseOfferingWithDetails extends ICourseOffering {
  courseId: {
    _id: string;
    title: string;
    code: string;
  };
  batchId: IBatch;
  semesterId: ISemester;
  assignments?: IAssignment[];
}

export interface StudentWithProfile extends IUser {
  profile?: {
    firstName: string;
    lastName: string;
    username: string;
    phone: string;
    profilePicture: string;
    bio?: string;
    dateOfBirth?: Date;
    address?: string;
    emergencyContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
    academicInfo?: {
      previousInstitution?: string;
      graduationYear?: number;
      gpa?: number;
    };
    socialLinks?: {
      linkedin?: string;
      github?: string;
      portfolio?: string;
    };
    skills?: string[];
    interests?: string[];
    completedAt?: Date;
  };
  batches: IBatch[];
  needsInvitation: boolean;
  profileCompleted: boolean;
}

export interface AssignmentWithDetails extends IAssignment {
  courseOfferingId: CourseOfferingWithDetails;
  createdBy: IUser;
  submissions?: Array<{
    _id: string;
    studentId: IUser;
    submittedAt: Date;
    fileUrl?: string;
    grade?: number;
    feedback?: string;
  }>;
}

// Group-related interfaces
export interface GroupWithDetails extends IGroup {
  mission: IMission;
  mentors: Array<{
    mentorId: IUser;
    role: 'primary' | 'secondary' | 'moderator';
    assignedAt: Date;
  }>;
  students: Array<{
    studentId: IUser;
    assignedAt: Date;
    status: 'active' | 'inactive';
  }>;
}

// Pagination data interface
export interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Search and filter interfaces
export interface SearchFilters {
  search?: string;
  status?: string;
  batchId?: string;
  semesterId?: string;
  createdBy?: string;
  isActive?: boolean;
  profileCompleted?: boolean;
}

// Bulk operation interfaces
export interface BulkOperationResult {
  success: boolean;
  processed: number;
  succeeded: number;
  failed: number;
  errors: Array<{
    id: string;
    error: string;
  }>;
}

export interface BulkDeleteResult extends BulkOperationResult {
  deleted: number;
}

export interface BulkUpdateResult extends BulkOperationResult {
  updated: number;
} 