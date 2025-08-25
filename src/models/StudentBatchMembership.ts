import { Schema, model, models, Types } from "mongoose";

export type MembershipStatus = "pending" | "approved" | "removed";

export interface IStudentBatchMembership {
  _id: string;
  studentId: Types.ObjectId;
  batchId: Types.ObjectId;
  status: MembershipStatus;
  joinedAt?: Date | null;
  leftAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const StudentBatchMembershipSchema = new Schema<IStudentBatchMembership>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    batchId: { type: Schema.Types.ObjectId, ref: "Batch", required: true },
    status: { type: String, enum: ["pending", "approved", "removed"], default: "pending" },
    joinedAt: { type: Date, default: null },
    leftAt: { type: Date, default: null },
  },
  { timestamps: true }
);

StudentBatchMembershipSchema.index({ studentId: 1, batchId: 1 }, { unique: true });
StudentBatchMembershipSchema.index({ studentId: 1 });
StudentBatchMembershipSchema.index({ batchId: 1 });
StudentBatchMembershipSchema.index({ status: 1 });

export const StudentBatchMembership =
  models.StudentBatchMembership || model<IStudentBatchMembership>("StudentBatchMembership", StudentBatchMembershipSchema); 