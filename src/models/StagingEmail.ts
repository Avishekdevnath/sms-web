import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IStagingEmail extends Document {
  email: string;
  batchId: Types.ObjectId;
  status: 'PENDING_UPLOAD' | 'VALIDATED' | 'APPROVED' | 'REJECTED';
  validationErrors: string[];
  createdAt: Date;
  updatedAt: Date;
}

const StagingEmailSchema = new Schema<IStagingEmail>({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    maxlength: 255
  },
  batchId: {
    type: Schema.Types.ObjectId,
    ref: 'EnrollmentBatch',
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING_UPLOAD', 'VALIDATED', 'APPROVED', 'REJECTED'],
    default: 'PENDING_UPLOAD'
  },
  validationErrors: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Indexes for email uniqueness and batch filtering
StagingEmailSchema.index({ email: 1, batchId: 1 }, { unique: true });
StagingEmailSchema.index({ status: 1 });
StagingEmailSchema.index({ batchId: 1 });
StagingEmailSchema.index({ createdAt: -1 });

export const StagingEmail = mongoose.models.StagingEmail || mongoose.model<IStagingEmail>('StagingEmail', StagingEmailSchema);
