import { NextRequest } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { getAuthUserFromRequest } from "@/lib/rbac";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your new password")
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New passwords do not match",
  path: ["confirmPassword"]
});

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);

    const body = await req.json();
    const { currentPassword, newPassword } = changePasswordSchema.parse(body);

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

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return Response.json({
        error: {
          code: "INVALID_CURRENT_PASSWORD",
          message: "Current password is incorrect"
        }
      }, { status: 400 });
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update user with new password
    await User.findByIdAndUpdate(user._id, {
      password: hashedNewPassword,
      passwordExpiresAt: null, // Remove password expiry since it's now permanent
      mustChangePassword: false // Clear the must change password flag
    });

    console.log(`✅ Password changed successfully for user: ${user.email}`);

    return Response.json({
      success: true,
      message: "Password changed successfully"
    });

  } catch (error) {
    console.error('Error changing password:', error);
    
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