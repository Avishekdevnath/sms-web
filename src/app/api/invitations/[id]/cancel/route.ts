import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Invitation } from "@/models/Invitation";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["admin", "developer", "manager"]);

    const invitationId = params.id;

    // Find the invitation
    const invitation = await Invitation.findById(invitationId);
    if (!invitation) {
      return Response.json({ 
        error: { 
          code: "NOT_FOUND",
          message: "Invitation not found" 
        } 
      }, { status: 404 });
    }

    // Check if invitation can be cancelled
    if (invitation.status === "accepted") {
      return Response.json({ 
        error: { 
          code: "INVALID_STATUS",
          message: "Cannot cancel accepted invitations" 
        } 
      }, { status: 400 });
    }

    // Update invitation
    await Invitation.findByIdAndUpdate(invitationId, {
      status: "cancelled",
      cancelledAt: new Date(),
      cancelledBy: me._id
    });

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
