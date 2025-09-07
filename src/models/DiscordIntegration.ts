import mongoose, { Schema, models, model } from "mongoose";

export interface IDiscordIntegration {
  _id: string;
  serverId: string;
  serverName?: string;
  channels: {
    general?: string;
    support?: string;
    specialSupport?: string;
    mentorSupport?: string;
    announcements?: string;
    attendance?: string;
    rescueGroup?: string;
    dsAlgo?: string;
  };
  botToken?: string;
  webhookUrls?: string[];
  lastSync?: Date;
  status: 'active' | 'inactive' | 'error';
  settings: {
    morningAnnouncementTime?: string; // HH:MM format
    eveningAnnouncementTime?: string; // HH:MM format
    autoAttendanceReminders?: boolean;
    autoDeadlineReminders?: boolean;
    supportRequestNotifications?: boolean;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

const DiscordIntegrationSchema = new Schema<IDiscordIntegration>(
  {
    serverId: { 
      type: String, 
      required: true,
      unique: true
    },
    serverName: { 
      type: String, 
      required: false 
    },
    channels: {
      general: { 
        type: String, 
        required: false 
      },
      support: { 
        type: String, 
        required: false 
      },
      specialSupport: { 
        type: String, 
        required: false 
      },
      mentorSupport: { 
        type: String, 
        required: false 
      },
      announcements: { 
        type: String, 
        required: false 
      },
      attendance: { 
        type: String, 
        required: false 
      },
      rescueGroup: { 
        type: String, 
        required: false 
      },
      dsAlgo: { 
        type: String, 
        required: false 
      }
    },
    botToken: { 
      type: String, 
      required: false 
    },
    webhookUrls: [{ 
      type: String, 
      required: false 
    }],
    lastSync: { 
      type: Date, 
      required: false 
    },
    status: { 
      type: String, 
      enum: ['active', 'inactive', 'error'],
      required: true,
      default: 'inactive'
    },
    settings: {
      morningAnnouncementTime: { 
        type: String, 
        required: false,
        default: '09:00'
      },
      eveningAnnouncementTime: { 
        type: String, 
        required: false,
        default: '18:00'
      },
      autoAttendanceReminders: { 
        type: Boolean, 
        required: false,
        default: true
      },
      autoDeadlineReminders: { 
        type: Boolean, 
        required: false,
        default: true
      },
      supportRequestNotifications: { 
        type: Boolean, 
        required: false,
        default: true
      }
    }
  },
  { timestamps: true }
);

// Indexes for efficient queries
// serverId index removed - already declared as unique in schema
DiscordIntegrationSchema.index({ status: 1, lastSync: 1 });

export const DiscordIntegration = models.DiscordIntegration || model<IDiscordIntegration>("DiscordIntegration", DiscordIntegrationSchema);
