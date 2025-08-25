import { NextRequest } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { StudentProfile } from "@/models/StudentProfile";
import { StudentBatchMembership } from "@/models/StudentBatchMembership";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";
import { isUsernameAvailable } from "@/lib/studentIdGenerator";

const updateProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  username: z.string().min(3, "Username must be at least 3 characters").max(30),
  phone: z.string().min(1, "Phone number is required"),
  bio: z.string().optional(),
  academicInfo: z.object({
    previousInstitution: z.string().optional(),
    graduationYear: z.number().optional(),
    gpa: z.number().min(0).max(4.0).optional(),
    courseGoal: z.string().optional()
  }).optional()
});

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    if (!me) {
      return Response.json({ error: { code: "AUTH.UNAUTHORIZED", message: "Unauthorized" } }, { status: 401 });
    }

    // Require student role
    requireRoles(me, ['student']);
    
    const profile = await StudentProfile.findOne({ userId: me._id })
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

export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    if (!me) {
      return Response.json({ error: { code: "AUTH.UNAUTHORIZED", message: "Unauthorized" } }, { status: 401 });
    }

    // Require student role
    requireRoles(me, ['student']);

    const body = await req.json();
    const validatedData = updateProfileSchema.parse(body);

    // Check if profile exists
    const profile = await StudentProfile.findOne({ userId: me._id });
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

    await StudentProfile.findByIdAndUpdate(profile._id, profileUpdateData);

    console.log(`✅ Student profile updated by ${me.email}`);

    return Response.json({
      success: true,
      message: "Profile updated successfully"
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
