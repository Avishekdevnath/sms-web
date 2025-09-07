import mongoose, { Schema, Document } from 'mongoose';

export interface IGroup extends Document {
  name: string;
  description?: string;
  missionId: mongoose.Types.ObjectId;
  mentors: Array<{
    mentorId: mongoose.Types.ObjectId;
    role: 'primary' | 'secondary' | 'moderator';
    assignedAt: Date;
  }>;
  students: Array<{
    studentId: mongoose.Types.ObjectId;
    assignedAt: Date;
    status: 'active' | 'inactive';
  }>;
  maxStudents: number;
  currentStudents: number;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const GroupSchema = new Schema<IGroup>({
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
    ref: 'Mission',
    required: true
  },
  mentors: [{
    mentorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['primary', 'secondary', 'moderator'],
      default: 'secondary'
    },
    assignedAt: {
      type: Date,
      default: Date.now
    }
  }],
  students: [{
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    }
  }],
  maxStudents: {
    type: Number,
    required: true,
    min: 1,
    max: 100,
    default: 20
  },
  currentStudents: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
GroupSchema.index({ missionId: 1 });
GroupSchema.index({ 'mentors.mentorId': 1 });
GroupSchema.index({ 'students.studentId': 1 });
GroupSchema.index({ status: 1 });

// Virtual for calculating current students count
GroupSchema.virtual('studentCount').get(function() {
  return this.students.filter(student => student.status === 'active').length;
});

// Pre-save middleware to update currentStudents count
GroupSchema.pre('save', function(next) {
  this.currentStudents = this.students.filter(student => student.status === 'active').length;
  next();
});

// Method to add a mentor to the group
GroupSchema.methods.addMentor = function(mentorId: mongoose.Types.ObjectId, role: string = 'secondary') {
  const existingMentor = this.mentors.find(m => m.mentorId.equals(mentorId));
  if (existingMentor) {
    existingMentor.role = role;
    existingMentor.assignedAt = new Date();
  } else {
    this.mentors.push({
      mentorId,
      role,
      assignedAt: new Date()
    });
  }
  return this.save();
};

// Method to add a student to the group
GroupSchema.methods.addStudent = function(studentId: mongoose.Types.ObjectId) {
  const existingStudent = this.students.find(s => s.studentId.equals(studentId));
  if (existingStudent) {
    existingStudent.status = 'active';
    existingStudent.assignedAt = new Date();
  } else {
    if (this.currentStudents >= this.maxStudents) {
      throw new Error('Group is at maximum capacity');
    }
    this.students.push({
      studentId,
      assignedAt: new Date(),
      status: 'active'
    });
  }
  return this.save();
};

// Method to remove a mentor from the group
GroupSchema.methods.removeMentor = function(mentorId: mongoose.Types.ObjectId) {
  this.mentors = this.mentors.filter(m => !m.mentorId.equals(mentorId));
  return this.save();
};

// Method to remove a student from the group
GroupSchema.methods.removeStudent = function(studentId: mongoose.Types.ObjectId) {
  this.students = this.students.filter(s => !s.studentId.equals(studentId));
  return this.save();
};

// Static method to find groups by mission
GroupSchema.statics.findByMission = function(missionId: mongoose.Types.ObjectId) {
  return this.find({ missionId })
    .populate('mentors.mentorId', 'name email role profilePicture')
    .populate('students.studentId', 'name email studentId profilePicture')
    .sort({ createdAt: -1 });
};

// Static method to find available mentors for a mission (not in any group)
GroupSchema.statics.findAvailableMentors = function(missionId: mongoose.Types.ObjectId) {
  return this.aggregate([
    { $match: { missionId: new mongoose.Types.ObjectId(missionId) } },
    { $unwind: '$mentors' },
    { $group: { _id: '$mentors.mentorId' } },
    { $project: { mentorId: '$_id' } }
  ]);
};

// Static method to find available students for a mission (not in any group)
GroupSchema.statics.findAvailableStudents = function(missionId: mongoose.Types.ObjectId) {
  return this.aggregate([
    { $match: { missionId: new mongoose.Types.ObjectId(missionId) } },
    { $unwind: '$students' },
    { $group: { _id: '$students.studentId' } },
    { $project: { studentId: '$_id' } }
  ]);
};

// Static method to find groups by mentor
GroupSchema.statics.findByMentor = function(mentorId: mongoose.Types.ObjectId) {
  return this.find({ 'mentors.mentorId': mentorId }).populate('missionId', 'code title');
};

// Static method to find groups by student
GroupSchema.statics.findByStudent = function(studentId: mongoose.Types.ObjectId) {
  return this.find({ 'students.studentId': studentId }).populate('missionId', 'code title');
};

export default mongoose.models.Group || mongoose.model<IGroup>('Group', GroupSchema);
