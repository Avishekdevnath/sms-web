import { Schema, model, models, Types } from "mongoose";

export type EnrollmentStatus = "pending" | "approved" | "invited" | "activated" | "rejected" | "removed";

export interface IStudentEnrollment {
  _id: string;
  batchId: Types.ObjectId;
  email: string;
  status: EnrollmentStatus;
  enrolledBy: Types.ObjectId; // Reference to User who enrolled
  enrolledAt: Date;
  
  // Invitation tracking
  invitationSentAt?: Date;
  invitationToken?: string;
  invitationExpiresAt?: Date;
  invitationStatus?: "pending" | "sent" | "expired" | "cancelled";
  
  // Email tracking
  invitationEmailSent?: boolean;
  invitationEmailId?: string;
  invitationEmailError?: string;
  
  // Activation tracking
  activatedAt?: Date;
  activatedBy?: Types.ObjectId; // Reference to User (usually the student themselves)
  userId?: Types.ObjectId; // Reference to User after activation
  
  // Rejection tracking
  rejectedAt?: Date;
  rejectedBy?: Types.ObjectId;
  rejectionReason?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const StudentEnrollmentSchema = new Schema<IStudentEnrollment>(
  {
    batchId: { type: Schema.Types.ObjectId, ref: "Batch", required: true },
    email: { type: String, required: true, lowercase: true },
    status: { 
      type: String, 
      enum: ["pending", "approved", "invited", "activated", "rejected", "removed"], 
      default: "pending" 
    },
    enrolledBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    enrolledAt: { type: Date, default: Date.now },
    
    // Invitation tracking
    invitationSentAt: { type: Date },
    invitationToken: { type: String },
    invitationExpiresAt: { type: Date },
    invitationStatus: { 
      type: String, 
      enum: ["pending", "sent", "expired", "cancelled"],
      default: "pending"
    },
    
    // Email tracking
    invitationEmailSent: { type: Boolean, default: false },
    invitationEmailId: { type: String },
    invitationEmailError: { type: String },
    
    // Activation tracking
    activatedAt: { type: Date },
    activatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    
    // Rejection tracking
    rejectedAt: { type: Date },
    rejectedBy: { type: Schema.Types.ObjectId, ref: "User" },
    rejectionReason: { type: String }
  },
  { timestamps: true }
);

// Indexes for efficient querying
StudentEnrollmentSchema.index({ batchId: 1, email: 1 }, { unique: true });
StudentEnrollmentSchema.index({ batchId: 1 });
StudentEnrollmentSchema.index({ email: 1 });
StudentEnrollmentSchema.index({ status: 1 });
StudentEnrollmentSchema.index({ enrolledBy: 1 });
StudentEnrollmentSchema.index({ enrolledAt: 1 });
StudentEnrollmentSchema.index({ invitationStatus: 1 });
StudentEnrollmentSchema.index({ invitationExpiresAt: 1 });
StudentEnrollmentSchema.index({ invitationEmailSent: 1 });
StudentEnrollmentSchema.index({ activatedAt: 1 });
StudentEnrollmentSchema.index({ userId: 1 });

// Virtual for checking if invitation is expired
StudentEnrollmentSchema.virtual('isInvitationExpired').get(function(this: any) {
  if (!this.invitationExpiresAt) return false;
  return new Date() > this.invitationExpiresAt;
});

// Virtual for checking if can be invited
StudentEnrollmentSchema.virtual('canBeInvited').get(function(this: any) {
  const isExpired = this.invitationExpiresAt ? new Date() > this.invitationExpiresAt : false;
  return this.status === 'pending' && 
         this.invitationStatus !== 'sent' && 
         !isExpired;
});

export const StudentEnrollment = models.StudentEnrollment || model<IStudentEnrollment>("StudentEnrollment", StudentEnrollmentSchema); 