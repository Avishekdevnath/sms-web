import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";
import bcrypt from "bcryptjs";
import { generateNextUserId } from "@/lib/userid";
import { emailService } from "@/lib/email";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // Check authentication and authorization
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["admin"]);
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const skip = (page - 1) * limit;
    
    // Filter for non-student roles only
    const roleFilter = searchParams.get("role");
    const statusFilter = searchParams.get("status");
    const isActiveFilter = searchParams.get("isActive");
    const searchQuery = searchParams.get("search") || "";
    
    // Build query
    let query: any = {
      deletedAt: { $exists: false }
    };
    
    // Handle role filter - if role is specified, use it; otherwise exclude students
    if (roleFilter && roleFilter !== "all") {
      query.role = roleFilter;
    } else {
      query.role = { $ne: "student" }; // Exclude students by default
    }
    
    // Handle status filter
    if (statusFilter && statusFilter !== "all") {
      query.isActive = statusFilter === "active";
    }
    
    // Handle isActive filter (for mentor assignment)
    if (isActiveFilter !== null && isActiveFilter !== undefined) {
      query.isActive = isActiveFilter === "true";
    }
    
    if (searchQuery) {
      query.$or = [
        { email: { $regex: searchQuery, $options: 'i' } },
        { name: { $regex: searchQuery, $options: 'i' } },
        { userId: { $regex: searchQuery, $options: 'i' } }
      ];
    }
    
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password') // Don't return passwords
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query)
    ]);
    
    return NextResponse.json({
      success: true,
      data: {
        users,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // Check authentication and authorization
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["admin"]);
    
    const body = await req.json();
    const { email, name, role, password, isActive = true } = body;
    
    // Validate required fields
    if (!email || !name || !role || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate role (exclude student)
    const allowedRoles = ["admin", "developer", "manager", "sre", "mentor"];
    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be one of: admin, developer, manager, sre, mentor' },
        { status: 400 }
      );
    }
    
    // Check if user already exists (excluding soft-deleted users)
    const existingUser = await User.findOne({ 
      email: email.toLowerCase(),
      deletedAt: { $exists: false }
    });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Generate user ID
    const userId = await generateNextUserId(role);
    
    // Create user
    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      role,
      isActive,
      userId,
      mustChangePassword: true, // Force password change on first login
      invitedAt: new Date()
    });
    
    // Send invitation email with credentials
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`;
    
    const emailContent = {
      to: email,
      subject: `Welcome to Student Management System - ${role.toUpperCase()} Role`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to Student Management System</h2>
          <p>Hello ${name},</p>
          <p>You have been added to the Student Management System as a <strong>${role.toUpperCase()}</strong>.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Your Login Details:</h3>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Password:</strong> ${password}</p>
            <p><strong>Role:</strong> ${role.toUpperCase()}</p>
          </div>
          
          <div style="margin: 20px 0;">
            <h3>Next Steps:</h3>
            <ol style="margin-left: 20px;">
              <li>Click the "Login" button below to access your account</li>
              <li>Use your email and password to login</li>
              <li>You will be prompted to change your password on first login</li>
            </ol>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Login to Your Account
            </a>
          </div>
          
          <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">
            <strong>Important:</strong> Please change your password immediately after your first login for security.
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
      // Don't fail the entire operation if email fails
    }
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user.toObject();
    
    return NextResponse.json({ 
      success: true,
      message: "User created successfully and invitation email sent",
      user: userWithoutPassword 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}