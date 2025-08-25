import { NextRequest } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import { StudentProfile } from "@/models/StudentProfile";
import { User } from "@/models/User";
import { StudentBatchMembership } from "@/models/StudentBatchMembership";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";
import { isUsernameAvailable } from "@/lib/studentIdGenerator";

const updateProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  username: z.string().min(3, "Username must be at least 3 characters").max(30),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email address"),
  newPassword: z.string().optional(),
  bio: z.string().optional(),
  academicInfo: z.object({
    previousInstitution: z.string().optional(),
    graduationYear: z.number().optional(),
    gpa: z.number().min(0).max(4.0).optional(),
    courseGoal: z.string().optional()
  }).optional()
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    
    const { id } = await params;
    const profile = await StudentProfile.findById(id)
      .populate('userId', 'email name isActive profileCompleted')
      .lean();

    if (!profile) {
      return Response.json({
        error: {
          code: "PROFILE_NOT_FOUND",
          message: "Student profile not found"
        }
      }, { status: 404 });
    }

    // Enhance profile with batch information
    const memberships = await StudentBatchMembership.find({
      studentId: profile.userId._id
    }).populate('batchId', 'title code').lean();

    const batches = memberships.map(m => ({
      id: m.batchId._id,
      title: m.batchId.title,
      code: m.batchId.code,
      status: m.status
    }));

    const enhancedProfile = {
      ...profile,
      batches: batches
    };

    return Response.json({ profile: enhancedProfile });

  } catch (error) {
    console.error('Error fetching student profile:', error);
    return Response.json({
      error: {
        code: "INTERNAL",
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    if (!me) {
      return Response.json({ error: { code: "AUTH.UNAUTHORIZED", message: "Unauthorized" } }, { status: 401 });
    }

    // Require admin or manager role
    requireRoles(me, ['admin', 'manager']);

    const body = await req.json();
    const validatedData = updateProfileSchema.parse(body);

    const { id } = await params;

    // Check if profile exists
    const profile = await StudentProfile.findById(id);
    if (!profile) {
      return Response.json({
        error: {
          code: "PROFILE_NOT_FOUND",
          message: "Student profile not found"
        }
      }, { status: 404 });
    }

    // Check if username is available (if changed)
    if (validatedData.username !== profile.username) {
      const usernameAvailable = await isUsernameAvailable(validatedData.username);
      if (!usernameAvailable) {
        return Response.json({
          error: {
            code: "USERNAME_TAKEN",
            message: "Username is already taken. Please choose a different one."
          }
        }, { status: 400 });
      }
    }

    // Check if email is available (if changed)
    if (validatedData.email !== profile.userId.email) {
      const existingUser = await User.findOne({ email: validatedData.email });
      if (existingUser && existingUser._id.toString() !== profile.userId.toString()) {
        return Response.json({
          error: {
            code: "EMAIL_TAKEN",
            message: "Email is already taken by another user."
          }
        }, { status: 400 });
      }
    }

    // Update user data
    const userUpdateData: any = {
      email: validatedData.email,
      name: `${validatedData.firstName} ${validatedData.lastName}`
    };

    // Update password if provided
    if (validatedData.newPassword) {
      const hashedPassword = await bcrypt.hash(validatedData.newPassword, 10);
      userUpdateData.password = hashedPassword;
    }

    await User.findByIdAndUpdate(profile.userId, userUpdateData);

    // Update profile data
    const profileUpdateData: any = {
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      username: validatedData.username,
      phone: validatedData.phone
    };

    if (validatedData.bio !== undefined) {
      profileUpdateData.bio = validatedData.bio;
    }

    if (validatedData.academicInfo) {
      profileUpdateData.academicInfo = validatedData.academicInfo;
    }

    await StudentProfile.findByIdAndUpdate(id, profileUpdateData);

    console.log(`✅ Student profile updated by ${me.email}: ${validatedData.email}`);

    return Response.json({
      success: true,
      message: "Student profile updated successfully"
    });

  } catch (error) {
    console.error('Error updating student profile:', error);
    
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    if (!me) {
      return Response.json({ error: { code: "AUTH.UNAUTHORIZED", message: "Unauthorized" } }, { status: 401 });
    }

    // Require admin role for deletion
    requireRoles(me, ['admin']);

    const { id } = await params;
    const profile = await StudentProfile.findById(id);
    if (!profile) {
      return Response.json({
        error: {
          code: "PROFILE_NOT_FOUND",
          message: "Student profile not found"
        }
      }, { status: 404 });
    }

    // Delete the user account
    await User.findByIdAndDelete(profile.userId);
    
    // Delete the profile
    await StudentProfile.findByIdAndDelete(id);

    console.log(`✅ Student profile deleted by ${me.email}: ${profile.userId}`);

    return Response.json({
      success: true,
      message: "Student profile deleted successfully"
    });

  } catch (error) {
    console.error('Error deleting student profile:', error);
    return Response.json({
      error: {
        code: "INTERNAL",
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}
