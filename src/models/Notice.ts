import { Schema, model, models, Types } from "mongoose";

export interface INotice {
  _id: string;
  title: string;
  content: string;
  batchId?: Types.ObjectId | null;
  missionId?: Types.ObjectId | null;
  createdBy: Types.ObjectId;
  acknowledgments?: Types.ObjectId[];
  createdAt: Date;
}

const NoticeSchema = new Schema<INotice>({
  title: { type: String, required: true },
  content: { type: String, required: true },
  batchId: { type: Schema.Types.ObjectId, ref: "Batch", default: null },
  missionId: { type: Schema.Types.ObjectId, ref: "Mission", default: null },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  acknowledgments: [{ type: Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: () => new Date() },
});

NoticeSchema.index({ batchId: 1 });
NoticeSchema.index({ missionId: 1 });

export const Notice = models.Notice || model<INotice>("Notice", NoticeSchema); 