import mongoose, { Schema, models, model } from "mongoose";

export interface IMentorMeeting {
  _id: string;
  mentorId: mongoose.Types.ObjectId;
  studentIds: mongoose.Types.ObjectId[];
  batchId?: mongoose.Types.ObjectId;
  meetingDate: Date;
  duration: number; // minutes
  agenda: string[];
  problemsIdentified: string[];
  solutionsProvided: string[];
  nextActions: string[];
  followUpDate?: Date;
  meetingType: 'weekly' | 'special' | 'rescue' | 'one-on-one';
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  notes?: string;
  materials?: string[];
  attendance: mongoose.Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
}

const MentorMeetingSchema = new Schema<IMentorMeeting>(
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
      required: false 
    },
    meetingDate: { 
      type: Date, 
      required: true 
    },
    duration: { 
      type: Number, 
      required: true,
      default: 60
    },
    agenda: [{ 
      type: String, 
      required: false 
    }],
    problemsIdentified: [{ 
      type: String, 
      required: false 
    }],
    solutionsProvided: [{ 
      type: String, 
      required: false 
    }],
    nextActions: [{ 
      type: String, 
      required: false 
    }],
    followUpDate: { 
      type: Date, 
      required: false 
    },
    meetingType: { 
      type: String, 
      enum: ['weekly', 'special', 'rescue', 'one-on-one'],
      required: true,
      default: 'weekly'
    },
    status: { 
      type: String, 
      enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
      required: true,
      default: 'scheduled'
    },
    notes: { 
      type: String, 
      required: false 
    },
    materials: [{ 
      type: String, 
      required: false 
    }],
    attendance: [{ 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: false 
    }]
  },
  { timestamps: true }
);

// Indexes for efficient queries
MentorMeetingSchema.index({ mentorId: 1, meetingDate: 1 });
MentorMeetingSchema.index({ batchId: 1, meetingDate: 1 });
MentorMeetingSchema.index({ meetingType: 1, status: 1 });
MentorMeetingSchema.index({ followUpDate: 1, status: 1 });

export const MentorMeeting = models.MentorMeeting || model<IMentorMeeting>("MentorMeeting", MentorMeetingSchema);
