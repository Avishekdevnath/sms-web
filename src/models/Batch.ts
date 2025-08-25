import { Schema, model, models } from "mongoose";

export interface IBatch {
  _id: string;
  title: string;
  code: string;
  createdAt: Date;
  updatedAt: Date;
}

const BatchSchema = new Schema<IBatch>(
  {
    title: { type: String, required: true },
    code: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

// Removed duplicate schema-level index to avoid duplicate index warning
// BatchSchema.index({ code: 1 }, { unique: true });

export const Batch = models.Batch || model<IBatch>("Batch", BatchSchema); 