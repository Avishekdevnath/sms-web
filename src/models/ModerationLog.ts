import { Schema, model, models, Types } from "mongoose";

export type ModerationAction = "status.change" | "post.pin" | "post.unpin";

export interface IModerationLog {
  _id: string;
  targetType: "post" | "comment";
  targetId: Types.ObjectId;
  action: ModerationAction;
  data?: any; // e.g., { from, to, reason }
  actorId: Types.ObjectId; // ref: User
  createdAt: Date;
}

const ModerationLogSchema = new Schema<IModerationLog>(
  {
    targetType: { type: String, enum: ["post", "comment"], required: true },
    targetId: { type: Schema.Types.ObjectId, required: true },
    action: { type: String, enum: ["status.change", "post.pin", "post.unpin"], required: true },
    data: { type: Schema.Types.Mixed },
    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ModerationLogSchema.index({ targetId: 1, createdAt: -1 });

export const ModerationLog = models.ModerationLog || model<IModerationLog>("ModerationLog", ModerationLogSchema);


