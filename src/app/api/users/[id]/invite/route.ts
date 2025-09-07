import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";
import { emailService } from "@/lib/email";
import bcrypt from "bcryptjs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    
    // Check authentication and authorization
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["admin"]);
    
    const { id } = await params;
    
    // Find the user first
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Generate new temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 12);
    
    // Update user with new temporary password and invitation details
    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        password: hashedPassword,
        mustChangePassword: true,
        passwordExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days expiry
        invitedAt: new Date()
      },
      { new: true, runValidators: true }
    );
    
    // Send invitation email
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`;
    
    const emailContent = {
      to: existingUser.email,
      subject: `Welcome to Student Management System - ${existingUser.role.toUpperCase()} Role`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to Student Management System</h2>
          <p>Hello ${existingUser.name},</p>
          <p>You have been invited to join the Student Management System as a <strong>${existingUser.role.toUpperCase()}</strong>.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Your Login Details:</h3>
            <p><strong>Email:</strong> ${existingUser.email}</p>
            <p><strong>Temporary Password:</strong> ${tempPassword}</p>
            <p><strong>Role:</strong> ${existingUser.role.toUpperCase()}</p>
          </div>
          
          <div style="margin: 20px 0;">
            <h3>Next Steps:</h3>
            <ol style="margin-left: 20px;">
              <li>Click the "Login" button below to access your account</li>
              <li>Use your email and temporary password to login</li>
              <li>You will be prompted to change your password on first login</li>
            </ol>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Login to Your Account
            </a>
          </div>
          
          <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">
            <strong>Important:</strong> This temporary password will expire in 7 days. Please change it immediately after your first login.
          </p>
          
          <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">
            If you have any questions, please contact the administration.
          </p>
          
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
      console.error('Failed to send invitation email:', emailError);
      return NextResponse.json({ 
        error: 'Failed to send invitation email' 
      }, { status: 500 });
    }
    
    // Return success response
    const { password: _, ...userWithoutPassword } = updatedUser.toObject();
    
    return NextResponse.json({ 
      success: true,
      message: "Invitation email sent successfully",
      user: userWithoutPassword
    });
    
  } catch (error) {
    console.error('Error inviting existing user:', error);
    return NextResponse.json({ 
      error: 'Failed to invite user' 
    }, { status: 500 });
  }
}
