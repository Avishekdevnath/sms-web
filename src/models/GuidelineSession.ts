import mongoose, { Schema, models, model } from "mongoose";

export interface IGuidelineSession {
  _id: string;
  title: string;
  description?: string;
  sessionType: 'orientation' | 'weekly' | 'special' | 'mentor' | 'teacher';
  batchId?: mongoose.Types.ObjectId;
  scheduledDate?: Date;
  duration?: number; // minutes
  attendees?: mongoose.Types.ObjectId[];
  materials?: string[];
  status?: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  sessionNumber?: number; // for weekly sessions
  weekNumber?: number; // for weekly sessions
  mentorId?: mongoose.Types.ObjectId;
  teacherId?: mongoose.Types.ObjectId;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const GuidelineSessionSchema = new Schema<IGuidelineSession>(
  {
    title: { 
      type: String, 
      required: true 
    },
    description: { 
      type: String, 
      required: false 
    },
    sessionType: { 
      type: String, 
      enum: ['orientation', 'weekly', 'special', 'mentor', 'teacher'],
      required: true
    },
    batchId: { 
      type: Schema.Types.ObjectId, 
      ref: "Batch", 
      required: false 
    },
    scheduledDate: { 
      type: Date, 
      required: false 
    },
    duration: { 
      type: Number, 
      required: false,
      default: 60 // default 60 minutes
    },
    attendees: [{ 
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
      enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
      required: false,
      default: 'scheduled'
    },
    sessionNumber: { 
      type: Number, 
      required: false 
    },
    weekNumber: { 
      type: Number, 
      required: false 
    },
    mentorId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: false 
    },
    teacherId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: false 
    },
    notes: { 
      type: String, 
      required: false 
    }
  },
  { timestamps: true }
);

// Indexes for efficient queries
GuidelineSessionSchema.index({ batchId: 1, scheduledDate: 1 });
GuidelineSessionSchema.index({ sessionType: 1, status: 1 });
GuidelineSessionSchema.index({ mentorId: 1, scheduledDate: 1 });

export const GuidelineSession = models.GuidelineSession || model<IGuidelineSession>("GuidelineSession", GuidelineSessionSchema);
