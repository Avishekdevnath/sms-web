import mongoose, { Schema, models, model } from "mongoose";

export interface IMentorInGroup {
  mentorId: mongoose.Types.ObjectId;
  role: 'primary' | 'secondary' | 'moderator';
  specialization: string[];
}

export interface IMeetingSchedule {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  time: string; // HH:MM format
  duration: number; // minutes
}

export interface IMentorshipGroup {
  _id: string;
  missionId: mongoose.Types.ObjectId; // Reference to Mission
  groupName: string; // Descriptive name for the group
  mentors: IMentorInGroup[]; // Array of mentors with roles
  students: mongoose.Types.ObjectId[]; // Students in this group
  meetingSchedule: IMeetingSchedule[]; // Regular meeting times
  status: 'active' | 'inactive';
  description?: string; // Optional group description
  maxStudents?: number; // Optional max students limit
  currentStudentCount: number; // Current number of students
  createdAt?: Date;
  updatedAt?: Date;
}

const MentorInGroupSchema = new Schema<IMentorInGroup>({
  mentorId: { 
    type: Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  role: { 
    type: String, 
    enum: ['primary', 'secondary', 'moderator'],
    required: true,
    default: 'secondary'
  },
  specialization: [{ 
    type: String, 
    required: false 
  }]
});

const MeetingScheduleSchema = new Schema<IMeetingSchedule>({
  dayOfWeek: { 
    type: Number, 
    required: true,
    min: 0,
    max: 6
  },
  time: { 
    type: String, 
    required: true,
    match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:MM format validation
  },
  duration: { 
    type: Number, 
    required: true,
    min: 15,
    max: 480 // Max 8 hours
  }
});

const MentorshipGroupSchema = new Schema<IMentorshipGroup>(
  {
    missionId: { 
      type: Schema.Types.ObjectId, 
      ref: "Mission", 
      required: true 
    },
    groupName: { 
      type: String, 
      required: true,
      trim: true,
      maxlength: 100
    },
    mentors: [MentorInGroupSchema],
    students: [{ 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: false 
    }],
    meetingSchedule: [MeetingScheduleSchema],
    status: { 
      type: String, 
      enum: ['active', 'inactive'],
      required: true,
      default: 'active'
    },
    description: { 
      type: String, 
      required: false,
      maxlength: 500
    },
    maxStudents: { 
      type: Number, 
      required: false,
      min: 1
    },
    currentStudentCount: { 
      type: Number, 
      required: true,
      default: 0,
      min: 0
    }
  },
  { timestamps: true }
);

// Indexes for efficient queries
MentorshipGroupSchema.index({ missionId: 1, status: 1 });
MentorshipGroupSchema.index({ "mentors.mentorId": 1 });
MentorshipGroupSchema.index({ "students": 1 });
MentorshipGroupSchema.index({ status: 1, currentStudentCount: 1 });

// Virtual for checking if group is full
MentorshipGroupSchema.virtual('isFull').get(function() {
  return this.maxStudents ? this.currentStudentCount >= this.maxStudents : false;
});

// Virtual for available capacity
MentorshipGroupSchema.virtual('availableCapacity').get(function() {
  return this.maxStudents ? Math.max(0, this.maxStudents - this.currentStudentCount) : null;
});

// Pre-save middleware to update currentStudentCount
MentorshipGroupSchema.pre('save', function(next) {
  this.currentStudentCount = this.students.length;
  next();
});

// Method to add student to group
MentorshipGroupSchema.methods.addStudent = function(studentId: mongoose.Types.ObjectId) {
  if (!this.students.includes(studentId)) {
    this.students.push(studentId);
    this.currentStudentCount = this.students.length;
  }
  return this;
};

// Method to remove student from group
MentorshipGroupSchema.methods.removeStudent = function(studentId: mongoose.Types.ObjectId) {
  this.students = this.students.filter(id => !id.equals(studentId));
  this.currentStudentCount = this.students.length;
  return this;
};

// Method to add mentor to group
MentorshipGroupSchema.methods.addMentor = function(mentor: IMentorInGroup) {
  const existingMentorIndex = this.mentors.findIndex(m => m.mentorId.equals(mentor.mentorId));
  if (existingMentorIndex >= 0) {
    this.mentors[existingMentorIndex] = mentor;
  } else {
    this.mentors.push(mentor);
  }
  return this;
};

// Method to remove mentor from group
MentorshipGroupSchema.methods.removeMentor = function(mentorId: mongoose.Types.ObjectId) {
  this.mentors = this.mentors.filter(m => !m.mentorId.equals(mentorId));
  return this;
};

export const MentorshipGroup = models.MentorshipGroup || model<IMentorshipGroup>("MentorshipGroup", MentorshipGroupSchema);
