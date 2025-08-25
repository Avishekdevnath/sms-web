import { Schema, models, model, Types } from "mongoose";

export type InvitationStatus = "pending" | "sent" | "accepted" | "expired" | "cancelled";

export interface IInvitation {
  _id: string;
  email: string;
  studentId?: string; // Reference to StudentEnrollment if exists
  invitationToken: string;
  invitationExpiresAt: Date;
  status: InvitationStatus;
  sentAt?: Date;
  acceptedAt?: Date;
  cancelledAt?: Date;
  cancelledBy?: Types.ObjectId;
  
  // Temporary credentials for student login
  temporaryUsername?: string;
  temporaryPassword?: string;
  
  // Invitation details
  invitedBy: Types.ObjectId; // Reference to User who sent invitation
  batchId?: Types.ObjectId; // Reference to Batch if specified
  courseId?: Types.ObjectId; // Reference to Course if specified
  
  // Email tracking
  emailSent: boolean;
  emailSentAt?: Date;
  emailError?: string;
  
  // Resend tracking
  resendCount: number;
  lastResentAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const InvitationSchema = new Schema<IInvitation>(
  {
    email: { type: String, required: true, lowercase: true },
    studentId: { type: Schema.Types.ObjectId, ref: "StudentEnrollment" },
    invitationToken: { type: String, required: true, unique: true },
    invitationExpiresAt: { type: Date, required: true },
    status: { 
      type: String, 
      required: true, 
      enum: ["pending", "sent", "accepted", "expired", "cancelled"],
      default: "pending"
    },
    sentAt: { type: Date },
    acceptedAt: { type: Date },
    cancelledAt: { type: Date },
    cancelledBy: { type: Schema.Types.ObjectId, ref: "User" },
    
    // Temporary credentials
    temporaryUsername: { type: String },
    temporaryPassword: { type: String },
    
    // Invitation details
    invitedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    batchId: { type: Schema.Types.ObjectId, ref: "Batch" },
    courseId: { type: Schema.Types.ObjectId, ref: "Course" },
    
    // Email tracking
    emailSent: { type: Boolean, default: false },
    emailSentAt: { type: Date },
    emailError: { type: String },
    
    // Resend tracking
    resendCount: { type: Number, default: 0 },
    lastResentAt: { type: Date }
  },
  { timestamps: true }
);

// Indexes for efficient querying
InvitationSchema.index({ email: 1 });
InvitationSchema.index({ invitationToken: 1 }, { unique: true });
InvitationSchema.index({ status: 1 });
InvitationSchema.index({ invitationExpiresAt: 1 });
InvitationSchema.index({ invitedBy: 1 });
InvitationSchema.index({ studentId: 1 });
InvitationSchema.index({ batchId: 1 });
InvitationSchema.index({ createdAt: 1 });

// Virtual for checking if invitation is expired
InvitationSchema.virtual('isExpired').get(function() {
  return new Date() > this.invitationExpiresAt;
});

// Virtual for checking if invitation can be resent
InvitationSchema.virtual('canResend').get(function() {
  if (this.status === 'accepted' || this.status === 'cancelled') return false;
  if (this.resendCount >= 3) return false; // Max 3 resends
  return true;
});

export const Invitation = models.Invitation || model<IInvitation>("Invitation", InvitationSchema);
