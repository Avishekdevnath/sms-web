import { NextRequest } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { emailService } from "@/lib/email";
import { PASSWORD_EXPIRY_DAYS } from "@/lib/env";

const forgotPasswordSchema = z.object({
  loginIdentifier: z.string().min(1, "Login identifier is required"),
  loginMethod: z.enum(["email", "username", "phone"], { 
    required_error: "Login method is required" 
  })
});

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await req.json();
    const { loginIdentifier, loginMethod } = forgotPasswordSchema.parse(body);

    // Build query based on login method
    let query: any = {
      isActive: true,
      deletedAt: { $exists: false }
    };

    if (loginMethod === "email") {
      query.email = loginIdentifier.toLowerCase();
    } else if (loginMethod === "username") {
      query.username = loginIdentifier;
    } else if (loginMethod === "phone") {
      query.phone = loginIdentifier;
    }

    // Find the user
    const user = await User.findOne(query);

    if (!user) {
      // Don't reveal if user exists or not for security
      return Response.json({
        success: true,
        message: "If an account with this email exists, a temporary password has been sent."
      });
    }

    // Generate temporary password
    const temporaryPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
    
    // Set password expiry (configurable days from now)
    const passwordExpiresAt = new Date(Date.now() + PASSWORD_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    // Update user with temporary password
    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      passwordExpiresAt: passwordExpiresAt,
      // Don't reset profileCompleted - keep existing profile data
    });

    // Send email with temporary password
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`;
    
    const emailContent = {
      to: user.email,
      subject: 'Password Reset - Temporary Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hello ${user.name || 'there'}!</p>
          <p>You requested a password reset for your account. Here are your temporary login credentials:</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Temporary Login Information:</h3>
            <p><strong>Login URL:</strong> <a href="${loginUrl}" style="color: #3B82F6;">${loginUrl}</a></p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Temporary Password:</strong> <span style="background-color: #e9ecef; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${temporaryPassword}</span></p>
            <p><strong>Password Expires:</strong> ${passwordExpiresAt.toLocaleDateString()} at ${passwordExpiresAt.toLocaleTimeString()}</p>
          </div>
          
          <p><strong>Next Steps:</strong></p>
          <ol>
            <li>Click the login URL above</li>
            <li>Enter your email and temporary password</li>
            <li>You will be prompted to set a new password</li>
            <li>Complete the password change process</li>
          </ol>
          
          <p style="color: #dc3545; font-weight: bold;">Important: This temporary password will expire in ${PASSWORD_EXPIRY_DAYS} days. Please change it immediately after logging in.</p>
          
          <p>If you didn't request this password reset, please ignore this email or contact support.</p>
          <p>Best regards,<br>Student Management System</p>
        </div>
      `
    };

    try {
      console.log(`📧 Sending password reset email to: ${emailContent.to}`);
      const emailId = await emailService.sendEmail(
        emailContent.to,
        emailContent.subject,
        emailContent.html
      );
      console.log(`✅ Password reset email sent successfully with ID: ${emailId}`);
      
    } catch (emailError) {
      console.error('❌ Failed to send password reset email:', emailError);
      // Log the email content for manual sending if needed
      console.log('📧 Email content that failed to send:');
      console.log('To:', emailContent.to);
      console.log('Subject:', emailContent.subject);
      console.log('Temporary Password:', temporaryPassword);
      console.log('Password Expires:', passwordExpiresAt.toLocaleString());
    }

    return Response.json({
      success: true,
      message: "If an account with this email exists, a temporary password has been sent."
    });

  } catch (error) {
    console.error('Error in forgot password:', error);
    
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
        message: "An error occurred while processing your request"
      }
    }, { status: 500 });
  }
}
