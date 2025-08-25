import { NextRequest } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { StudentProfile } from "@/models/StudentProfile";
import { StudentEnrollment } from "@/models/StudentEnrollment";
import { StudentBatchMembership } from "@/models/StudentBatchMembership";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";
import { isUsernameAvailable } from "@/lib/studentIdGenerator";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  username: z.string().min(3, "Username must be at least 3 characters").max(30),
  phoneNumber: z.string().min(1, "Phone number is required"),
  courseGoal: z.string().min(1, "Course goal is required").max(500),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password")
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["student"]);

    const body = await req.json();
    const validatedData = profileSchema.parse(body);

    // Check if username is available
    const usernameAvailable = await isUsernameAvailable(validatedData.username);
    if (!usernameAvailable) {
      return Response.json({
        error: {
          code: "USERNAME_TAKEN",
          message: "Username is already taken. Please choose a different one."
        }
      }, { status: 400 });
    }

    // Get the current user
    const user = await User.findById(me._id);
    if (!user) {
      return Response.json({
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found"
        }
      }, { status: 404 });
    }

    // Check if profile is already completed
    if (user.profileCompleted) {
      return Response.json({
        error: {
          code: "PROFILE_ALREADY_COMPLETED",
          message: "Profile is already completed"
        }
      }, { status: 400 });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(validatedData.newPassword, 10);

    // Update user with new information
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        name: `${validatedData.firstName} ${validatedData.lastName}`,
        username: validatedData.username,
        password: hashedPassword,
        profileCompleted: true,
        passwordExpiresAt: null, // Remove password expiry since it's now permanent
        isActive: true
      },
      { new: true }
    );

    // Find the enrollment to get batch information
    const enrollment = await StudentEnrollment.findOne({ email: user.email });
    if (!enrollment) {
      return Response.json({
        error: {
          code: "ENROLLMENT_NOT_FOUND",
          message: "Student enrollment not found"
        }
      }, { status: 404 });
    }

    // Create student profile
    const studentProfile = new StudentProfile({
      userId: user._id,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      username: validatedData.username,
      phone: validatedData.phoneNumber,
      academicInfo: {
        courseGoal: validatedData.courseGoal
      },
      completedAt: new Date()
    });

    await studentProfile.save();

    // Create batch membership if enrollment has a batch
    if (enrollment.batchId) {
      const existingMembership = await StudentBatchMembership.findOne({
        studentId: user._id,
        batchId: enrollment.batchId
      });

      if (!existingMembership) {
        const batchMembership = new StudentBatchMembership({
          studentId: user._id,
          batchId: enrollment.batchId,
          status: "approved",
          joinedAt: new Date()
        });

        await batchMembership.save();
        console.log(`✅ Created batch membership for student: ${user.email} in batch: ${enrollment.batchId}`);
      }
    }

    // Update enrollment status to activated
    await StudentEnrollment.findOneAndUpdate(
      { email: user.email },
      {
        status: "activated",
        activatedAt: new Date(),
        activatedBy: user._id
      }
    );

    console.log(`✅ Student profile completed and account activated for: ${user.email}`);

    return Response.json({
      success: true,
      message: "Profile completed successfully. Your account has been activated.",
      data: {
        userId: user.userId,
        name: updatedUser?.name,
        username: validatedData.username,
        profileCompleted: true
      }
    });

  } catch (error) {
    console.error('Error completing profile:', error);
    
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return Response.json({
        error: {
          code: "VALIDATION_ERROR",
          message: firstError.message
        }
      }, { status: 400 });
    }

    return Response.json({
      error: {
        code: "INTERNAL",
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
} 