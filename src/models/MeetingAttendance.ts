import mongoose, { Schema, models, model } from "mongoose";

export interface IMeetingAttendance {
  _id: string;
  meetingId: mongoose.Types.ObjectId; // Reference to MentorMeeting
  missionId: mongoose.Types.ObjectId; // Reference to Mission
  mentorId: mongoose.Types.ObjectId;  // Reference to User (mentor)
  studentId: mongoose.Types.ObjectId; // Reference to User (student)
  status: 'attended' | 'absent' | 'late' | 'excused' | 'pending';
  joinTime?: Date; // When student joined the meeting
  leaveTime?: Date; // When student left the meeting
  duration?: number; // Duration in minutes
  notes?: string; // Mentor notes about attendance
  excusedReason?: string; // Reason if excused
  createdAt?: Date;
  updatedAt?: Date;
}

const MeetingAttendanceSchema = new Schema<IMeetingAttendance>(
  {
    meetingId: {
      type: Schema.Types.ObjectId,
      ref: "MentorMeeting",
      required: true
    },
    missionId: {
      type: Schema.Types.ObjectId,
      ref: "Mission",
      required: true
    },
    mentorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    status: {
      type: String,
      enum: ['attended', 'absent', 'late', 'excused', 'pending'],
      required: true,
      default: 'pending'
    },
    joinTime: {
      type: Date,
      required: false
    },
    leaveTime: {
      type: Date,
      required: false
    },
    duration: {
      type: Number,
      required: false,
      min: 0
    },
    notes: {
      type: String,
      required: false,
      maxlength: 500
    },
    excusedReason: {
      type: String,
      required: false,
      maxlength: 200
    }
  },
  { timestamps: true }
);

// Indexes for efficient queries
MeetingAttendanceSchema.index({ meetingId: 1, studentId: 1 }, { unique: true });
MeetingAttendanceSchema.index({ missionId: 1, mentorId: 1 });
MeetingAttendanceSchema.index({ studentId: 1, status: 1 });
MeetingAttendanceSchema.index({ meetingId: 1, status: 1 });
MeetingAttendanceSchema.index({ createdAt: 1 });

// Virtual for attendance duration
MeetingAttendanceSchema.virtual('attendanceDuration').get(function() {
  if (this.joinTime && this.leaveTime) {
    return Math.round((this.leaveTime.getTime() - this.joinTime.getTime()) / (1000 * 60));
  }
  return this.duration || 0;
});

// Pre-save middleware to calculate duration
MeetingAttendanceSchema.pre('save', function(next) {
  if (this.joinTime && this.leaveTime) {
    this.duration = Math.round((this.leaveTime.getTime() - this.joinTime.getTime()) / (1000 * 60));
  }
  next();
});

// Static method to get attendance statistics
MeetingAttendanceSchema.statics.getAttendanceStats = async function(missionId: string, timeRange?: number) {
  const query: any = { missionId };
  
  if (timeRange) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeRange);
    query.createdAt = { $gte: startDate };
  }

  const stats = await this.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const result: any = {
    total: 0,
    attended: 0,
    absent: 0,
    late: 0,
    excused: 0,
    pending: 0
  };

  stats.forEach(stat => {
    result[stat._id] = stat.count;
    result.total += stat.count;
  });

  result.attendanceRate = result.total > 0 ? 
    Math.round(((result.attended + result.late) / result.total) * 100) : 0;

  return result;
};

// Static method to get student attendance history
MeetingAttendanceSchema.statics.getStudentAttendanceHistory = async function(
  studentId: string, 
  missionId: string,
  limit: number = 10
) {
  return this.find({ studentId, missionId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('meetingId', 'title scheduledAt duration')
    .populate('mentorId', 'name')
    .lean();
};

// Static method to get mentor attendance summary
MeetingAttendanceSchema.statics.getMentorAttendanceSummary = async function(
  mentorId: string,
  missionId: string,
  timeRange: number = 30
) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - timeRange);

  const summary = await this.aggregate([
    {
      $match: {
        mentorId: new mongoose.Types.ObjectId(mentorId),
        missionId: new mongoose.Types.ObjectId(missionId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalDuration: { $sum: '$duration' }
      }
    }
  ]);

  const result: any = {
    totalMeetings: 0,
    totalStudents: 0,
    averageAttendance: 0,
    totalDuration: 0
  };

  summary.forEach(stat => {
    result.totalStudents += stat.count;
    if (stat._id === 'attended' || stat._id === 'late') {
      result.totalMeetings += stat.count;
    }
    result.totalDuration += stat.totalDuration || 0;
  });

  result.averageAttendance = result.totalStudents > 0 ? 
    Math.round((result.totalMeetings / result.totalStudents) * 100) : 0;

  return result;
};

export const MeetingAttendance = models.MeetingAttendance || model<IMeetingAttendance>("MeetingAttendance", MeetingAttendanceSchema);
