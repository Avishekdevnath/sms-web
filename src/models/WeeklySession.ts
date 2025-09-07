import mongoose, { Schema, models, model } from "mongoose";

export interface ISessionDetails {
  title: string;
  description?: string;
  scheduledTime?: Date;
  duration?: number; // minutes
  type: 'guideline' | 'special' | 'teacher' | 'mentor';
  materials?: string[];
  status?: 'planned' | 'in-progress' | 'completed' | 'cancelled';
  attendees?: mongoose.Types.ObjectId[];
  notes?: string;
}

export interface IWeeklySession {
  _id: string;
  weekNumber: number;
  batchId: mongoose.Types.ObjectId;
  startDate?: Date;
  endDate?: Date;
  sessions: {
    guidelineSession1?: ISessionDetails;
    guidelineSession2?: ISessionDetails;
    specialSession?: ISessionDetails;
    teacherSession?: ISessionDetails;
    mentorSession?: ISessionDetails;
  };
  attendance?: mongoose.Types.ObjectId[];
  materials?: string[];
  status?: 'planned' | 'in-progress' | 'completed';
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const SessionDetailsSchema = new Schema<ISessionDetails>(
  {
    title: { 
      type: String, 
      required: true 
    },
    description: { 
      type: String, 
      required: false 
    },
    scheduledTime: { 
      type: Date, 
      required: false 
    },
    duration: { 
      type: Number, 
      required: false,
      default: 60
    },
    type: { 
      type: String, 
      enum: ['guideline', 'special', 'teacher', 'mentor'],
      required: true
    },
    materials: [{ 
      type: String, 
      required: false 
    }],
    status: { 
      type: String, 
      enum: ['planned', 'in-progress', 'completed', 'cancelled'],
      required: false,
      default: 'planned'
    },
    attendees: [{ 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: false 
    }],
    notes: { 
      type: String, 
      required: false 
    }
  },
  { _id: false }
);

const WeeklySessionSchema = new Schema<IWeeklySession>(
  {
    weekNumber: { 
      type: Number, 
      required: true 
    },
    batchId: { 
      type: Schema.Types.ObjectId, 
      ref: "Batch", 
      required: true 
    },
    startDate: { 
      type: Date, 
      required: false 
    },
    endDate: { 
      type: Date, 
      required: false 
    },
    sessions: {
      guidelineSession1: { 
        type: SessionDetailsSchema, 
        required: false 
      },
      guidelineSession2: { 
        type: SessionDetailsSchema, 
        required: false 
      },
      specialSession: { 
        type: SessionDetailsSchema, 
        required: false 
      },
      teacherSession: { 
        type: SessionDetailsSchema, 
        required: false 
      },
      mentorSession: { 
        type: SessionDetailsSchema, 
        required: false 
      }
    },
    attendance: [{ 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: false 
    }],
    materials: [{ 
      type: String, 
      required: false 
    }],
    status: { 
      type: String, 
      enum: ['planned', 'in-progress', 'completed'],
      required: false,
      default: 'planned'
    },
    notes: { 
      type: String, 
      required: false 
    }
  },
  { timestamps: true }
);

// Indexes for efficient queries
WeeklySessionSchema.index({ batchId: 1, weekNumber: 1 }, { unique: true });
WeeklySessionSchema.index({ batchId: 1, startDate: 1 });
WeeklySessionSchema.index({ status: 1, weekNumber: 1 });

export const WeeklySession = models.WeeklySession || model<IWeeklySession>("WeeklySession", WeeklySessionSchema);
