import { Schema, model, models, Types } from "mongoose";

export interface IStudentMission {
  _id: string;
  studentId: Types.ObjectId; // Reference to User
  missionId: Types.ObjectId; // Reference to Mission
  batchId: Types.ObjectId; // Reference to Batch (for quick filtering)
  status: 'active' | 'completed' | 'failed' | 'dropped';
  progress: number;
  mentorId?: Types.ObjectId | null;
  startedAt: Date;
  completedAt?: Date;
  lastActivity: Date;
  courseProgress: {
    courseOfferingId: Types.ObjectId;
    progress: number;
    completedAssignments: Types.ObjectId[];
    lastActivity: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const StudentMissionCourseProgressSchema = new Schema({
  courseOfferingId: { type: Schema.Types.ObjectId, ref: "CourseOffering", required: true },
  progress: { type: Number, required: true, min: 0, max: 100, default: 0 },
  completedAssignments: [{ type: Schema.Types.ObjectId, ref: "Assignment" }],
  lastActivity: { type: Date, default: Date.now }
});

const StudentMissionSchema = new Schema<IStudentMission>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    missionId: { type: Schema.Types.ObjectId, ref: "Mission", required: true },
    batchId: { type: Schema.Types.ObjectId, ref: "Batch", required: true },
    status: { type: String, enum: ['active', 'completed', 'failed', 'dropped'], default: 'active' },
    progress: { type: Number, required: true, min: 0, max: 100, default: 0 },
    mentorId: { type: Schema.Types.ObjectId, ref: "User" },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    lastActivity: { type: Date, default: Date.now },
    courseProgress: [StudentMissionCourseProgressSchema]
  },
  { timestamps: true }
);

// Indexes for efficient querying
StudentMissionSchema.index({ studentId: 1, missionId: 1 }, { unique: true }); // One student per mission
StudentMissionSchema.index({ studentId: 1 }); // Find all missions for a student
StudentMissionSchema.index({ missionId: 1 }); // Find all students for a mission
StudentMissionSchema.index({ batchId: 1 }); // Find all students in a batch
StudentMissionSchema.index({ status: 1 }); // Filter by status
StudentMissionSchema.index({ "studentId": 1, "status": 1 }); // Compound index for student status queries

export const StudentMission = models.StudentMission || model<IStudentMission>("StudentMission", StudentMissionSchema); 