import { NextRequest } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { getAuthUserFromRequest } from "@/lib/rbac";

const resetPasswordSchema = z.object({
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

    const body = await req.json();
    const { newPassword } = resetPasswordSchema.parse(body);

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

    // Check if user has a temporary password
    if (!user.passwordExpiresAt) {
      return Response.json({
        error: {
          code: "NO_TEMPORARY_PASSWORD",
          message: "No temporary password found. Please use the forgot password feature."
        }
      }, { status: 400 });
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update user with new password and remove expiry
    // For existing users who have already completed their profile, keep profileCompleted as true
    // For new users who haven't completed profile, this will remain false
    await User.findByIdAndUpdate(user._id, {
      password: hashedNewPassword,
      passwordExpiresAt: null, // Remove password expiry since it's now permanent
      profileCompleted: user.profileCompleted || false // Preserve existing profile completion status
    });

    console.log(`✅ Password reset successfully for user: ${user.email}`);

    return Response.json({
      success: true,
      message: "Password reset successfully"
    });

  } catch (error) {
    console.error('Error resetting password:', error);
    
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