import { Schema, model, models, Types } from "mongoose";

export interface IMissionCourse {
  courseOfferingId: Types.ObjectId;
  weight: number; // Weight of this course in the mission (percentage)
  requiredAssignments?: Types.ObjectId[]; // Specific assignments that must be completed
  minProgress?: number; // Minimum progress percentage required
}

export interface IMissionStudent {
  studentId: Types.ObjectId;
  mentorId?: Types.ObjectId | null;
  status: 'active' | 'completed' | 'failed' | 'dropped';
  progress: number;
  startedAt: Date;
  completedAt?: Date;
  courseProgress: {
    courseOfferingId: Types.ObjectId;
    progress: number;
    completedAssignments: Types.ObjectId[];
    lastActivity: Date;
  }[];
}

export interface IMission {
  _id: string;
  code: string; // Unique mission code
  title: string;
  description?: string;
  batchId: Types.ObjectId; // Batch-specific missions
  startDate?: Date; // Optional start date
  endDate?: Date; // Optional end date
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  courses: IMissionCourse[];
  students: IMissionStudent[];
  maxStudents?: number; // Optional max students
  requirements?: string[];
  rewards?: string[];
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MissionCourseSchema = new Schema<IMissionCourse>({
  courseOfferingId: { type: Schema.Types.ObjectId, ref: "CourseOffering", required: true },
  weight: { type: Number, required: true, min: 0, max: 100 },
  requiredAssignments: [{ type: Schema.Types.ObjectId, ref: "Assignment" }],
  minProgress: { type: Number, min: 0, max: 100 }
});

const MissionStudentCourseProgressSchema = new Schema({
  courseOfferingId: { type: Schema.Types.ObjectId, ref: "CourseOffering", required: true },
  progress: { type: Number, required: true, min: 0, max: 100, default: 0 },
  completedAssignments: [{ type: Schema.Types.ObjectId, ref: "Assignment" }],
  lastActivity: { type: Date, default: Date.now }
});

const MissionStudentSchema = new Schema<IMissionStudent>({
  studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  mentorId: { type: Schema.Types.ObjectId, ref: "User" },
  status: { type: String, enum: ['active', 'completed', 'failed', 'dropped'], default: 'active' },
  progress: { type: Number, required: true, min: 0, max: 100, default: 0 },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  courseProgress: [MissionStudentCourseProgressSchema]
});

const MissionSchema = new Schema<IMission>(
  {
    code: { type: String, required: true }, // Unique mission code
    title: { type: String, required: true },
    description: { type: String },
    batchId: { type: Schema.Types.ObjectId, ref: "Batch", required: true },
    startDate: { type: Date }, // Made optional
    endDate: { type: Date }, // Made optional
    status: { type: String, enum: ['draft', 'active', 'paused', 'completed', 'archived'], default: 'draft' },
    courses: [MissionCourseSchema],
    students: [MissionStudentSchema],
    maxStudents: { type: Number, min: 1 }, // Already optional
    requirements: [{ type: String }],
    rewards: [{ type: String }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// Indexes for efficient querying
MissionSchema.index({ code: 1 }, { unique: true }); // Unique index for mission code
MissionSchema.index({ status: 1, startDate: 1 });
MissionSchema.index({ batchId: 1, status: 1 }); // Add batch-specific index
MissionSchema.index({ "courses.courseOfferingId": 1 });

// Compound index for mission lookup by student and status
MissionSchema.index({ "students.studentId": 1, status: 1 });

export const Mission = models.Mission || model<IMission>("Mission", MissionSchema); 