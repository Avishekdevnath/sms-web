import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAttendanceLogV2 extends Document {
  missionId: Types.ObjectId;
  studentId: Types.ObjectId;
  mentorshipGroupId?: Types.ObjectId;
  date: Date; // normalized to 00:00 UTC
  status: 'present' | 'absent' | 'excused';
  source: 'student' | 'mentor' | 'admin' | 'system';
  notes?: string;
  markedBy?: Types.ObjectId;
  answers?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceLogV2Schema = new Schema<IAttendanceLogV2>({
  missionId: { type: Schema.Types.ObjectId, ref: 'Mission', required: true },
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  mentorshipGroupId: { type: Schema.Types.ObjectId, ref: 'MentorshipGroupV2' },
  date: { type: Date, required: true },
  status: { type: String, enum: ['present', 'absent', 'excused'], required: true },
  source: { type: String, enum: ['student', 'mentor', 'admin', 'system'], required: true },
  notes: { type: String, trim: true },
  markedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  answers: { type: Schema.Types.Mixed }
}, {
  timestamps: true,
  collection: 'attendance_logs_v2'
});

attendanceLogV2Schema.index({ missionId: 1, studentId: 1, date: 1 }, { unique: true });
attendanceLogV2Schema.index({ missionId: 1, mentorshipGroupId: 1, date: 1 });
attendanceLogV2Schema.index({ studentId: 1, date: 1 });

// Normalize date to 00:00 UTC before save
attendanceLogV2Schema.pre('save', function(next) {
  if (this.date) {
    const d = new Date(this.date);
    d.setUTCHours(0, 0, 0, 0);
    this.date = d;
  }
  next();
});

if (mongoose.models.AttendanceLogV2) {
  delete mongoose.models.AttendanceLogV2;
}
const AttendanceLogV2 = mongoose.model<IAttendanceLogV2>('AttendanceLogV2', attendanceLogV2Schema);

export default AttendanceLogV2;


