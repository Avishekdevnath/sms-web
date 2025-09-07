import { Schema, model, models, Types } from "mongoose";

export type TemplateScope = 'mission' | 'group' | 'global';

export interface ITemplate {
  _id: string;
  key: string; // e.g., announcement.general
  scope: TemplateScope;
  subject: string;
  body: string; // markdown
  variables: string[];
  version: number;
  isDefault: boolean;
  createdBy: Types.ObjectId; // ref: User
  createdAt: Date;
  updatedAt: Date;
}

const TemplateSchema = new Schema<ITemplate>(
  {
    key: { type: String, required: true },
    scope: { type: String, enum: ['mission','group','global'], required: true },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    variables: [{ type: String }],
    version: { type: Number, default: 1 },
    isDefault: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

TemplateSchema.index({ key: 1, scope: 1, version: -1 });
TemplateSchema.index({ isDefault: 1 });

export const Template = models.Template || model<ITemplate>('Template', TemplateSchema);


