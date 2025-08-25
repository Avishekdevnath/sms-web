import { Schema, model, models, Types } from "mongoose";

export interface ISemester {
  _id: string;
  batchId: Types.ObjectId;
  number: 1 | 2 | 3;
  title?: string;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SemesterSchema = new Schema<ISemester>(
  {
    batchId: { type: Schema.Types.ObjectId, ref: "Batch", required: true },
    number: { type: Number, enum: [1, 2, 3], required: true },
    title: String,
    startDate: Date,
    endDate: Date,
  },
  { timestamps: true }
);

SemesterSchema.index({ batchId: 1, number: 1 }, { unique: true });
SemesterSchema.index({ batchId: 1 });
SemesterSchema.index({ number: 1 });

export const Semester = models.Semester || model<ISemester>("Semester", SemesterSchema); 