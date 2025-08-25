import { Schema, model, models, Types } from "mongoose";

export interface ICallLog {
  _id: string;
  sreId: Types.ObjectId;
  studentId: Types.ObjectId;
  outcome: "picked" | "no_answer" | "reschedule";
  remarks?: string;
  createdAt: Date;
}

const CallLogSchema = new Schema<ICallLog>({
  sreId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  outcome: { type: String, enum: ["picked", "no_answer", "reschedule"], required: true },
  remarks: String,
  createdAt: { type: Date, default: () => new Date() },
});

CallLogSchema.index({ sreId: 1, createdAt: -1 });
CallLogSchema.index({ studentId: 1, createdAt: -1 });

export const CallLog = models.CallLog || model<ICallLog>("CallLog", CallLogSchema); 