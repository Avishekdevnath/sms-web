import { Schema, model, models, Types } from "mongoose";
import type { Model } from "mongoose";

export interface IMessageAttachment {
  url: string;
  name: string;
  type: string;
  size?: number;
}

export interface IMessageReaction {
  reaction: "ok" | "love" | "cry" | "haha" | "bulb";
  userId: Types.ObjectId;
  createdAt: Date;
}

export interface IReadReceipt {
  userId: Types.ObjectId;
  readAt: Date;
}

export interface IMessage {
  _id: Types.ObjectId;
  channelId: Types.ObjectId; // ref: Channel
  senderId: Types.ObjectId; // ref: User
  body: string; // markdown
  attachments?: IMessageAttachment[];
  mentions?: Types.ObjectId[];
  reactions?: IMessageReaction[];
  threadId?: Types.ObjectId; // ref: Message
  readReceipts?: IReadReceipt[];
  createdAt: Date;
  editedAt?: Date;
  deletedAt?: Date | null;
}

const MessageSchema = new Schema<IMessage>(
  {
    channelId: { type: Schema.Types.ObjectId, ref: "Channel", required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true },
    attachments: [{ url: String, name: String, type: String, size: Number }],
    mentions: [{ type: Schema.Types.ObjectId, ref: "User" }],
    reactions: [{
      reaction: { type: String, enum: ["ok", "love", "cry", "haha", "bulb"] },
      userId: { type: Schema.Types.ObjectId, ref: "User" },
      createdAt: { type: Date, default: Date.now }
    }],
    threadId: { type: Schema.Types.ObjectId, ref: "Message" },
    readReceipts: [{ userId: { type: Schema.Types.ObjectId, ref: "User" }, readAt: Date }],
    editedAt: { type: Date },
    deletedAt: { type: Date, default: null }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

MessageSchema.index({ channelId: 1, createdAt: 1 });
MessageSchema.index({ threadId: 1 });

export const Message: Model<IMessage> =
  (models.Message as Model<IMessage>) || model<IMessage>("Message", MessageSchema);


