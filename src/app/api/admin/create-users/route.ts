import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthUserFromRequest } from '@/lib/rbac';
import { User } from '@/models/User';
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/utils/apiHelpers';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // Only super admins can create new admin users
    const me = await getAuthUserFromRequest(req);
    if (!me) {
      return createErrorResponse('Unauthorized', 401);
    }
    
    if (me.role !== 'admin') {
      return createErrorResponse('Insufficient permissions. Only admins can create new admin users.', 403);
    }

    const body = await req.json();
    const { users } = body;

    if (!users || !Array.isArray(users)) {
      return createErrorResponse('Users array is required', 400);
    }

    const createdUsers = [];
    const errors = [];

    for (const userData of users) {
      try {
        // Validate required fields
        if (!userData.email || !userData.name || !userData.role) {
          errors.push(`Missing required fields for user: ${userData.email || 'unknown'}`);
          continue;
        }

        // Validate role
        const validRoles = ['admin', 'developer', 'manager', 'sre', 'mentor'];
        if (!validRoles.includes(userData.role)) {
          errors.push(`Invalid role '${userData.role}' for user: ${userData.email}`);
          continue;
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: userData.email.toLowerCase() });
        if (existingUser) {
          errors.push(`User with email ${userData.email} already exists`);
          continue;
        }

        // Generate password if not provided
        const password = userData.password || generateRandomPassword();
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = new User({
          email: userData.email.toLowerCase(),
          password: hashedPassword,
          role: userData.role,
          name: userData.name,
          userId: userData.userId || generateUserId(userData.role),
          isActive: true,
          mustChangePassword: !userData.password, // Must change if password was auto-generated
        });

        // Add mentor-specific fields
        if (userData.role === 'mentor') {
          user.studentsCount = 0;
          user.maxStudents = userData.maxStudents || 50; // Default mentor capacity
        }

        await user.save();

        createdUsers.push({
          _id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          userId: user.userId,
          password: !userData.password ? password : undefined, // Only return auto-generated passwords
          mustChangePassword: user.mustChangePassword,
          maxStudents: user.maxStudents
        });

      } catch (error) {
        console.error(`Error creating user ${userData.email}:`, error);
        errors.push(`Failed to create user ${userData.email}: ${error.message}`);
      }
    }

    const result = {
      created: createdUsers,
      errors: errors,
      summary: {
        total: users.length,
        successful: createdUsers.length,
        failed: errors.length
      }
    };

    if (createdUsers.length === 0) {
      return createErrorResponse('No users were created', 400, result);
    }

    return createSuccessResponse(result, `Successfully created ${createdUsers.length} users`);

  } catch (error) {
    console.error('Error in create-users API:', error);
    return handleApiError(error);
  }
}

function generateRandomPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

function generateUserId(role: string): string {
  const prefix = {
    'admin': 'AD',
    'developer': 'DV',
    'manager': 'MG',
    'sre': 'SR',
    'mentor': 'MT'
  }[role] || 'US';
  
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}${timestamp}`;
}
