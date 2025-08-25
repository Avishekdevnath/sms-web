import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { StudentEnrollment } from "@/models/StudentEnrollment";
import { User } from "@/models/User";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const email = searchParams.get("email");

    // Find users with expired passwords
    const query: any = {
      role: 'student',
      passwordExpiresAt: { $lt: new Date() } // Password has expired
    };

    if (email) {
      query.email = { $regex: email, $options: "i" };
    }

    // Get total count
    const total = await User.countDocuments(query);

    // Get users with expired passwords
    const expiredUsers = await User.find(query)
      .select('email name passwordExpiresAt profileCompleted createdAt')
      .sort({ passwordExpiresAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Get enrollment information for these users
    const userEmails = expiredUsers.map(user => user.email);
    const enrollments = await StudentEnrollment.find({
      email: { $in: userEmails }
    })
    .populate("batchId", "code title")
    .lean();

    // Create a map of email to enrollment
    const enrollmentMap = new Map();
    enrollments.forEach(enrollment => {
      enrollmentMap.set(enrollment.email, enrollment);
    });

    // Transform data to include enrollment information
    const transformedData = expiredUsers.map(user => {
      const enrollment = enrollmentMap.get(user.email);
      return {
        _id: user._id,
        email: user.email,
        name: user.name,
        passwordExpiresAt: user.passwordExpiresAt,
        profileCompleted: user.profileCompleted,
        createdAt: user.createdAt,
        batchId: enrollment?.batchId,
        enrollmentId: enrollment?._id,
        daysExpired: Math.floor((new Date().getTime() - new Date(user.passwordExpiresAt).getTime()) / (1000 * 60 * 60 * 24))
      };
    });

    return Response.json({
      success: true,
      data: transformedData,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching expired passwords:', error);
    return Response.json({
      error: {
        code: "INTERNAL",
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}
