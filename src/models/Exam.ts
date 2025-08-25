import { Schema, model, models, Types } from "mongoose";

export type ExamType = "mid" | "final" | "quiz" | "lab" | "other";

export interface IExam {
  _id: string;
  courseOfferingId: Types.ObjectId;
  type: ExamType;
  title: string;
  totalMarks: number;
  scheduledAt?: Date;
  durationMinutes?: number;
  publishedAt?: Date | null;
  createdBy: Types.ObjectId;
  instructions?: string;
  location?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExamSchema = new Schema<IExam>(
  {
    courseOfferingId: { type: Schema.Types.ObjectId, ref: "CourseOffering", required: true },
    type: { type: String, enum: ["mid", "final", "quiz", "lab", "other"], required: true },
    title: { type: String, required: true },
    totalMarks: { type: Number, required: true },
    scheduledAt: { type: Date },
    durationMinutes: Number,
    publishedAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    instructions: String,
    location: String,
  },
  { timestamps: true }
);

ExamSchema.index({ courseOfferingId: 1, scheduledAt: 1 });
ExamSchema.index({ courseOfferingId: 1 });
ExamSchema.index({ type: 1 });
ExamSchema.index({ scheduledAt: 1 });
ExamSchema.index({ publishedAt: 1 });
ExamSchema.index({ createdBy: 1 });

export const Exam = models.Exam || model<IExam>("Exam", ExamSchema); 