import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { StudentEnrollment } from "@/models/StudentEnrollment";
import { User } from "@/models/User";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["admin", "developer", "manager"]);

    const body = await req.json();
    const { enrollmentId } = body;

    if (!enrollmentId) {
      return Response.json({ 
        error: { 
          code: "VALIDATION_ERROR",
          message: "Enrollment ID is required" 
        } 
      }, { status: 400 });
    }

             // Find the enrollment
         const enrollment = await StudentEnrollment.findById(enrollmentId);
         


         // If there's a temporary user account, delete it
         if (enrollment.userId) {
           await User.findByIdAndDelete(enrollment.userId);
         }

         // Update enrollment
         await StudentEnrollment.findByIdAndUpdate(
           enrollmentId,
           {
             invitationStatus: "cancelled",
             userId: null
           }
         );

    if (!enrollment) {
      return Response.json({ 
        error: { 
          code: "NOT_FOUND",
          message: "Enrollment not found" 
        } 
      }, { status: 404 });
    }

    return Response.json({
      success: true,
      message: "Invitation cancelled successfully"
    });

  } catch (error) {
    console.error('Error cancelling invitation:', error);
    return Response.json({
      error: {
        code: "INTERNAL",
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}
