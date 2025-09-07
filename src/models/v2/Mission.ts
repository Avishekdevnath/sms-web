import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMissionV2 extends Document {
  code: string;                    // MISSION-001
  title: string;                   // "Phitron Mission 1"
  description?: string;
  batchId: Types.ObjectId;         // Reference to Batch
  startDate?: Date;
  endDate?: Date;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  
  // ✅ FAST RETRIEVAL FIELDS (Just Object IDs)
  studentIds: Types.ObjectId[];    // Fast student count/listing
  totalStudents: number;           // Cached count
  mentorIds: Types.ObjectId[];     // Fast mentor count/listing
  totalMentors: number;            // Cached count
  groupIds: Types.ObjectId[];      // Fast group count/listing
  totalGroups: number;             // Cached count
  
  // Course Configuration
  courses: Array<{
    courseOfferingId: Types.ObjectId;
    weight: number;                // Percentage weight
    requiredAssignments: Types.ObjectId[];
    minProgress: number;
  }>;
  
  // Mission Configuration
  maxStudents?: number;
  requirements?: string[];
  rewards?: string[];
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  // Attendance Configuration
  attendanceConfig?: {
    timezone: string;                 // e.g., "Asia/Dhaka"
    workingDays: number[];            // 0-6 (Sun-Sat)
    holidays: string[];               // ISO date strings YYYY-MM-DD in timezone
    excludeExcusedFromRate?: boolean; // default true
  };
}

const missionV2Schema = new Schema<IMissionV2>({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  batchId: {
    type: Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed', 'archived'],
    default: 'draft'
  },
  
  // ✅ FAST RETRIEVAL FIELDS
  studentIds: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  totalStudents: {
    type: Number,
    default: 0,
    min: 0
  },
  mentorIds: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  totalMentors: {
    type: Number,
    default: 0,
    min: 0
  },
  groupIds: [{
    type: Schema.Types.ObjectId,
    ref: 'MentorshipGroup'
  }],
  totalGroups: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Course Configuration
  courses: [{
    courseOfferingId: {
      type: Schema.Types.ObjectId,
      ref: 'CourseOffering'
    },
    weight: {
      type: Number,
      min: 0,
      max: 100
    },
    requiredAssignments: [{
      type: Schema.Types.ObjectId,
      ref: 'Assignment'
    }],
    minProgress: {
      type: Number,
      min: 0,
      max: 100,
      default: 70
    }
  }],
  
  // Mission Configuration
  maxStudents: {
    type: Number,
    min: 1
  },
  requirements: [String],
  rewards: [String],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  attendanceConfig: {
    timezone: { type: String, default: 'Asia/Dhaka' },
    workingDays: { type: [Number], default: [1,2,3,4,5] },
    holidays: { type: [String], default: [] },
    excludeExcusedFromRate: { type: Boolean, default: true }
  }
}, {
  timestamps: true,
  collection: 'missions_v2'
});

// ✅ INDEXES FOR FAST RETRIEVAL
missionV2Schema.index({ code: 1 }, { unique: true });
missionV2Schema.index({ batchId: 1, status: 1 });
missionV2Schema.index({ createdBy: 1 });
missionV2Schema.index({ "studentIds": 1 });
missionV2Schema.index({ "mentorIds": 1 });
missionV2Schema.index({ "groupIds": 1 });

// ✅ PRE-SAVE MIDDLEWARE TO AUTO-UPDATE CACHED COUNTS
missionV2Schema.pre('save', function(next) {
  // Update cached counts before saving
  this.totalStudents = this.studentIds.length;
  this.totalMentors = this.mentorIds.length;
  this.totalGroups = this.groupIds.length;
  next();
});

// ✅ STATIC METHODS FOR COMMON QUERIES
missionV2Schema.statics.findByBatch = function(batchId: Types.ObjectId) {
  return this.find({ batchId, status: { $ne: 'archived' } });
};

missionV2Schema.statics.findActive = function() {
  return this.find({ status: 'active' });
};

missionV2Schema.statics.findByStatus = function(status: string) {
  return this.find({ status });
};

// ✅ INSTANCE METHODS
missionV2Schema.methods.addStudent = function(studentId: Types.ObjectId) {
  if (!this.studentIds.includes(studentId)) {
    this.studentIds.push(studentId);
    this.totalStudents = this.studentIds.length;
  }
  return this.save();
};

missionV2Schema.methods.removeStudent = function(studentId: Types.ObjectId) {
  this.studentIds = this.studentIds.filter(id => !id.equals(studentId));
  this.totalStudents = this.studentIds.length;
  return this.save();
};

missionV2Schema.methods.addMentor = function(mentorId: Types.ObjectId) {
  if (!this.mentorIds.includes(mentorId)) {
    this.mentorIds.push(mentorId);
    this.totalMentors = this.mentorIds.length;
  }
  return this.save();
};

missionV2Schema.methods.removeMentor = function(mentorId: Types.ObjectId) {
  this.mentorIds = this.mentorIds.filter(id => !id.equals(mentorId));
  this.totalMentors = this.mentorIds.length;
  return this.save();
};

missionV2Schema.methods.addGroup = function(groupId: Types.ObjectId) {
  if (!this.groupIds.includes(groupId)) {
    this.groupIds.push(groupId);
    this.totalGroups = this.groupIds.length;
  }
  return this.save();
};

missionV2Schema.methods.removeGroup = function(groupId: Types.ObjectId) {
  this.groupIds = this.groupIds.filter(id => !id.equals(groupId));
  this.totalGroups = this.groupIds.length;
  return this.save();
};

// ✅ VIRTUAL FIELDS FOR POPULATED DATA
missionV2Schema.virtual('students', {
  ref: 'User',
  localField: 'studentIds',
  foreignField: '_id'
});

missionV2Schema.virtual('mentors', {
  ref: 'User',
  localField: 'mentorIds',
  foreignField: '_id'
});

missionV2Schema.virtual('groups', {
  ref: 'MentorshipGroup',
  localField: 'groupIds',
  foreignField: '_id'
});

// ✅ TOJSON CONFIGURATION
missionV2Schema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

// ✅ TOOBJECT CONFIGURATION
missionV2Schema.set('toObject', {
  virtuals: true
});

// Check if model already exists to prevent overwrite
const MissionV2 = mongoose.models.MissionV2 || mongoose.model<IMissionV2>('MissionV2', missionV2Schema);

export default MissionV2;
