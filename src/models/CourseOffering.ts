import { Schema, model, models, Types } from "mongoose";

export interface ICourseOffering {
  _id: string;
  courseId: Types.ObjectId;
  batchId: Types.ObjectId;
  semesterId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CourseOfferingSchema = new Schema<ICourseOffering>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    batchId: { type: Schema.Types.ObjectId, ref: "Batch", required: true },
    semesterId: { type: Schema.Types.ObjectId, ref: "Semester", required: true },
  },
  { timestamps: true }
);

CourseOfferingSchema.index({ batchId: 1, semesterId: 1, courseId: 1 }, { unique: true });
CourseOfferingSchema.index({ batchId: 1 });
CourseOfferingSchema.index({ semesterId: 1 });
CourseOfferingSchema.index({ courseId: 1 });

export const CourseOffering = models.CourseOffering || model<ICourseOffering>("CourseOffering", CourseOfferingSchema); 