import { Schema, model, models, Types } from "mongoose";

export interface IFeatureRequest {
  _id: string;
  title: string;
  description: string;
  category: 'bug' | 'enhancement' | 'new-feature' | 'improvement' | 'other';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'under-review' | 'approved' | 'in-progress' | 'completed' | 'rejected';
  submittedBy: Types.ObjectId;
  assignedTo?: Types.ObjectId;
  userRole: 'admin' | 'developer' | 'manager' | 'sre' | 'mentor' | 'student';
  userEmail: string;
  userName: string;
  attachments?: string[];
  tags?: string[];
  estimatedEffort?: number; // in hours
  actualEffort?: number; // in hours
  targetVersion?: string;
  completedAt?: Date;
  notes?: string;
  votes: number;
  createdAt: Date;
  updatedAt: Date;
}

const FeatureRequestSchema = new Schema<IFeatureRequest>(
  {
    title: { type: String, required: true, maxlength: 200 },
    description: { type: String, required: true },
    category: { 
      type: String, 
      enum: ['bug', 'enhancement', 'new-feature', 'improvement', 'other'], 
      required: true 
    },
    priority: { 
      type: String, 
      enum: ['low', 'medium', 'high', 'critical'], 
      required: true,
      default: 'medium'
    },
    status: { 
      type: String, 
      enum: ['pending', 'under-review', 'approved', 'in-progress', 'completed', 'rejected'], 
      required: true,
      default: 'pending'
    },
    submittedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    userRole: { 
      type: String, 
      enum: ['admin', 'developer', 'manager', 'sre', 'mentor', 'student'], 
      required: true 
    },
    userEmail: { type: String, required: true },
    userName: { type: String, required: true },
    attachments: [{ type: String }],
    tags: [{ type: String }],
    estimatedEffort: { type: Number, min: 0 },
    actualEffort: { type: Number, min: 0 },
    targetVersion: { type: String },
    completedAt: { type: Date },
    notes: { type: String },
    votes: { type: Number, default: 0, min: 0 }
  },
  { timestamps: true }
);

// Indexes for efficient querying
FeatureRequestSchema.index({ status: 1, priority: 1 });
FeatureRequestSchema.index({ category: 1, status: 1 });
FeatureRequestSchema.index({ submittedBy: 1 });
FeatureRequestSchema.index({ assignedTo: 1 });
FeatureRequestSchema.index({ userRole: 1 });
FeatureRequestSchema.index({ createdAt: -1 });
FeatureRequestSchema.index({ votes: -1 });

// Text search index
FeatureRequestSchema.index({ 
  title: 'text', 
  description: 'text', 
  tags: 'text' 
});

export const FeatureRequest = models.FeatureRequest || model<IFeatureRequest>("FeatureRequest", FeatureRequestSchema); 