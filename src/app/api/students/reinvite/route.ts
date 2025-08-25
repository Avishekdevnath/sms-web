import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { StudentEnrollment } from "@/models/StudentEnrollment";
import { User } from "@/models/User";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";
import { emailService } from "@/lib/email";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    if (!me) {
      return Response.json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required"
        }
      }, { status: 401 });
    }
    requireRoles(me, ["admin", "developer", "manager", "sre"]);

    const body = await req.json();
    const { emails } = body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return Response.json({ 
        error: { 
          code: "VALIDATION_ERROR",
          message: "Emails array is required" 
        } 
      }, { status: 400 });
    }

    const results = {
      total: emails.length,
      successful: 0,
      failed: 0,
      errors: [] as Array<{ email: string; reason: string }>
    };

    for (const email of emails) {
      try {
        // Find the enrollment
        const enrollment = await StudentEnrollment.findOne({
          email: email.toLowerCase(),
          status: { $in: ["pending", "approved"] }
        });

        if (!enrollment) {
          results.failed++;
          results.errors.push({ email, reason: "Enrollment not found" });
          continue;
        }

        // Find existing user account
        const existingUser = await User.findOne({
          email: email.toLowerCase(),
          role: 'student'
        });

        if (!existingUser) {
          results.failed++;
          results.errors.push({ email, reason: "User account not found" });
          continue;
        }

        // Check if password is actually expired
        if (!existingUser.passwordExpiresAt || new Date() <= existingUser.passwordExpiresAt) {
          results.failed++;
          results.errors.push({ email, reason: "Password has not expired yet" });
          continue;
        }

        // Generate new temporary password
        const newTemporaryPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();
        const hashedPassword = await bcrypt.hash(newTemporaryPassword, 10);

        // Set new password expiry (7 days from now)
        const newPasswordExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        // Update user with new password and expiry
        await User.findByIdAndUpdate(existingUser._id, {
          password: hashedPassword,
          passwordExpiresAt: newPasswordExpiresAt,
          profileCompleted: false // Reset profile completion status
        });

        // Update enrollment invitation status
        await StudentEnrollment.findByIdAndUpdate(enrollment._id, {
          invitationStatus: "sent",
          invitationSentAt: new Date()
        });

        // Send reinvitation email
        const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`;

        const emailContent = {
          to: enrollment.email,
          subject: 'New Student Account Login Credentials',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Student Management System - New Login Credentials</h2>
              <p>Hello!</p>
              <p>Your previous temporary password has expired. Here are your new login credentials:</p>
              
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0;">New Login Information:</h3>
                <p><strong>Login URL:</strong> <a href="${loginUrl}" style="color: #3B82F6;">${loginUrl}</a></p>
                <p><strong>Email:</strong> ${enrollment.email}</p>
                <p><strong>New Temporary Password:</strong> <span style="background-color: #e9ecef; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${newTemporaryPassword}</span></p>
                <p><strong>Password Expires:</strong> ${newPasswordExpiresAt.toLocaleDateString()} at ${newPasswordExpiresAt.toLocaleTimeString()}</p>
              </div>
              
              <p><strong>Next Steps:</strong></p>
              <ol>
                <li>Click the login URL above</li>
                <li>Enter your email and new temporary password</li>
                <li>Complete your profile with your personal information</li>
                <li>Set a new password for your account</li>
              </ol>
              
              <p style="color: #dc3545; font-weight: bold;">Important: Please change your password after your first login for security.</p>
              
              <p>If you have any questions, please contact the administration.</p>
              <p>Best regards,<br>Student Management System</p>
            </div>
          `
        };

        try {
          await emailService.sendEmail(
            emailContent.to,
            emailContent.subject,
            emailContent.html
          );
        } catch (emailError) {
          console.error('Failed to send reinvitation email:', emailError);
          // Don't fail the entire operation if email fails
        }

        results.successful++;

      } catch (error) {
        console.error(`Error reinviting ${email}:`, error);
        results.failed++;
        results.errors.push({ email, reason: "Internal server error" });
      }
    }

    return Response.json({
      success: true,
      message: `Reinvitations sent. ${results.successful} successful, ${results.failed} failed.`,
      results
    });

  } catch (error) {
    console.error('Error sending reinvitations:', error);
    return Response.json({
      error: {
        code: "INTERNAL",
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}
