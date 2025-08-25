import { Schema, model, models, Types } from "mongoose";

export interface IStudentAssignmentSubmission {
  _id: string;
  assignmentId: Types.ObjectId;
  studentId: Types.ObjectId;
  submittedAt: Date;
  pointsAwarded?: number;
  fileUrl?: string;
  feedback?: string;
}

const StudentAssignmentSubmissionSchema = new Schema<IStudentAssignmentSubmission>({
  assignmentId: { type: Schema.Types.ObjectId, ref: "Assignment", required: true },
  studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  submittedAt: { type: Date, default: () => new Date() },
  pointsAwarded: Number,
  fileUrl: String,
  feedback: String,
});

StudentAssignmentSubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });
StudentAssignmentSubmissionSchema.index({ assignmentId: 1 });
StudentAssignmentSubmissionSchema.index({ studentId: 1 });
StudentAssignmentSubmissionSchema.index({ submittedAt: 1 });

export const StudentAssignmentSubmission =
  models.StudentAssignmentSubmission || model<IStudentAssignmentSubmission>("StudentAssignmentSubmission", StudentAssignmentSubmissionSchema); 