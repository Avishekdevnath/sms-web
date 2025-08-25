import { Schema, model, models, Types } from "mongoose";

export interface IAssignmentAttachment {
  name: string;
  url: string;
}

export interface IAssignment {
  _id: string;
  courseOfferingId: Types.ObjectId;
  title: string;
  description?: string;
  dueAt?: Date;
  publishedAt?: Date | null;
  createdBy: Types.ObjectId;
  maxPoints?: number;
  attachments?: IAssignmentAttachment[];
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
  },
  { timestamps: true }
);

AssignmentSchema.index({ courseOfferingId: 1, dueAt: 1 });
AssignmentSchema.index({ courseOfferingId: 1 });
AssignmentSchema.index({ dueAt: 1 });
AssignmentSchema.index({ publishedAt: 1 });
AssignmentSchema.index({ createdBy: 1 });

export const Assignment = models.Assignment || model<IAssignment>("Assignment", AssignmentSchema); 