import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAuditLog extends Document {
  actorId: Types.ObjectId;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: Types.ObjectId;
  beforeSnapshot?: any;
  afterSnapshot?: any;
  timestamp: Date;
  metadata?: Record<string, any>;
}

const AuditLogSchema = new Schema<IAuditLog>({
  actorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  actorRole: {
    type: String,
    required: true,
    trim: true
  },
  action: {
    type: String,
    required: true,
    trim: true
  },
  entityType: {
    type: String,
    required: true,
    trim: true
  },
  entityId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  beforeSnapshot: {
    type: Schema.Types.Mixed
  },
  afterSnapshot: {
    type: Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes for efficient querying and reporting
AuditLogSchema.index({ actorId: 1 });
AuditLogSchema.index({ entityType: 1, entityId: 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ actorRole: 1 });

export const AuditLog = mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
