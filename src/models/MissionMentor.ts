import mongoose, { Schema, models, model } from "mongoose";

export interface IMissionMentor {
  _id: string;
  missionId: mongoose.Types.ObjectId; // Reference to Mission
  mentorId: mongoose.Types.ObjectId;  // Reference to User (mentor)
  role: 'primary' | 'secondary' | 'moderator';
  assignedStudents: mongoose.Types.ObjectId[]; // Students directly assigned
  specialization: string[]; // Areas of expertise
  maxStudents: number; // Maximum students this mentor can handle
  currentWorkload: number; // Current number of assigned students
  status: 'active' | 'inactive' | 'overloaded';
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const MissionMentorSchema = new Schema<IMissionMentor>(
  {
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
    role: { 
      type: String, 
      enum: ['primary', 'secondary', 'moderator'],
      required: true,
      default: 'secondary'
    },
    assignedStudents: [{ 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: false 
    }],
    specialization: [{ 
      type: String, 
      required: false 
    }],
    maxStudents: { 
      type: Number, 
      required: true,
      default: 10,
      min: 0
    },
    currentWorkload: { 
      type: Number, 
      required: true,
      default: 0,
      min: 0
    },
    status: { 
      type: String, 
      enum: ['active', 'inactive', 'overloaded'],
      required: true,
      default: 'active'
    },
    notes: { 
      type: String, 
      required: false 
    }
  },
  { timestamps: true }
);

// Indexes for efficient queries
MissionMentorSchema.index({ missionId: 1, mentorId: 1 }, { unique: true });
MissionMentorSchema.index({ missionId: 1, role: 1 });
MissionMentorSchema.index({ mentorId: 1, status: 1 });
MissionMentorSchema.index({ currentWorkload: 1, maxStudents: 1 });
MissionMentorSchema.index({ status: 1, role: 1 });

// Virtual for workload percentage
MissionMentorSchema.virtual('workloadPercentage').get(function() {
  return this.maxStudents > 0 ? Math.round((this.currentWorkload / this.maxStudents) * 100) : 0;
});

// Pre-save middleware to update status based on workload
MissionMentorSchema.pre('save', function(next) {
  // Only update status if it's not explicitly set and workload changes
  if (this.isModified('currentWorkload') && !this.isModified('status')) {
    if (this.maxStudents > 0 && this.currentWorkload >= this.maxStudents) {
      this.status = 'overloaded';
    } else if (this.currentWorkload > 0) {
      this.status = 'active';
    }
    // Don't set to 'inactive' for new mentors with 0 workload
  }
  next();
});

export const MissionMentor = models.MissionMentor || model<IMissionMentor>("MissionMentor", MissionMentorSchema);
