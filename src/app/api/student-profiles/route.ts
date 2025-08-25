import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { StudentProfile } from "@/models/StudentProfile";
import { User } from "@/models/User";
import { StudentEnrollment } from "@/models/StudentEnrollment";
import { StudentBatchMembership } from "@/models/StudentBatchMembership";
import { Batch } from "@/models/Batch";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    
    const skip = (page - 1) * limit;

    // Build search query
    let searchQuery: any = {};
    if (search) {
      searchQuery.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Build status filter
    if (status) {
      if (status === 'active') {
        searchQuery.completedAt = { $exists: true };
      } else if (status === 'pending') {
        searchQuery.completedAt = { $exists: false };
      }
    }

    // Fetch student profiles with user data
    const profiles = await StudentProfile.find(searchQuery)
      .populate({
        path: 'userId',
        select: 'email name isActive profileCompleted createdAt'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count
    const total = await StudentProfile.countDocuments(searchQuery);

    // Fetch batch memberships for all profiles
    const userIds = profiles.map(profile => profile.userId._id);
    const memberships = await StudentBatchMembership.find({
      studentId: { $in: userIds }
    }).populate('batchId', 'title code').lean();

    // Fetch enrollments for all profiles
    const enrollments = await StudentEnrollment.find({
      userId: { $in: userIds }
    }).populate('batchId', 'title code').lean();

    // Enhance profiles with additional data
    const enhancedProfiles = profiles.map(profile => {
      const userMemberships = memberships.filter(m => m.studentId.toString() === profile.userId._id.toString());
      const userEnrollments = enrollments.filter(e => e.userId.toString() === profile.userId._id.toString());
      
      const batches = userMemberships.map(m => ({
        id: m.batchId._id,
        title: m.batchId.title,
        code: m.batchId.code,
        status: m.status
      }));

      const enrollment = userEnrollments[0]; // Get first enrollment
      
      return {
        _id: profile._id,
        userId: profile.userId._id,
        firstName: profile.firstName,
        lastName: profile.lastName,
        fullName: `${profile.firstName} ${profile.lastName}`,
        username: profile.username,
        phone: profile.phone,
        email: profile.userId.email,
        profilePicture: profile.profilePicture,
        bio: profile.bio,
        academicInfo: profile.academicInfo,
        isActive: profile.userId.isActive,
        profileCompleted: profile.userId.profileCompleted,
        completedAt: profile.completedAt,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
        batches: batches,
        enrollment: enrollment ? {
          status: enrollment.status,
          batchId: enrollment.batchId,
          invitedAt: enrollment.invitationSentAt,
          activatedAt: enrollment.activatedAt
        } : null
      };
    });

    return Response.json({
      profiles: enhancedProfiles,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('Error fetching student profiles:', error);
    return Response.json({
      error: {
        code: "INTERNAL",
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}
