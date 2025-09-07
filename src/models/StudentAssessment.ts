import mongoose, { Schema, models, model } from "mongoose";

export interface IStudentAssessment {
  _id: string;
  studentId: mongoose.Types.ObjectId;
  jobStatus?: 'working' | 'studying' | 'unemployed';
  jobType?: 'technical' | 'non-technical';
  educationLevel?: string;
  programmingExperience?: 'none' | 'basic' | 'intermediate' | 'advanced';
  timeAvailability?: 'full-time' | 'part-time' | 'weekends';
  learningStyle?: string[];
  previousCourses?: string[];
  goals?: string[];
  challenges?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

const StudentAssessmentSchema = new Schema<IStudentAssessment>(
  {
    studentId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    jobStatus: { 
      type: String, 
      enum: ['working', 'studying', 'unemployed'],
      required: false
    },
    jobType: { 
      type: String, 
      enum: ['technical', 'non-technical'],
      required: false
    },
    educationLevel: { 
      type: String, 
      required: false 
    },
    programmingExperience: { 
      type: String, 
      enum: ['none', 'basic', 'intermediate', 'advanced'],
      required: false
    },
    timeAvailability: { 
      type: String, 
      enum: ['full-time', 'part-time', 'weekends'],
      required: false
    },
    learningStyle: [{ 
      type: String, 
      required: false 
    }],
    previousCourses: [{ 
      type: String, 
      required: false 
    }],
    goals: [{ 
      type: String, 
      required: false 
    }],
    challenges: [{ 
      type: String, 
      required: false 
    }]
  },
  { timestamps: true }
);

// Index for efficient queries
StudentAssessmentSchema.index({ studentId: 1 }, { unique: true });

export const StudentAssessment = models.StudentAssessment || model<IStudentAssessment>("StudentAssessment", StudentAssessmentSchema);
