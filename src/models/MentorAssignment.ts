import mongoose, { Schema, models, model } from "mongoose";

export interface IMentorAssignment {
  _id: string;
  mentorId: mongoose.Types.ObjectId;
  studentIds: mongoose.Types.ObjectId[];
  batchId: mongoose.Types.ObjectId;
  assignmentDate: Date;
  maxStudents: number;
  currentWorkload: number;
  specialization: string[];
  weeklyMeetingSchedule: Date[];
  lastMeetingDate?: Date;
  nextMeetingDate?: Date;
  status: 'active' | 'inactive' | 'overloaded';
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const MentorAssignmentSchema = new Schema<IMentorAssignment>(
  {
    mentorId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    studentIds: [{ 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: false 
    }],
    batchId: { 
      type: Schema.Types.ObjectId, 
      ref: "Batch", 
      required: true 
    },
    assignmentDate: { 
      type: Date, 
      required: true,
      default: Date.now
    },
    maxStudents: { 
      type: Number, 
      required: true,
      default: 10
    },
    currentWorkload: { 
      type: Number, 
      required: true,
      default: 0
    },
    specialization: [{ 
      type: String, 
      required: false 
    }],
    weeklyMeetingSchedule: [{ 
      type: Date, 
      required: false 
    }],
    lastMeetingDate: { 
      type: Date, 
      required: false 
    },
    nextMeetingDate: { 
      type: Date, 
      required: false 
    },
    status: { 
      type: String, 
      enum: ['active', 'inactive', 'overloaded'],
      required: true,
      default: 'active'
    },
    notes: { 
      type: String, 
      required: false 
    }
  },
  { timestamps: true }
);

// Indexes for efficient queries
MentorAssignmentSchema.index({ mentorId: 1, batchId: 1 }, { unique: true });
MentorAssignmentSchema.index({ mentorId: 1, status: 1 });
MentorAssignmentSchema.index({ batchId: 1, status: 1 });
MentorAssignmentSchema.index({ currentWorkload: 1, maxStudents: 1 });

export const MentorAssignment = models.MentorAssignment || model<IMentorAssignment>("MentorAssignment", MentorAssignmentSchema);
