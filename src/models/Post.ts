import { Schema, model, models, Types } from "mongoose";

export type PostCategory = "announcement" | "resource" | "guideline" | "coding";
export type AnnouncementType = "general" | "session" | "live-session" | "important";
export type PostStatus = "pending" | "investigating" | "resolved" | "approved" | "rejected";

export interface IPostAttachment {
  url: string;
  name: string;
  type: string;
  size?: number;
}

export interface IPost {
  _id: string;
  missionId: Types.ObjectId; // ref: MissionV2
  groupId?: Types.ObjectId; // ref: MentorshipGroupV2
  category: PostCategory;
  announcementType?: AnnouncementType;
  title: string;
  body: string;
  attachments?: IPostAttachment[];
  tags?: string[];
  status: PostStatus;
  pinned?: boolean;
  visibility: "mission" | "group";
  createdBy: Types.ObjectId; // ref: User
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<IPost>(
  {
    missionId: { type: Schema.Types.ObjectId, ref: "MissionV2", required: true },
    groupId: { type: Schema.Types.ObjectId, ref: "MentorshipGroupV2" },
    category: { type: String, enum: ["announcement", "resource", "guideline", "coding"], required: true },
    announcementType: { type: String, enum: ["general", "session", "live-session", "important"] },
    title: { type: String, required: true },
    body: { type: String, required: true },
    attachments: [{ url: String, name: String, type: String, size: Number }],
    tags: [{ type: String }],
    status: { type: String, enum: ["pending", "investigating", "resolved", "approved", "rejected"], default: "pending" },
    pinned: { type: Boolean, default: false },
    visibility: { type: String, enum: ["mission", "group"], required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

PostSchema.index({ missionId: 1, groupId: 1, category: 1, createdAt: -1 });
PostSchema.index({ status: 1 });
PostSchema.index({ createdBy: 1 });

export const Post = models.Post || model<IPost>("Post", PostSchema);


