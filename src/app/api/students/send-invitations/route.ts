import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { StudentEnrollment } from "@/models/StudentEnrollment";
import { User } from "@/models/User";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";
import { emailService } from "@/lib/email";
import { PASSWORD_EXPIRY_DAYS } from "@/lib/env";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["admin", "developer", "manager"]);

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

        // Check if already invited
        if (enrollment.invitationStatus === "sent" && enrollment.invitationExpiresAt && new Date() < enrollment.invitationExpiresAt) {
          results.failed++;
          results.errors.push({ email, reason: "Already invited" });
          continue;
        }

        // Check if user already exists
        let existingUser = await User.findOne({ email: enrollment.email });
        let temporaryPassword: string;
        let passwordExpiresAt: Date;
        
        if (existingUser) {
          // Update existing user with new temporary password
          temporaryPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();
          const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
          passwordExpiresAt = new Date(Date.now() + PASSWORD_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
          
          await User.findByIdAndUpdate(existingUser._id, {
            password: hashedPassword,
            passwordExpiresAt: passwordExpiresAt,
            profileCompleted: false,
            isActive: true
          });
          
          console.log(`✅ Updated existing user: ${enrollment.email}`);
        } else {
          // Create new temporary user account
          temporaryPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();
          const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
          passwordExpiresAt = new Date(Date.now() + PASSWORD_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
          
          // Generate Student ID and User ID
          const { generateNextUserId } = await import('@/lib/userid');
          const userId = await generateNextUserId('student');
          
          const tempUser = new User({
            email: enrollment.email,
            password: hashedPassword,
            role: 'student',
            name: 'Temporary Student', // Will be updated during profile completion
            userId: userId,
            isActive: true,
            profileCompleted: false,
            passwordExpiresAt: passwordExpiresAt
          });

          await tempUser.save();
          existingUser = tempUser;
          console.log(`✅ Created new user with ID: ${userId}`);
        }

             // Update enrollment with user reference and invitation details
             await StudentEnrollment.findByIdAndUpdate(enrollment._id, {
               userId: existingUser._id,
               invitationStatus: "sent",
               invitationSentAt: new Date()
             });

             // Send invitation email with login credentials
             const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`;

             const emailContent = {
               to: enrollment.email,
               subject: 'Your Student Account Login Credentials',
               html: `
                 <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                   <h2 style="color: #333;">Welcome to Student Management System</h2>
                   <p>Hello!</p>
                   <p>You have been enrolled as a student. Here are your login credentials:</p>
                   
                   <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                     <h3 style="color: #333; margin-top: 0;">Login Information:</h3>
                     <p><strong>Login URL:</strong> <a href="${loginUrl}" style="color: #3B82F6;">${loginUrl}</a></p>
                     <p><strong>Email:</strong> ${enrollment.email}</p>
                     <p><strong>Temporary Password:</strong> <span style="background-color: #e9ecef; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${temporaryPassword}</span></p>
                     <p><strong>Password Expires:</strong> ${passwordExpiresAt.toLocaleDateString()} at ${passwordExpiresAt.toLocaleTimeString()}</p>
                   </div>
                   
                   <p><strong>Next Steps:</strong></p>
                   <ol>
                     <li>Click the login URL above</li>
                     <li>Enter your email and temporary password</li>
                     <li>Complete your profile with your personal information</li>
                     <li>Set a new password for your account</li>
                   </ol>
                   
                   <p style="color: #dc3545; font-weight: bold;">Important: Please change your password after your first login for security.</p>
                   
                   <p>If you have any questions, please contact the administration.</p>
                   <p>Best regards,<br>Student Management System</p>
                 </div>
               `
             };

        // Send invitation email with login credentials
        try {
          console.log(`📧 Sending invitation email to: ${emailContent.to}`);
          const emailId = await emailService.sendEmail(
            emailContent.to,
            emailContent.subject,
            emailContent.html
          );
          console.log(`✅ Email sent successfully with ID: ${emailId}`);
          
          // Update enrollment with email tracking
          await StudentEnrollment.findByIdAndUpdate(enrollment._id, {
            invitationEmailSent: true,
            invitationEmailId: emailId
          });
          
        } catch (emailError) {
          console.error('❌ Failed to send invitation email:', emailError);
          // Log the email content for manual sending if needed
          console.log('📧 Email content that failed to send:');
          console.log('To:', emailContent.to);
          console.log('Subject:', emailContent.subject);
          console.log('Temporary Password:', temporaryPassword);
          console.log('Password Expires:', passwordExpiresAt.toLocaleString());
          
          // Don't fail the entire operation if email fails, but track it
          await StudentEnrollment.findByIdAndUpdate(enrollment._id, {
            invitationEmailSent: false,
            invitationEmailError: emailError instanceof Error ? emailError.message : 'Unknown error'
          });
        }

        results.successful++;

      } catch (error) {
        console.error(`Error sending invitation to ${email}:`, error);
        results.failed++;
        results.errors.push({ email, reason: "Internal server error" });
      }
    }

    return Response.json({
      success: true,
      message: `Invitations sent. ${results.successful} successful, ${results.failed} failed.`,
      results
    });

  } catch (error) {
    console.error('Error sending invitations:', error);
    return Response.json({
      error: {
        code: "INTERNAL",
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}
