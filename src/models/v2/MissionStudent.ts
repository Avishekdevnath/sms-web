import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMissionStudentV2 extends Document {
  studentId: Types.ObjectId;         // Reference to User (Student)
  missionId: Types.ObjectId;         // Reference to Mission
  batchId: Types.ObjectId;           // Reference to Batch
  
  // ✅ MISSION-LEVEL STATUS (Overall mission participation)
  status: 'active' | 'deactive' | 'irregular' | 'completed' | 'dropped' | 'on-hold';
  progress: number;                  // Overall mission progress (0-100)
  startedAt: Date;
  completedAt?: Date;
  lastActivity: Date;
  
  // Mission Participation
  isRegular: boolean;                // Regular attendance/participation
  attendanceRate: number;            // Attendance percentage (0-100)
  lastAttendanceDate?: Date;         // Last time student was present
  
  // Mission-Specific Notes
  missionNotes?: string;             // Admin notes about this student in mission
  irregularityReason?: string;       // Why marked as irregular
  deactivationReason?: string;       // Why deactivated
  
  // Group Assignment (formed from mission participants)
  mentorshipGroupId?: Types.ObjectId; // Group assignment if any
  
  // ✅ GROUP-LEVEL STATUS (Specific to mentorship group)
  groupStatus?: {
    status: 'active' | 'deactive' | 'irregular' | 'on-hold';
    reason?: string;                 // Why status changed in group
    changedAt: Date;                 // When group status was last changed
    changedBy: Types.ObjectId;       // Who changed the group status
    notes?: string;                  // Group-specific notes
  };
  
  // Progress Tracking
  courseProgress: Array<{
    courseOfferingId: Types.ObjectId;
    progress: number;                // Course-specific progress
    completedAssignments: Types.ObjectId[];
    lastActivity: Date;
    mentorFeedback?: string;         // Mentor's feedback on this course
  }>;
  
  createdAt: Date;
  updatedAt: Date;
}

const missionStudentV2Schema = new Schema<IMissionStudentV2>({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  missionId: {
    type: Schema.Types.ObjectId,
    ref: 'Mission',
    required: true
  },
  batchId: {
    type: Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  
  // ✅ MISSION-LEVEL STATUS
  status: {
    type: String,
    enum: ['active', 'deactive', 'irregular', 'completed', 'dropped', 'on-hold'],
    default: 'active'
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  
  // Mission Participation
  isRegular: {
    type: Boolean,
    default: true
  },
  attendanceRate: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },
  lastAttendanceDate: {
    type: Date
  },
  
  // Mission-Specific Notes
  missionNotes: {
    type: String,
    trim: true
  },
  irregularityReason: {
    type: String,
    trim: true
  },
  deactivationReason: {
    type: String,
    trim: true
  },
  
  // Group Assignment
  mentorshipGroupId: {
    type: Schema.Types.ObjectId,
    ref: 'MentorshipGroup'
  },
  
  // ✅ GROUP-LEVEL STATUS
  groupStatus: {
    status: {
      type: String,
      enum: ['active', 'deactive', 'irregular', 'on-hold'],
      default: 'active'
    },
    reason: {
      type: String,
      trim: true
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    changedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: {
      type: String,
      trim: true
    }
  },
  
  // Progress Tracking
  courseProgress: [{
    courseOfferingId: {
      type: Schema.Types.ObjectId,
      ref: 'CourseOffering'
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    completedAssignments: [{
      type: Schema.Types.ObjectId,
      ref: 'Assignment'
    }],
    lastActivity: {
      type: Date,
      default: Date.now
    },
    mentorFeedback: {
      type: String,
      trim: true
    }
  }]
}, {
  timestamps: true,
  collection: 'mission_students_v2'
});

// ✅ INDEXES FOR FAST RETRIEVAL
missionStudentV2Schema.index({ missionId: 1, studentId: 1 }, { unique: true });
missionStudentV2Schema.index({ studentId: 1, missionId: 1 });
missionStudentV2Schema.index({ batchId: 1, missionId: 1 });
missionStudentV2Schema.index({ status: 1, missionId: 1 });
missionStudentV2Schema.index({ mentorshipGroupId: 1 });
missionStudentV2Schema.index({ isRegular: 1, missionId: 1 });
missionStudentV2Schema.index({ "groupStatus.status": 1, mentorshipGroupId: 1 });
missionStudentV2Schema.index({ "groupStatus.status": 1, missionId: 1 });

// ✅ PRE-SAVE MIDDLEWARE
missionStudentV2Schema.pre('save', function(next) {
  // Update lastActivity on any change
  this.lastActivity = new Date();
  
  // If status changes to completed, set completedAt
  if (this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  // If group status changes, update changedAt
  if (this.groupStatus && this.isModified('groupStatus.status')) {
    this.groupStatus.changedAt = new Date();
  }
  
  next();
});

// ✅ STATIC METHODS FOR COMMON QUERIES
missionStudentV2Schema.statics.findByMission = function(missionId: Types.ObjectId) {
  return this.find({ missionId }).populate('studentId', 'name email');
};

missionStudentV2Schema.statics.findActiveByMission = function(missionId: Types.ObjectId) {
  return this.find({ missionId, status: 'active' }).populate('studentId', 'name email');
};

missionStudentV2Schema.statics.findByGroup = function(groupId: Types.ObjectId) {
  return this.find({ mentorshipGroupId: groupId }).populate('studentId', 'name email');
};

missionStudentV2Schema.statics.findActiveByGroup = function(groupId: Types.ObjectId) {
  return this.find({ 
    mentorshipGroupId: groupId, 
    'groupStatus.status': 'active' 
  }).populate('studentId', 'name email');
};

missionStudentV2Schema.statics.findIrregularByMission = function(missionId: Types.ObjectId) {
  return this.find({ missionId, status: 'irregular' }).populate('studentId', 'name email');
};

// ✅ INSTANCE METHODS
missionStudentV2Schema.methods.updateProgress = function(courseOfferingId: Types.ObjectId, progress: number) {
  const courseProgress = this.courseProgress.find(cp => cp.courseOfferingId.equals(courseOfferingId));
  
  if (courseProgress) {
    courseProgress.progress = progress;
    courseProgress.lastActivity = new Date();
  } else {
    this.courseProgress.push({
      courseOfferingId,
      progress,
      completedAssignments: [],
      lastActivity: new Date()
    });
  }
  
  // Recalculate overall progress
  this.progress = this.courseProgress.reduce((total, cp) => total + cp.progress, 0) / this.courseProgress.length;
  
  return this.save();
};

missionStudentV2Schema.methods.updateGroupStatus = function(status: string, reason?: string, changedBy?: Types.ObjectId, notes?: string) {
  this.groupStatus = {
    status: status as 'active' | 'deactive' | 'irregular',
    reason,
    changedAt: new Date(),
    changedBy,
    notes
  };
  
  return this.save();
};

missionStudentV2Schema.methods.markAttendance = function(present: boolean) {
  if (present) {
    this.lastAttendanceDate = new Date();
    this.attendanceRate = Math.min(100, this.attendanceRate + 5); // Increase attendance rate
  } else {
    this.attendanceRate = Math.max(0, this.attendanceRate - 5); // Decrease attendance rate
  }
  
  this.isRegular = this.attendanceRate >= 80; // Regular if attendance >= 80%
  
  return this.save();
};

// ✅ VIRTUAL FIELDS
missionStudentV2Schema.virtual('student', {
  ref: 'User',
  localField: 'studentId',
  foreignField: '_id',
  justOne: true
});

missionStudentV2Schema.virtual('mission', {
  ref: 'Mission',
  localField: 'missionId',
  foreignField: '_id',
  justOne: true
});

missionStudentV2Schema.virtual('batch', {
  ref: 'Batch',
  localField: 'batchId',
  foreignField: '_id',
  justOne: true
});

missionStudentV2Schema.virtual('mentorshipGroup', {
  ref: 'MentorshipGroup',
  localField: 'mentorshipGroupId',
  foreignField: '_id',
  justOne: true
});

// ✅ TOJSON CONFIGURATION
missionStudentV2Schema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

// ✅ TOOBJECT CONFIGURATION
missionStudentV2Schema.set('toObject', {
  virtuals: true
});

// Check if model already exists to prevent overwrite
const MissionStudentV2 = mongoose.models.MissionStudentV2 || mongoose.model<IMissionStudentV2>('MissionStudentV2', missionStudentV2Schema);

export default MissionStudentV2;
