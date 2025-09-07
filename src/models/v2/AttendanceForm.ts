import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAttendanceFormQuestionV2 {
  key: string; // unique per form
  label: string;
  type: 'text' | 'textarea' | 'single-select' | 'multi-select' | 'boolean' | 'number' | 'email' | 'date' | 'time' | 'datetime' | 'url' | 'phone' | 'file' | 'rating' | 'scale' | 'paragraph';
  required: boolean;
  description?: string; // help text
  placeholder?: string;
  options?: string[]; // for select types
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string; // regex
    customMessage?: string;
  };
  conditional?: {
    dependsOn: string; // question key
    condition: 'equals' | 'not_equals' | 'contains' | 'not_contains';
    value: any;
  };
  order: number; // for drag-drop ordering
}

export interface IAttendanceFormV2 extends Document {
  missionId: Types.ObjectId;
  title: string;
  active: boolean;
  questions: IAttendanceFormQuestionV2[];
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceFormV2Schema = new Schema<IAttendanceFormV2>({
  missionId: { type: Schema.Types.ObjectId, ref: 'Mission', required: true },
  title: { type: String, required: true, trim: true },
  active: { type: Boolean, default: true },
  questions: [{
    key: { type: String, required: true },
    label: { type: String, required: true },
    type: { type: String, enum: ['text', 'textarea', 'single-select', 'multi-select', 'boolean', 'number', 'email', 'date', 'time', 'datetime', 'url', 'phone', 'file', 'rating', 'scale', 'paragraph'], required: true },
    required: { type: Boolean, default: false },
    description: { type: String },
    placeholder: { type: String },
    options: [{ type: String }],
    validation: {
      min: { type: Number },
      max: { type: Number },
      minLength: { type: Number },
      maxLength: { type: Number },
      pattern: { type: String },
      customMessage: { type: String }
    },
    conditional: {
      dependsOn: { type: String },
      condition: { type: String, enum: ['equals', 'not_equals', 'contains', 'not_contains'] },
      value: { type: Schema.Types.Mixed }
    },
    order: { type: Number, required: true, default: 0 }
  }],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true,
  collection: 'attendance_forms_v2'
});

attendanceFormV2Schema.index({ missionId: 1, active: 1 });

// enforce unique question keys within a form at save-time
attendanceFormV2Schema.pre('save', function(next) {
  const keys = new Set<string>();
  for (const q of this.questions) {
    if (keys.has(q.key)) {
      return next(new Error('Duplicate question key in attendance form'));
    }
    keys.add(q.key);
  }
  next();
});

if (mongoose.models.AttendanceFormV2) {
  delete mongoose.models.AttendanceFormV2;
}
const AttendanceFormV2 = mongoose.model<IAttendanceFormV2>('AttendanceFormV2', attendanceFormV2Schema);

export default AttendanceFormV2;


