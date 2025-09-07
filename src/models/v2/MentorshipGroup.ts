import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMentorshipGroupV2 extends Document {
  name: string;                      // "Group Alpha" or "React Masters"
  description?: string;              // Group description
  missionId: Types.ObjectId;         // Reference to MissionV2
  batchId: Types.ObjectId;           // Reference to Batch
  
  // ✅ GROUP IS FORMED FROM EXISTING MISSION PARTICIPANTS
  // Students must already be in MissionStudent collection
  // Mentors must already be in MissionMentor collection
  
  // Student Assignment (from MissionStudent)
  students: Types.ObjectId[];        // Students from MissionStudent collection
  maxStudents: number;               // Maximum group size
  currentStudents: number;           // Current number of students
  
  // Mentor Assignment (from MissionMentor)
  primaryMentorId?: Types.ObjectId;  // Primary mentor from MissionMentor collection
  mentors: Types.ObjectId[];         // All mentors from MissionMentor collection
  
  // Group Status
  status: 'active' | 'inactive' | 'full' | 'recruiting';
  
  // Group Configuration
  groupType: 'study' | 'project' | 'mentorship' | 'collaborative';
  focusArea?: string[];              // Optional: e.g., ['frontend', 'react', 'state-management']
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'mixed';
  
  // Metadata
  createdBy: Types.ObjectId;         // User who created the group
  updatedBy?: Types.ObjectId;        // User who last updated the group
  
  // Meeting Schedule
  meetingSchedule: {
    frequency: 'weekly' | 'biweekly' | 'monthly' | 'on-demand';
    dayOfWeek?: number;              // 0-6 (Sunday-Saturday)
    time?: string;                   // "14:00"
    duration: number;                // Duration in minutes
    timezone: string;                // "Asia/Dhaka"
  };
  
  // Group Progress
  groupProgress: {
    overallProgress: number;          // Average of all students (0-100)
    lastMeetingDate?: Date;
    nextMeetingDate?: Date;
    totalMeetings: number;
    activeStudents: number;
  };
  
  // Communication
  communicationChannel?: {
    type: 'discord' | 'slack' | 'telegram' | 'whatsapp';
    channelId?: string;
    inviteLink?: string;
  };
  
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  updateNextMeetingDate(): void;
  recordMeeting(): Promise<this>;
  updateOverallProgress(): Promise<this>;
  setCommunicationChannel(channel: string): Promise<this>;
}

const mentorshipGroupV2Schema = new Schema<IMentorshipGroupV2>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  missionId: {
    type: Schema.Types.ObjectId,
    ref: 'MissionV2',
    required: true
  },
  batchId: {
    type: Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  
  // ✅ STUDENT ASSIGNMENT (from MissionStudent)
  students: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Max students: 0 means unlimited
  maxStudents: {
    type: Number,
    min: 0,
    default: 0
  },
  currentStudents: {
    type: Number,
    min: 0,
    default: 0
  },
  
  // ✅ MENTOR ASSIGNMENT (from MissionMentor)
  primaryMentorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  mentors: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Group Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'full', 'recruiting'],
    default: 'active'
  },
  
  // Group Configuration
  groupType: {
    type: String,
    enum: ['study', 'project', 'mentorship', 'collaborative'],
    default: 'mentorship'
  },
  focusArea: [{
    type: String,
    trim: true
  }],
  skillLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'mixed'],
    default: 'mixed'
  },
  
  // Metadata
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Meeting Schedule
  meetingSchedule: {
    frequency: {
      type: String,
      enum: ['weekly', 'biweekly', 'monthly', 'on-demand'],
      default: 'weekly'
    },
    dayOfWeek: {
      type: Number,
      min: 0,
      max: 6
    },
    time: {
      type: String,
      default: "14:00"
    },
    duration: {
      type: Number,
      min: 15,
      max: 180,
      default: 60
    },
    timezone: {
      type: String,
      default: "Asia/Dhaka"
    }
  },
  
  // Group Progress
  groupProgress: {
    overallProgress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    lastMeetingDate: {
      type: Date
    },
    nextMeetingDate: {
      type: Date
    },
    totalMeetings: {
      type: Number,
      min: 0,
      default: 0
    },
    activeStudents: {
      type: Number,
      min: 0,
      default: 0
    }
  },
  
  // Communication
  communicationChannel: {
    type: {
      type: String,
      enum: ['discord', 'slack', 'telegram', 'whatsapp']
    },
    channelId: {
      type: String,
      trim: true
    },
    inviteLink: {
      type: String,
      trim: true
    }
  }
}, {
  timestamps: true,
  collection: 'mentorship_groups_v2'
});

// ✅ INDEXES FOR FAST RETRIEVAL
mentorshipGroupV2Schema.index({ missionId: 1, status: 1 });
mentorshipGroupV2Schema.index({ primaryMentorId: 1 });
mentorshipGroupV2Schema.index({ mentors: 1 });
mentorshipGroupV2Schema.index({ students: 1 });
mentorshipGroupV2Schema.index({ groupType: 1, missionId: 1 });
mentorshipGroupV2Schema.index({ skillLevel: 1, missionId: 1 });

// ✅ PRE-SAVE MIDDLEWARE
mentorshipGroupV2Schema.pre('save', function(next) {
  // Update currentStudents count
  this.currentStudents = this.students.length;
  
  // If status changes to active, set nextMeetingDate
  if (this.status === 'active' && this.isModified('status') && this.meetingSchedule.frequency !== 'on-demand') {
    this.updateNextMeetingDate();
  }
  
  next();
});

// ✅ STATIC METHODS FOR COMMON QUERIES
mentorshipGroupV2Schema.statics.findByMission = function(missionId: Types.ObjectId) {
  return this.find({ missionId }).populate('students', 'name email').populate('primaryMentorId', 'name email');
};

mentorshipGroupV2Schema.statics.findActiveByMission = function(missionId: Types.ObjectId) {
  return this.find({ missionId, status: 'active' }).populate('students', 'name email').populate('primaryMentorId', 'name email');
};

mentorshipGroupV2Schema.statics.findByMentor = function(mentorId: Types.ObjectId) {
  return this.find({
    $or: [
      { primaryMentorId: mentorId },
      { mentors: mentorId }
    ]
  }).populate('students', 'name email').populate('primaryMentorId', 'name email');
};

mentorshipGroupV2Schema.statics.findByStudent = function(studentId: Types.ObjectId) {
  return this.find({ students: studentId }).populate('students', 'name email').populate('primaryMentorId', 'name email');
};

mentorshipGroupV2Schema.statics.findByType = function(missionId: Types.ObjectId, groupType: string) {
  return this.find({ missionId, groupType, status: 'active' }).populate('students', 'name email').populate('primaryMentorId', 'name email');
};

// ✅ INSTANCE METHODS
mentorshipGroupV2Schema.methods.addStudent = function(studentId: Types.ObjectId) {
  if (!this.students.includes(studentId) && this.students.length < this.maxStudents) {
    this.students.push(studentId);
    this.currentStudents = this.students.length;
  }
  return this.save();
};

mentorshipGroupV2Schema.methods.removeStudent = function(studentId: Types.ObjectId) {
  this.students = this.students.filter(id => !id.equals(studentId));
  this.currentStudents = this.students.length;
  return this.save();
};

mentorshipGroupV2Schema.methods.addMentor = function(mentorId: Types.ObjectId) {
  if (!this.mentors.includes(mentorId)) {
    this.mentors.push(mentorId);
  }
  return this.save();
};

mentorshipGroupV2Schema.methods.removeMentor = function(mentorId: Types.ObjectId) {
  this.mentors = this.mentors.filter(id => !id.equals(mentorId));
  return this.save();
};

mentorshipGroupV2Schema.methods.updateMeetingSchedule = function(frequency: string, dayOfWeek?: number, time?: string, duration?: number, timezone?: string) {
  this.meetingSchedule = {
    ...this.meetingSchedule,
    frequency: frequency as 'weekly' | 'bi-weekly' | 'monthly' | 'on-demand',
    dayOfWeek,
    time,
    duration,
    timezone
  };
  
  if (this.status === 'active' && frequency !== 'on-demand') {
    this.updateNextMeetingDate();
  }
  
  return this.save();
};

mentorshipGroupV2Schema.methods.updateNextMeetingDate = function() {
  if (this.meetingSchedule.frequency === 'on-demand' || !this.meetingSchedule.dayOfWeek) {
    return;
  }
  
  const now = new Date();
  const nextMeeting = new Date(now);
  
  // Set to next occurrence of the specified day
  while (nextMeeting.getDay() !== this.meetingSchedule.dayOfWeek) {
    nextMeeting.setDate(nextMeeting.getDate() + 1);
  }
  
  // Set the time
  if (this.meetingSchedule.time) {
    const [hours, minutes] = this.meetingSchedule.time.split(':');
    nextMeeting.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  }
  
  // If the time has passed today, move to next week
  if (nextMeeting <= now) {
    nextMeeting.setDate(nextMeeting.getDate() + 7);
  }
  
  this.groupProgress.nextMeetingDate = nextMeeting;
};

mentorshipGroupV2Schema.methods.recordMeeting = function() {
  this.groupProgress.lastMeetingDate = new Date();
  this.groupProgress.totalMeetings += 1;
  this.updateNextMeetingDate();
  return this.save();
};

mentorshipGroupV2Schema.methods.updateOverallProgress = function() {
  // This would typically be called after updating individual student progress
  // The actual calculation would depend on the MissionStudent progress values
  // For now, we'll set a placeholder
  this.groupProgress.overallProgress = 0; // Will be calculated from MissionStudent data
  return this.save();
};

mentorshipGroupV2Schema.methods.setCommunicationChannel = function(type: string, channelId?: string, inviteLink?: string) {
  this.communicationChannel = {
    type: type as 'discord' | 'slack' | 'teams' | 'zoom' | 'other',
    channelId,
    inviteLink
  };
  return this.save();
};

// ✅ VIRTUAL FIELDS
mentorshipGroupV2Schema.virtual('studentList', {
  ref: 'User',
  localField: 'students',
  foreignField: '_id'
});

mentorshipGroupV2Schema.virtual('primaryMentor', {
  ref: 'User',
  localField: 'primaryMentorId',
  foreignField: '_id',
  justOne: true
});

mentorshipGroupV2Schema.virtual('mentorList', {
  ref: 'User',
  localField: 'mentors',
  foreignField: '_id'
});

mentorshipGroupV2Schema.virtual('mission', {
  ref: 'MissionV2',
  localField: 'missionId',
  foreignField: '_id',
  justOne: true
});

// ✅ VIRTUAL FOR TOTAL PARTICIPANTS
mentorshipGroupV2Schema.virtual('totalParticipants').get(function() {
  return this.students.length + this.mentors.length;
});

// ✅ VIRTUAL FOR IS FULL
mentorshipGroupV2Schema.virtual('isFull').get(function() {
  if (this.maxStudents === 0) return false; // unlimited size
  return this.students.length >= this.maxStudents;
});

// ✅ TOJSON CONFIGURATION
mentorshipGroupV2Schema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

// ✅ TOOBJECT CONFIGURATION
mentorshipGroupV2Schema.set('toObject', {
  virtuals: true
});

// Force model refresh to ensure latest schema is used
if (mongoose.models.MentorshipGroupV2) {
  delete mongoose.models.MentorshipGroupV2;
}
const MentorshipGroupV2 = mongoose.model<IMentorshipGroupV2>('MentorshipGroupV2', mentorshipGroupV2Schema);

export default MentorshipGroupV2;
