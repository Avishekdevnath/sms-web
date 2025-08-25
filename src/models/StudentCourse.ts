import { Schema, model, models, Types } from "mongoose";

export interface IStudentCourse {
  _id: string;
  studentId: Types.ObjectId;
  courseId: Types.ObjectId;
  mentorId?: Types.ObjectId | null;
}

const StudentCourseSchema = new Schema<IStudentCourse>({
  studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
  mentorId: { type: Schema.Types.ObjectId, ref: "User", default: null },
});

StudentCourseSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

export const StudentCourse = models.StudentCourse || model<IStudentCourse>("StudentCourse", StudentCourseSchema); 