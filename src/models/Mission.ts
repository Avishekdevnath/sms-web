import { Schema, model, models, Types } from "mongoose";

export interface IMissionCourse {
  courseOfferingId: Types.ObjectId;
  weight: number; // Percentage weight of this course in the mission
  requiredAssignments?: Types.ObjectId[]; // Specific assignments that must be completed
  minProgress: number; // Minimum progress percentage required
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
  // REMOVED: students: IMissionStudent[]; // Now using StudentMission collection
  mentors: {
    mentorId: Types.ObjectId;
    role: 'primary' | 'secondary' | 'moderator';
    specialization: string[];
  }[];
  mentorshipGroups: Types.ObjectId[];
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
  minProgress: { type: Number, min: 0, max: 100, required: true }
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
    // REMOVED: students: [MissionStudentSchema], // Now using StudentMission collection
    mentors: [{
      mentorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
      role: { type: String, enum: ['primary', 'secondary', 'moderator'], required: true },
      specialization: [{ type: String }]
    }],
    mentorshipGroups: [{ type: Schema.Types.ObjectId, ref: "MentorshipGroup" }],
    maxStudents: { type: Number, min: 0, default: 0 }, // 0 = unlimited
    requirements: [{ type: String }],
    rewards: [{ type: String }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

// Indexes for efficient querying
MissionSchema.index({ code: 1 }, { unique: true }); // Unique mission code
MissionSchema.index({ batchId: 1 }); // Find missions by batch
MissionSchema.index({ status: 1 }); // Filter by status
MissionSchema.index({ createdBy: 1 }); // Find missions by creator
MissionSchema.index({ "batchId": 1, "status": 1 }); // Compound index for batch + status queries

export const Mission = models.Mission || model<IMission>("Mission", MissionSchema); 