import { Schema, model, models, Types } from "mongoose";
import type { Model } from "mongoose";

export interface IChannel {
  _id: Types.ObjectId;
  missionId: Types.ObjectId; // ref: MissionV2
  groupId?: Types.ObjectId; // ref: MentorshipGroupV2
  type: "mentor-messaging" | "group-discussion";
  visibility: "non-student" | "group";
  allowedRoles: string[]; // derived from type by default
  lastMessageAt?: Date;
  createdBy: Types.ObjectId; // ref: User
  createdAt: Date;
  updatedAt: Date;
}

const ChannelSchema = new Schema<IChannel>(
  {
    missionId: { type: Schema.Types.ObjectId, ref: "MissionV2", required: true },
    groupId: { type: Schema.Types.ObjectId, ref: "MentorshipGroupV2" },
    type: { type: String, enum: ["mentor-messaging", "group-discussion"], required: true },
    visibility: { type: String, enum: ["non-student", "group"], required: true },
    allowedRoles: [{ type: String }],
    lastMessageAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

ChannelSchema.index({ missionId: 1, groupId: 1, type: 1 });
ChannelSchema.index({ lastMessageAt: -1 });

export const Channel: Model<IChannel> =
  (models.Channel as Model<IChannel>) || model<IChannel>("Channel", ChannelSchema);


