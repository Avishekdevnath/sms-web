import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMissionMentorV2 extends Document {
  mentorId: Types.ObjectId;          // Reference to User (Mentor)
  missionId: Types.ObjectId;         // Reference to Mission
  batchId: Types.ObjectId;           // Reference to Batch
  
  // ✅ MISSION-LEVEL STATUS (Overall mission participation)
  status: 'active' | 'deactive' | 'irregular' | 'overloaded' | 'unavailable';
  role: 'mission-lead' | 'coordinator' | 'advisor' | 'supervisor';
  specialization: string[];          // e.g., ['frontend', 'react', 'javascript']
  responsibilities: string[];        // e.g., ['progress-review', 'quality-control', 'student-support']
  
  // Mission Participation
  isRegular: boolean;                // Regular availability/participation
  availabilityRate: number;          // Availability percentage (0-100)
  lastAvailableDate?: Date;          // Last time mentor was available
  
  // Mission-Specific Notes
  missionNotes?: string;             // Admin notes about this mentor in mission
  irregularityReason?: string;       // Why marked as irregular
  deactivationReason?: string;       // Why deactivated
  
  // Mentor Capacity & Status
  maxStudents: number;               // Maximum students this mentor can handle in mission
  currentStudents: number;           // Current student count in mission
  
  // Mission-Specific Mentor Performance
  missionRating: number;             // Average student rating for this mission (1-5)
  totalMentoredStudents: number;     // Total students mentored in this mission
  totalSessions: number;             // Total sessions conducted for this mission
  
  // Availability & Schedule
  availability: {
    days: number[];                  // [1,2,3,4,5] for Mon-Fri
    hours: { start: string, end: string }; // "09:00" to "17:00"
    timezone: string;                // "Asia/Dhaka"
    preferredSessionDuration: number; // Preferred session length in minutes
  };
  
  // Mission Groups (formed from mission participants)
  assignedGroups: Types.ObjectId[];  // References to MentorshipGroup
  
  // ✅ GROUP-LEVEL STATUS (Specific to mentorship groups)
  groupStatuses: Array<{
    groupId: Types.ObjectId;         // Reference to specific group
    status: 'active' | 'deactive' | 'irregular' | 'overloaded' | 'unavailable';
    reason?: string;                 // Why status changed in group
    changedAt: Date;                 // When group status was last changed
    changedBy: Types.ObjectId;       // Who changed the group status
    notes?: string;                  // Group-specific notes
    role: 'primary' | 'co-mentor' | 'moderator'; // Role in this specific group
  }>;
  
  // Mission Statistics
  stats: {
    avgStudentProgress: number;      // Average progress of mentored students in mission
    sessionCompletionRate: number;   // Percentage of completed sessions
    studentSatisfaction: number;     // Average satisfaction score
  };
  
  createdAt: Date;
  updatedAt: Date;
}

const missionMentorV2Schema = new Schema<IMissionMentorV2>({
  mentorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
  
  // ✅ MISSION-LEVEL STATUS
  status: {
    type: String,
    enum: ['active', 'deactive', 'irregular', 'overloaded', 'unavailable'],
    default: 'active'
  },
  role: {
    type: String,
    enum: ['mission-lead', 'coordinator', 'advisor', 'supervisor'],
    default: 'advisor'
  },
  specialization: [{
    type: String,
    trim: true
  }],
  responsibilities: [{
    type: String,
    trim: true
  }],
  
  // Mission Participation
  isRegular: {
    type: Boolean,
    default: true
  },
  availabilityRate: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },
  lastAvailableDate: {
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
  
  // Mentor Capacity & Status
  maxStudents: {
    type: Number,
    min: 0,
    default: 0  // 0 means unlimited capacity
  },
  currentStudents: {
    type: Number,
    min: 0,
    default: 0
  },
  
  // Mission-Specific Mentor Performance
  missionRating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  totalMentoredStudents: {
    type: Number,
    min: 0,
    default: 0
  },
  totalSessions: {
    type: Number,
    min: 0,
    default: 0
  },
  
  // Availability & Schedule
  availability: {
    days: [{
      type: Number,
      min: 1,
      max: 7
    }],
    hours: {
      start: {
        type: String,
        default: "09:00"
      },
      end: {
        type: String,
        default: "17:00"
      }
    },
    timezone: {
      type: String,
      default: "Asia/Dhaka"
    },
    preferredSessionDuration: {
      type: Number,
      min: 15,
      max: 180,
      default: 60
    }
  },
  
  // Mission Groups
  assignedGroups: [{
    type: Schema.Types.ObjectId,
    ref: 'MentorshipGroup'
  }],
  
  // ✅ GROUP-LEVEL STATUS
  groupStatuses: [{
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'MentorshipGroup',
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'deactive', 'irregular', 'overloaded', 'unavailable'],
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
    },
    role: {
      type: String,
      enum: ['primary', 'co-mentor', 'moderator'],
      default: 'co-mentor'
    }
  }],
  
  // Mission Statistics
  stats: {
    avgStudentProgress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    sessionCompletionRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    studentSatisfaction: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    }
  }
}, {
  timestamps: true,
  collection: 'mission_mentors_v2'
});

// ✅ INDEXES FOR FAST RETRIEVAL
missionMentorV2Schema.index({ missionId: 1, mentorId: 1 }, { unique: true });
missionMentorV2Schema.index({ mentorId: 1, missionId: 1 });
missionMentorV2Schema.index({ batchId: 1, missionId: 1 });
missionMentorV2Schema.index({ role: 1, missionId: 1 });
missionMentorV2Schema.index({ status: 1, missionId: 1 });
missionMentorV2Schema.index({ isRegular: 1, missionId: 1 });
missionMentorV2Schema.index({ specialization: 1, missionId: 1 });
missionMentorV2Schema.index({ "groupStatuses.groupId": 1, "groupStatuses.status": 1 });
missionMentorV2Schema.index({ "groupStatuses.role": 1, "groupStatuses.groupId": 1 });

// ✅ PRE-SAVE MIDDLEWARE
missionMentorV2Schema.pre('save', function(next) {
  // Update lastAvailableDate if status changes to available
  if (this.status === 'active' && this.isModified('status')) {
    this.lastAvailableDate = new Date();
  }
  
  // Update group status timestamps
  if (this.isModified('groupStatuses')) {
    this.groupStatuses.forEach(gs => {
      if (gs.isModified && gs.isModified('status')) {
        gs.changedAt = new Date();
      }
    });
  }
  
  next();
});

// ✅ STATIC METHODS FOR COMMON QUERIES
missionMentorV2Schema.statics.findByMission = function(missionId: Types.ObjectId) {
  return this.find({ missionId }).populate('mentorId', 'name email');
};

missionMentorV2Schema.statics.findActiveByMission = function(missionId: Types.ObjectId) {
  return this.find({ missionId, status: 'active' }).populate('mentorId', 'name email');
};

missionMentorV2Schema.statics.findAvailableByMission = function(missionId: Types.ObjectId) {
  return this.find({ 
    missionId, 
    status: 'active',
    $expr: { $lt: ['$currentStudents', '$maxStudents'] }
  }).populate('mentorId', 'name email');
};

missionMentorV2Schema.statics.findByRole = function(missionId: Types.ObjectId, role: string) {
  return this.find({ missionId, role }).populate('mentorId', 'name email');
};

missionMentorV2Schema.statics.findBySpecialization = function(missionId: Types.ObjectId, specialization: string) {
  return this.find({ 
    missionId, 
    specialization: { $in: [specialization] },
    status: 'active'
  }).populate('mentorId', 'name email');
};

// ✅ INSTANCE METHODS
missionMentorV2Schema.methods.updateGroupStatus = function(groupId: Types.ObjectId, status: string, reason?: string, changedBy?: Types.ObjectId, notes?: string, role?: string) {
  const groupStatus = this.groupStatuses.find(gs => gs.groupId.equals(groupId));
  
  if (groupStatus) {
    groupStatus.status = status as 'active' | 'deactive' | 'irregular';
    groupStatus.reason = reason;
    groupStatus.changedAt = new Date();
    groupStatus.changedBy = changedBy;
    groupStatus.notes = notes;
    if (role) groupStatus.role = role as 'primary' | 'co-mentor';
  } else {
    this.groupStatuses.push({
      groupId,
      status: status as 'active' | 'deactive' | 'irregular',
      reason,
      changedAt: new Date(),
      changedBy,
      notes,
      role: role as 'primary' | 'co-mentor' || 'co-mentor'
    });
  }
  
  return this.save();
};

missionMentorV2Schema.methods.addGroup = function(groupId: Types.ObjectId) {
  if (!this.assignedGroups.includes(groupId)) {
    this.assignedGroups.push(groupId);
  }
  return this.save();
};

missionMentorV2Schema.methods.removeGroup = function(groupId: Types.ObjectId) {
  this.assignedGroups = this.assignedGroups.filter(id => !id.equals(groupId));
  // Also remove from groupStatuses
  this.groupStatuses = this.groupStatuses.filter(gs => !gs.groupId.equals(groupId));
  return this.save();
};

missionMentorV2Schema.methods.updateAvailability = function(days: number[], hours: { start: string, end: string }, timezone: string, sessionDuration: number) {
  this.availability = {
    days,
    hours,
    timezone,
    preferredSessionDuration: sessionDuration
  };
  return this.save();
};

missionMentorV2Schema.methods.markAvailable = function() {
  this.lastAvailableDate = new Date();
  this.availabilityRate = Math.min(100, this.availabilityRate + 10);
  this.isRegular = this.availabilityRate >= 80;
  return this.save();
};

missionMentorV2Schema.methods.markUnavailable = function() {
  this.availabilityRate = Math.max(0, this.availabilityRate - 10);
  this.isRegular = this.availabilityRate >= 80;
  return this.save();
};

// ✅ VIRTUAL FIELDS
missionMentorV2Schema.virtual('mentor', {
  ref: 'User',
  localField: 'mentorId',
  foreignField: '_id',
  justOne: true
});

missionMentorV2Schema.virtual('mission', {
  ref: 'MissionV2',
  localField: 'missionId',
  foreignField: '_id',
  justOne: true
});

missionMentorV2Schema.virtual('batch', {
  ref: 'Batch',
  localField: 'batchId',
  foreignField: '_id',
  justOne: true
});

missionMentorV2Schema.virtual('groups', {
  ref: 'MentorshipGroup',
  localField: 'assignedGroups',
  foreignField: '_id'
});

// ✅ TOJSON CONFIGURATION
missionMentorV2Schema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

// ✅ TOOBJECT CONFIGURATION
missionMentorV2Schema.set('toObject', {
  virtuals: true
});

// Check if model already exists to prevent overwrite
const MissionMentorV2 = mongoose.models.MissionMentorV2 || mongoose.model<IMissionMentorV2>('MissionMentorV2', missionMentorV2Schema);

export default MissionMentorV2;
