import { Schema, models, model, Types } from "mongoose";

export type UserRole = "admin" | "developer" | "manager" | "sre" | "mentor" | "student";

export interface IUser {
  _id: string;
  userId?: string; // custom readable id like AD001
  email: string;
  password: string;
  role: UserRole;
  name: string;
  isActive: boolean;
  mustChangePassword?: boolean;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
  
  // Student profile fields
  studentId?: string; // format: B{batchNumber}{sequentialNumber}
  username?: string;
  phone?: string;
  profilePicture?: string;
  profileCompleted?: boolean;
  invitedAt?: Date;
  
  // Mentor assignment fields
  mentorId?: Types.ObjectId;
  studentsCount?: number;
  maxStudents?: number;
  
  // Ban and invitation fields
  bannedAt?: Date;
  banReason?: string;
  inviteToken?: string;
  inviteExpiresAt?: Date;
  
  // Password expiry for temporary accounts
  passwordExpiresAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    userId: { type: String },
    email: { type: String, required: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ["admin", "developer", "manager", "sre", "mentor", "student"] },
    name: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    mustChangePassword: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: { type: Schema.Types.ObjectId, ref: "User" },
    
    // Profile fields (available for all roles)
    studentId: { type: String },
    username: { type: String },
    phone: { type: String },
    profilePicture: { type: String },
    profileCompleted: { type: Boolean, default: false },
    invitedAt: { type: Date },
    
    // Mentor assignment fields
    mentorId: { type: Schema.Types.ObjectId, ref: "User" },
    studentsCount: { type: Number, default: 0 },
    maxStudents: { type: Number },
    
    // Ban and invitation fields
    bannedAt: { type: Date },
    banReason: { type: String },
    inviteToken: { type: String },
    inviteExpiresAt: { type: Date },
    
    // Password expiry for temporary accounts
    passwordExpiresAt: { type: Date },
  },
  { timestamps: true }
);

// Indexes for efficient querying
UserSchema.index({ userId: 1 }, { unique: true, sparse: true });
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ mustChangePassword: 1 });
UserSchema.index({ deletedAt: 1 });
UserSchema.index({ deletedBy: 1 });
UserSchema.index({ profileCompleted: 1 });
UserSchema.index({ invitedAt: 1 });
UserSchema.index({ bannedAt: 1 });
UserSchema.index({ inviteToken: 1 });
UserSchema.index({ inviteExpiresAt: 1 });
UserSchema.index({ passwordExpiresAt: 1 });
UserSchema.index({ mentorId: 1 }); // For finding students by mentor
UserSchema.index({ studentsCount: 1 }); // For mentor capacity queries
UserSchema.index({ maxStudents: 1 }); // For mentor capacity queries

export const User = models.User || model<IUser>("User", UserSchema); 