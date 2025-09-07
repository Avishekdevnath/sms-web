import { Schema, models, model, Types } from "mongoose";

export interface IStudentProfile {
  _id: string;
  userId: Types.ObjectId;
  firstName: string;
  lastName: string;
  username: string;
  phone: string;
  profilePicture?: string; // Made optional with default avatar
  bio?: string;
  dateOfBirth?: Date;
  address?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  academicInfo?: {
    previousInstitution?: string;
    graduationYear?: number;
    gpa?: number;
    courseGoal?: string; // Why they enrolled
  };
  socialLinks?: {
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  skills?: string[];
  interests?: string[];
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const StudentProfileSchema = new Schema<IStudentProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true },
    phone: { type: String, required: true, trim: true },
    profilePicture: { type: String }, // Remove default value to make it truly optional
    bio: { type: String, maxlength: 500 },
    dateOfBirth: { type: Date },
    address: { type: String, maxlength: 200 },
    emergencyContact: {
      name: { type: String, trim: true },
      phone: { type: String, trim: true },
      relationship: { type: String, trim: true }
    },
    academicInfo: {
      previousInstitution: { type: String, trim: true },
      graduationYear: { type: Number, min: 1900, max: new Date().getFullYear() },
      gpa: { type: Number, min: 0, max: 4.0 },
      courseGoal: { type: String, maxlength: 1000 }
    },
    socialLinks: {
      linkedin: { type: String, trim: true },
      github: { type: String, trim: true },
      portfolio: { type: String, trim: true }
    },
    skills: [{ type: String, trim: true }],
    interests: [{ type: String, trim: true }],
    completedAt: { type: Date }
  },
  { timestamps: true }
);

// Indexes
StudentProfileSchema.index({ userId: 1 }, { unique: true });
StudentProfileSchema.index({ username: 1 }, { unique: true });
StudentProfileSchema.index({ completedAt: 1 });

// Virtual for full name
StudentProfileSchema.virtual('fullName').get(function(this: any) {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware to set completedAt when profile is complete
StudentProfileSchema.pre('save', function(this: any, next) {
  if (this.isModified('firstName') || this.isModified('lastName') || this.isModified('phone')) {
    if (this.firstName && this.lastName && this.phone) {
      this.completedAt = new Date();
    }
  }
  next();
});

export const StudentProfile = models.StudentProfile || model<IStudentProfile>("StudentProfile", StudentProfileSchema); 