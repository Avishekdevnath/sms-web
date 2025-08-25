import mongoose, { Schema, Document } from 'mongoose';

export interface IEnrollmentBatch extends Document {
  title: string;
  code: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  maxStudents: number;
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
  createdAt: Date;
  updatedAt: Date;
}

const EnrollmentBatchSchema = new Schema<IEnrollmentBatch>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 20
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  maxStudents: {
    type: Number,
    required: true,
    min: 1,
    max: 10000
  },
  status: {
    type: String,
    enum: ['DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED'],
    default: 'DRAFT'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
EnrollmentBatchSchema.index({ code: 1 });
EnrollmentBatchSchema.index({ status: 1 });
EnrollmentBatchSchema.index({ startDate: 1, endDate: 1 });
EnrollmentBatchSchema.index({ createdAt: -1 });

export const EnrollmentBatch = mongoose.models.EnrollmentBatch || mongoose.model<IEnrollmentBatch>('EnrollmentBatch', EnrollmentBatchSchema);
