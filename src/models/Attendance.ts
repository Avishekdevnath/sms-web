import { Schema, model, models, Types } from "mongoose";

export interface IAttendance {
  _id: string;
  studentId: Types.ObjectId;
  missionId: Types.ObjectId;
  date: Date;
  status: "present" | "absent";
  points?: number;
  type: "daily" | "meeting";
  createdAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>({
  studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  missionId: { type: Schema.Types.ObjectId, ref: "Mission", required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ["present", "absent"], required: true },
  points: { type: Number, default: 0 },
  type: { type: String, enum: ["daily", "meeting"], required: true },
  createdAt: { type: Date, default: () => new Date() },
});

AttendanceSchema.index({ studentId: 1, missionId: 1, date: -1 });

export const Attendance = models.Attendance || model<IAttendance>("Attendance", AttendanceSchema); 