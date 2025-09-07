import { Schema, model, models, Types } from "mongoose";
import type { Model } from "mongoose";

export interface IGroupTransferLog {
  _id: Types.ObjectId;
  missionId: Types.ObjectId;
  fromGroupId?: Types.ObjectId | null;
  toGroupId: Types.ObjectId;
  studentId: Types.ObjectId;
  actorId: Types.ObjectId;
  reason?: string;
  createdAt: Date;
}

const GroupTransferLogSchema = new Schema<IGroupTransferLog>(
  {
    missionId: { type: Schema.Types.ObjectId, ref: "MissionV2", required: true },
    fromGroupId: { type: Schema.Types.ObjectId, ref: "MentorshipGroupV2", default: null },
    toGroupId: { type: Schema.Types.ObjectId, ref: "MentorshipGroupV2", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

GroupTransferLogSchema.index({ studentId: 1, createdAt: -1 });
GroupTransferLogSchema.index({ missionId: 1, createdAt: -1 });

export const GroupTransferLog: Model<IGroupTransferLog> =
  (models.GroupTransferLog as Model<IGroupTransferLog>) ||
  model<IGroupTransferLog>("GroupTransferLog", GroupTransferLogSchema);


