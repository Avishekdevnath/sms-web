import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";
import { emailService } from "@/lib/email";

const adminUpdateSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  email: z.string().email("Invalid email format").optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  phone: z.string().optional(),
  name: z.string().min(1, "Name must be at least 1 character").optional(),
  isActive: z.boolean().optional(),
  mustChangePassword: z.boolean().optional(),
  passwordExpiresAt: z.string().optional() // ISO date string
});

export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // Check authentication and authorization
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["admin"]);
    
    const body = await req.json();
    const updateData = adminUpdateSchema.parse(body);
    
    const { userId, ...updates } = updateData;
    
    // Find the user to update
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ 
        error: { code: "NOT_FOUND", message: "User not found" } 
      }, { status: 404 });
    }
    
    // Only allow updating non-admin users (moderators)
    if (user.role === "admin") {
      return NextResponse.json({ 
        error: { code: "FORBIDDEN", message: "Cannot update admin users" } 
      }, { status: 403 });
    }
    
    // Prepare update object
    const updateObject: any = {};
    
    // Handle email update
    if (updates.email && updates.email !== user.email) {
      // Check if new email already exists
      const existingUser = await User.findOne({ 
        email: updates.email.toLowerCase(),
        _id: { $ne: userId }
      });
      if (existingUser) {
        return NextResponse.json({ 
          error: { code: "CONFLICT.DUPLICATE", message: "Email already in use" } 
        }, { status: 409 });
      }
      updateObject.email = updates.email.toLowerCase();
    }
    
    // Handle password update
    if (updates.password) {
      const hashedPassword = await bcrypt.hash(updates.password, 12);
      updateObject.password = hashedPassword;
      updateObject.mustChangePassword = true;
      updateObject.passwordExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    }
    
    // Handle other fields
    if (updates.phone !== undefined) updateObject.phone = updates.phone;
    if (updates.name !== undefined) updateObject.name = updates.name;
    if (updates.isActive !== undefined) updateObject.isActive = updates.isActive;
    if (updates.mustChangePassword !== undefined) updateObject.mustChangePassword = updates.mustChangePassword;
    if (updates.passwordExpiresAt !== undefined) {
      updateObject.passwordExpiresAt = updates.passwordExpiresAt ? new Date(updates.passwordExpiresAt) : null;
    }
    
    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateObject,
      { new: true, runValidators: true }
    ).select('-password');
    
    // Send notification email if password was changed
    if (updates.password) {
      try {
        const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`;
        
        const emailContent = {
          to: updatedUser.email,
          subject: 'Password Updated - Student Management System',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Password Updated</h2>
              <p>Hello ${updatedUser.name},</p>
              <p>Your password has been updated by an administrator.</p>
              
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>New Login Details:</h3>
                <p><strong>Email:</strong> ${updatedUser.email}</p>
                <p><strong>New Password:</strong> ${updates.password}</p>
                <p><strong>Role:</strong> ${updatedUser.role.toUpperCase()}</p>
              </div>
              
              <div style="margin: 20px 0;">
                <h3>Next Steps:</h3>
                <ol style="margin-left: 20px;">
                  <li>Click the "Login" button below to access your account</li>
                  <li>Use your email and new password to login</li>
                  <li>You will be prompted to change your password on first login</li>
                </ol>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${loginUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Login to Your Account
                </a>
              </div>
              
              <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">
                <strong>Important:</strong> This password will expire in 7 days. Please change it immediately after your first login.
              </p>
              
              <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">
                If you have any questions, please contact the administration.
              </p>
              
              <p>Best regards,<br>Student Management System</p>
            </div>
          `
        };
        
        await emailService.sendEmail(
          emailContent.to,
          emailContent.subject,
          emailContent.html
        );
      } catch (emailError) {
        console.error('Failed to send password update email:', emailError);
        // Don't fail the entire operation if email fails
      }
    }
    
    return NextResponse.json({ 
      success: true,
      message: "User updated successfully",
      user: updatedUser
    });
    
  } catch (error) {
    console.error('Error updating user:', error);
    
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return NextResponse.json({ 
        error: { code: "VALIDATION.ERROR", message: firstError.message } 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: { code: "INTERNAL_ERROR", message: "Failed to update user" } 
    }, { status: 500 });
  }
}
