import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { StudentEnrollment } from "@/models/StudentEnrollment";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return Response.json({
        error: {
          code: "MISSING_EMAIL",
          message: "Email parameter is required"
        }
      }, { status: 400 });
    }

    await connectToDatabase();

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() }).lean();
    
    // Check if there's already a pending enrollment
    const existingEnrollment = await StudentEnrollment.findOne({ 
      email: email.toLowerCase(),
      status: { $in: ['pending', 'approved'] }
    }).lean();

    const exists = !!(existingUser || existingEnrollment);

    return Response.json({
      exists,
      details: {
        userExists: !!existingUser,
        enrollmentExists: !!existingEnrollment,
        user: existingUser ? {
          _id: existingUser._id,
          userId: existingUser.userId,
          role: existingUser.role,
          isActive: existingUser.isActive,
          profileCompleted: existingUser.profileCompleted
        } : null,
        enrollment: existingEnrollment ? {
          _id: existingEnrollment._id,
          status: existingEnrollment.status,
          batchId: existingEnrollment.batchId
        } : null
      }
    });

  } catch (error) {
    console.error('Check email error:', error);
    return Response.json({
      error: {
        code: "INTERNAL",
        message: "An error occurred while checking email"
      }
    }, { status: 500 });
  }
}
