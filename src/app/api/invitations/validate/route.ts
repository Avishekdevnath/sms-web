import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { StudentEnrollment } from "@/models/StudentEnrollment";
import { User } from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    
    if (!token) {
      return Response.json({
        error: {
          code: "MISSING_TOKEN",
          message: "Invitation token is required"
        }
      }, { status: 400 });
    }

    // First check if there's a user with this invitation token
    let user = await User.findOne({ 
      invitationToken: token,
      inviteExpiresAt: { $gt: new Date() }
    }).lean();

    if (user) {
      return Response.json({
        success: true,
        invitation: {
          email: user.email,
          type: 'existing_user',
          expiresAt: user.inviteExpiresAt
        }
      });
    }

    // If no user found, check for pending enrollment
    const enrollment = await StudentEnrollment.findOne({ 
      invitationToken: token,
      inviteExpiresAt: { $gt: new Date() }
    }).lean();

    if (enrollment) {
      return Response.json({
        success: true,
        invitation: {
          email: enrollment.email,
          type: 'pending_enrollment',
          expiresAt: enrollment.inviteExpiresAt
        }
      });
    }

    // Token not found or expired
    return Response.json({
      error: {
        code: "INVALID_TOKEN",
        message: "Invalid or expired invitation token"
      }
    }, { status: 400 });

  } catch (error) {
    console.error('Error validating invitation:', error);
    return Response.json({
      error: {
        code: "INTERNAL",
        message: "An error occurred while validating the invitation"
      }
    }, { status: 500 });
  }
}
