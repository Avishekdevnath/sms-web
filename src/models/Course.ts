import { Schema, model, models, Types } from "mongoose";

export interface ICourse {
  _id: string;
  title: string;
  code: string;
  description?: string;
  semesterId?: Types.ObjectId; // Link to semester (optional)
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    description: String,
    semesterId: { type: Schema.Types.ObjectId, ref: "Semester", required: false },
  },
  { timestamps: true }
);

// Index for efficient semester-based queries (only when semesterId exists)
CourseSchema.index({ semesterId: 1, code: 1 }, { unique: true, sparse: true });

export const Course = models.Course || model<ICourse>("Course", CourseSchema); 