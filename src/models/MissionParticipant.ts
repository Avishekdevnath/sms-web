import { Schema, model, models, Types } from "mongoose";

export type ParticipantStatus = "active" | "inactive" | "suspended";

export interface IMissionParticipant {
  _id: string;
  missionId: Types.ObjectId;
  studentId: Types.ObjectId;
  status: ParticipantStatus;
  reason?: string;
  updatedBy: Types.ObjectId;
  updatedAt: Date;
}

const MissionParticipantSchema = new Schema<IMissionParticipant>({
  missionId: { type: Schema.Types.ObjectId, ref: "Mission", required: true },
  studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["active", "inactive", "suspended"], default: "active" },
  reason: String,
  updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  updatedAt: { type: Date, default: () => new Date() },
});

MissionParticipantSchema.index({ missionId: 1, studentId: 1 }, { unique: true });
MissionParticipantSchema.index({ missionId: 1 });
MissionParticipantSchema.index({ studentId: 1 });
MissionParticipantSchema.index({ status: 1 });

export const MissionParticipant =
  models.MissionParticipant || model<IMissionParticipant>("MissionParticipant", MissionParticipantSchema); 