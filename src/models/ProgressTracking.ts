import mongoose, { Schema, models, model } from "mongoose";

export interface IProgressTracking {
  _id: string;
  studentId: mongoose.Types.ObjectId;
  batchId: mongoose.Types.ObjectId;
  weekNumber: number;
  startDate?: Date;
  endDate?: Date;
  attendance: {
    guidelineSessions?: number;
    specialSessions?: number;
    mentorSessions?: number;
    teacherSessions?: number;
    totalSessions?: number;
    attendanceRate?: number; // percentage
  };
  performance: {
    assignments?: number;
    assignmentsCompleted?: number;
    assignmentsSubmitted?: number;
    examScores?: number[];
    averageScore?: number;
    highestScore?: number;
    lowestScore?: number;
    performanceTrend?: 'improving' | 'stable' | 'declining';
  };
  engagement: {
    discordActivity?: number;
    supportRequests?: number;
    participationScore?: number; // 0-100
    responseTime?: number; // average response time in minutes
    initiativeLevel?: 'low' | 'medium' | 'high';
  };
  riskAssessment: {
    riskLevel?: 'low' | 'medium' | 'high' | 'critical';
    riskFactors?: string[];
    recommendedActions?: string[];
    lastAssessmentDate?: Date;
    nextAssessmentDate?: Date;
  };
  targets: {
    weeklyTargets?: string[];
    completedTargets?: string[];
    missedTargets?: string[];
    targetCompletionRate?: number;
  };
  support: {
    mentorAssigned?: mongoose.Types.ObjectId;
    supportLevel?: 'regular' | 'intensive' | 'rescue';
    lastSupportDate?: Date;
    nextSupportDate?: Date;
    supportHistory?: string[];
  };
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const ProgressTrackingSchema = new Schema<IProgressTracking>(
  {
    studentId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    batchId: { 
      type: Schema.Types.ObjectId, 
      ref: "Batch", 
      required: true 
    },
    weekNumber: { 
      type: Number, 
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
    attendance: {
      guidelineSessions: { 
        type: Number, 
        required: false,
        default: 0
      },
      specialSessions: { 
        type: Number, 
        required: false,
        default: 0
      },
      mentorSessions: { 
        type: Number, 
        required: false,
        default: 0
      },
      teacherSessions: { 
        type: Number, 
        required: false,
        default: 0
      },
      totalSessions: { 
        type: Number, 
        required: false,
        default: 0
      },
      attendanceRate: { 
        type: Number, 
        required: false,
        min: 0,
        max: 100
      }
    },
    performance: {
      assignments: { 
        type: Number, 
        required: false,
        default: 0
      },
      assignmentsCompleted: { 
        type: Number, 
        required: false,
        default: 0
      },
      assignmentsSubmitted: { 
        type: Number, 
        required: false,
        default: 0
      },
      examScores: [{ 
        type: Number, 
        required: false,
        min: 0,
        max: 100
      }],
      averageScore: { 
        type: Number, 
        required: false,
        min: 0,
        max: 100
      },
      highestScore: { 
        type: Number, 
        required: false,
        min: 0,
        max: 100
      },
      lowestScore: { 
        type: Number, 
        required: false,
        min: 0,
        max: 100
      },
      performanceTrend: { 
        type: String, 
        enum: ['improving', 'stable', 'declining'],
        required: false,
        default: 'stable'
      }
    },
    engagement: {
      discordActivity: { 
        type: Number, 
        required: false,
        default: 0
      },
      supportRequests: { 
        type: Number, 
        required: false,
        default: 0
      },
      participationScore: { 
        type: Number, 
        required: false,
        min: 0,
        max: 100,
        default: 0
      },
      responseTime: { 
        type: Number, 
        required: false,
        min: 0
      },
      initiativeLevel: { 
        type: String, 
        enum: ['low', 'medium', 'high'],
        required: false,
        default: 'medium'
      }
    },
    riskAssessment: {
      riskLevel: { 
        type: String, 
        enum: ['low', 'medium', 'high', 'critical'],
        required: false,
        default: 'low'
      },
      riskFactors: [{ 
        type: String, 
        required: false 
      }],
      recommendedActions: [{ 
        type: String, 
        required: false 
      }],
      lastAssessmentDate: { 
        type: Date, 
        required: false 
      },
      nextAssessmentDate: { 
        type: Date, 
        required: false 
      }
    },
    targets: {
      weeklyTargets: [{ 
        type: String, 
        required: false 
      }],
      completedTargets: [{ 
        type: String, 
        required: false 
      }],
      missedTargets: [{ 
        type: String, 
        required: false 
      }],
      targetCompletionRate: { 
        type: Number, 
        required: false,
        min: 0,
        max: 100
      }
    },
    support: {
      mentorAssigned: { 
        type: Schema.Types.ObjectId, 
        ref: "User", 
        required: false 
      },
      supportLevel: { 
        type: String, 
        enum: ['regular', 'intensive', 'rescue'],
        required: false,
        default: 'regular'
      },
      lastSupportDate: { 
        type: Date, 
        required: false 
      },
      nextSupportDate: { 
        type: Date, 
        required: false 
      },
      supportHistory: [{ 
        type: String, 
        required: false 
      }]
    },
    notes: { 
      type: String, 
      required: false 
    }
  },
  { timestamps: true }
);

// Indexes for efficient queries
ProgressTrackingSchema.index({ studentId: 1, batchId: 1, weekNumber: 1 }, { unique: true });
ProgressTrackingSchema.index({ batchId: 1, weekNumber: 1 });
ProgressTrackingSchema.index({ studentId: 1, startDate: 1 });
ProgressTrackingSchema.index({ riskLevel: 1, weekNumber: 1 });
ProgressTrackingSchema.index({ supportLevel: 1, weekNumber: 1 });

export const ProgressTracking = models.ProgressTracking || model<IProgressTracking>("ProgressTracking", ProgressTrackingSchema);
