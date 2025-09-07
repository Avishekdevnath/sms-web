import mongoose, { Schema, models, model } from "mongoose";

export interface ISupportAction {
  type: 'phone_call' | 'email' | 'discord_message' | 'special_session' | 'mentor_assignment' | 'target_setting';
  date: Date;
  description: string;
  outcome: string;
  nextAction?: string;
  nextActionDate?: Date;
  performedBy?: mongoose.Types.ObjectId;
  notes?: string;
}

export interface ITarget {
  _id: string;
  description: string;
  deadline: Date;
  status: 'pending' | 'in-progress' | 'completed' | 'missed';
  completionDate?: Date;
  notes?: string;
  assignedBy?: mongoose.Types.ObjectId;
  assignedDate?: Date;
}

export interface IStrugglingStudent {
  _id: string;
  studentId: mongoose.Types.ObjectId;
  batchId: mongoose.Types.ObjectId;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  detectionDate: Date;
  supportLevel: 'regular' | 'intensive' | 'rescue';
  supportHistory: ISupportAction[];
  currentTargets: ITarget[];
  nextFollowUp?: Date;
  assignedMentor?: mongoose.Types.ObjectId;
  rescueGroup?: string;
  lastContactDate?: Date;
  contactFrequency?: 'daily' | 'weekly' | 'bi-weekly';
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const SupportActionSchema = new Schema<ISupportAction>(
  {
    type: { 
      type: String, 
      enum: ['phone_call', 'email', 'discord_message', 'special_session', 'mentor_assignment', 'target_setting'],
      required: true
    },
    date: { 
      type: Date, 
      required: true 
    },
    description: { 
      type: String, 
      required: true 
    },
    outcome: { 
      type: String, 
      required: true 
    },
    nextAction: { 
      type: String, 
      required: false 
    },
    nextActionDate: { 
      type: Date, 
      required: false 
    },
    performedBy: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: false 
    },
    notes: { 
      type: String, 
      required: false 
    }
  },
  { _id: false }
);

const TargetSchema = new Schema<ITarget>(
  {
    description: { 
      type: String, 
      required: true 
    },
    deadline: { 
      type: Date, 
      required: true 
    },
    status: { 
      type: String, 
      enum: ['pending', 'in-progress', 'completed', 'missed'],
      required: true,
      default: 'pending'
    },
    completionDate: { 
      type: Date, 
      required: false 
    },
    notes: { 
      type: String, 
      required: false 
    },
    assignedBy: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: false 
    },
    assignedDate: { 
      type: Date, 
      required: false,
      default: Date.now
    }
  },
  { _id: false }
);

const StrugglingStudentSchema = new Schema<IStrugglingStudent>(
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
    riskLevel: { 
      type: String, 
      enum: ['low', 'medium', 'high', 'critical'],
      required: true,
      default: 'medium'
    },
    detectionDate: { 
      type: Date, 
      required: true,
      default: Date.now
    },
    supportLevel: { 
      type: String, 
      enum: ['regular', 'intensive', 'rescue'],
      required: true,
      default: 'regular'
    },
    supportHistory: [{ 
      type: SupportActionSchema, 
      required: false 
    }],
    currentTargets: [{ 
      type: TargetSchema, 
      required: false 
    }],
    nextFollowUp: { 
      type: Date, 
      required: false 
    },
    assignedMentor: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: false 
    },
    rescueGroup: { 
      type: String, 
      required: false 
    },
    lastContactDate: { 
      type: Date, 
      required: false 
    },
    contactFrequency: { 
      type: String, 
      enum: ['daily', 'weekly', 'bi-weekly'],
      required: false,
      default: 'weekly'
    },
    notes: { 
      type: String, 
      required: false 
    }
  },
  { timestamps: true }
);

// Indexes for efficient queries
StrugglingStudentSchema.index({ studentId: 1, batchId: 1 }, { unique: true });
StrugglingStudentSchema.index({ riskLevel: 1, supportLevel: 1 });
StrugglingStudentSchema.index({ assignedMentor: 1, nextFollowUp: 1 });
StrugglingStudentSchema.index({ batchId: 1, detectionDate: 1 });

export const StrugglingStudent = models.StrugglingStudent || model<IStrugglingStudent>("StrugglingStudent", StrugglingStudentSchema);
