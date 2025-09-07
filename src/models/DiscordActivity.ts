import mongoose, { Schema, models, model } from "mongoose";

export interface IDiscordActivity {
  _id: string;
  studentId: mongoose.Types.ObjectId;
  channelId?: string;
  channelName?: string;
  activityType: 'message' | 'reaction' | 'attendance' | 'support_request' | 'announcement' | 'meeting_join' | 'meeting_leave';
  timestamp: Date;
  content?: string;
  metadata?: {
    messageId?: string;
    reactionType?: string;
    meetingDuration?: number;
    attendanceStatus?: 'present' | 'absent' | 'late';
    supportRequestType?: 'coding' | 'guideline' | 'general';
    urgency?: 'low' | 'medium' | 'high' | 'urgent';
  };
  batchId?: mongoose.Types.ObjectId;
  sessionId?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const DiscordActivitySchema = new Schema<IDiscordActivity>(
  {
    studentId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    channelId: { 
      type: String, 
      required: false 
    },
    channelName: { 
      type: String, 
      required: false 
    },
    activityType: { 
      type: String, 
      enum: ['message', 'reaction', 'attendance', 'support_request', 'announcement', 'meeting_join', 'meeting_leave'],
      required: true
    },
    timestamp: { 
      type: Date, 
      required: true,
      default: Date.now
    },
    content: { 
      type: String, 
      required: false 
    },
    metadata: {
      messageId: { 
        type: String, 
        required: false 
      },
      reactionType: { 
        type: String, 
        required: false 
      },
      meetingDuration: { 
        type: Number, 
        required: false 
      },
      attendanceStatus: { 
        type: String, 
        enum: ['present', 'absent', 'late'],
        required: false
      },
      supportRequestType: { 
        type: String, 
        enum: ['coding', 'guideline', 'general'],
        required: false
      },
      urgency: { 
        type: String, 
        enum: ['low', 'medium', 'high', 'urgent'],
        required: false
      }
    },
    batchId: { 
      type: Schema.Types.ObjectId, 
      ref: "Batch", 
      required: false 
    },
    sessionId: { 
      type: Schema.Types.ObjectId, 
      ref: "GuidelineSession", 
      required: false 
    }
  },
  { timestamps: true }
);

// Indexes for efficient queries
DiscordActivitySchema.index({ studentId: 1, timestamp: 1 });
DiscordActivitySchema.index({ channelId: 1, activityType: 1 });
DiscordActivitySchema.index({ batchId: 1, timestamp: 1 });
DiscordActivitySchema.index({ activityType: 1, timestamp: 1 });
DiscordActivitySchema.index({ timestamp: 1 }); // For time-based queries

export const DiscordActivity = models.DiscordActivity || model<IDiscordActivity>("DiscordActivity", DiscordActivitySchema);
