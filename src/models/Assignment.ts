import { Schema, model, models, Types } from "mongoose";

export interface IAssignmentAttachment {
  name: string;
  url: string;
}

export interface ICompletedEmail {
  email: string;
  studentId?: Types.ObjectId; // Optional, populated if student exists in system
  addedAt: Date;
  addedBy: Types.ObjectId; // SRE/Admin/Manager who added the email
}

export interface IEmailSubmission {
  submittedBy: Types.ObjectId;
  submittedAt: Date;
  emailList: string[];
  processedCount: number;
  successCount: number;
  errorCount: number;
  status: 'completed' | 'failed' | 'partial';
}

export interface IAssignment {
  _id: string;
  courseOfferingId: Types.ObjectId;
  title: string;
  description?: string;
  dueAt?: Date;
  publishedAt?: Date | null; // Only published assignments can receive email submissions
  createdBy: Types.ObjectId;
  maxPoints?: number;
  attachments?: IAssignmentAttachment[];
  
  // New fields for email tracking
  completedEmails: ICompletedEmail[];
  
  // Submission tracking
  emailSubmissions: IEmailSubmission[];
  
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSchema = new Schema<IAssignment>(
  {
    courseOfferingId: { type: Schema.Types.ObjectId, ref: "CourseOffering", required: true },
    title: { type: String, required: true },
    description: String,
    dueAt: { type: Date },
    publishedAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    maxPoints: { type: Number, default: 100 },
    attachments: [{ name: String, url: String }],
    
    // New fields for email tracking
    completedEmails: [{
      email: { type: String, required: true },
      studentId: { type: Schema.Types.ObjectId, ref: "User" },
      addedAt: { type: Date, default: Date.now },
      addedBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
    }],
    
    // Submission tracking
    emailSubmissions: [{
      submittedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
      submittedAt: { type: Date, default: Date.now },
      emailList: [{ type: String }],
      processedCount: { type: Number, default: 0 },
      successCount: { type: Number, default: 0 },
      errorCount: { type: Number, default: 0 },
      status: { type: String, enum: ['completed', 'failed', 'partial'], default: 'completed' }
    }]
  },
  { timestamps: true }
);

AssignmentSchema.index({ courseOfferingId: 1, dueAt: 1 });
AssignmentSchema.index({ courseOfferingId: 1 });
AssignmentSchema.index({ dueAt: 1 });
AssignmentSchema.index({ publishedAt: 1 });
AssignmentSchema.index({ createdBy: 1 });

// New indexes for email tracking
AssignmentSchema.index({ "completedEmails.email": 1 });
AssignmentSchema.index({ "completedEmails.studentId": 1 });
AssignmentSchema.index({ "emailSubmissions.submittedBy": 1 });
AssignmentSchema.index({ "emailSubmissions.submittedAt": 1 });

export const Assignment = models.Assignment || model<IAssignment>("Assignment", AssignmentSchema); 