import { Schema, model, models } from "mongoose";

export interface ICourse {
  _id: string;
  title: string;
  code: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    description: String,
  },
  { timestamps: true }
);

export const Course = models.Course || model<ICourse>("Course", CourseSchema); 