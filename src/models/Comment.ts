import { Schema, model, models, Types } from "mongoose";

export interface ICommentAttachment {
  url: string;
  name: string;
  type: string;
  size?: number;
}

export interface ICommentReaction {
  reaction: "ok" | "love" | "cry" | "haha" | "bulb";
  userId: Types.ObjectId;
  createdAt: Date;
}

export interface IComment {
  _id: string;
  postId: Types.ObjectId; // ref: Post
  parentId?: Types.ObjectId | null; // ref: Comment
  authorId: Types.ObjectId; // ref: User
  body: string; // markdown
  attachments?: ICommentAttachment[];
  reactions?: ICommentReaction[];
  createdAt: Date;
  editedAt?: Date;
  deletedAt?: Date | null;
}

const CommentSchema = new Schema<IComment>(
  {
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    parentId: { type: Schema.Types.ObjectId, ref: "Comment", default: null },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true },
    attachments: [{ url: String, name: String, type: String, size: Number }],
    reactions: [{
      reaction: { type: String, enum: ["ok", "love", "cry", "haha", "bulb"] },
      userId: { type: Schema.Types.ObjectId, ref: "User" },
      createdAt: { type: Date, default: Date.now }
    }],
    editedAt: { type: Date },
    deletedAt: { type: Date, default: null }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

CommentSchema.index({ postId: 1, parentId: 1, createdAt: 1 });

export const Comment = models.Comment || model<IComment>("Comment", CommentSchema);


