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

    // Check if invitation can be resent
    if (invitation.status === "accepted" || invitation.status === "cancelled") {
      return Response.json({ 
        error: { 
          code: "INVALID_STATUS",
          message: "Cannot resend accepted or cancelled invitations" 
        } 
      }, { status: 400 });
    }

    if (invitation.resendCount >= 3) {
      return Response.json({ 
        error: { 
          code: "MAX_RESENDS",
          message: "Maximum resend limit reached" 
        } 
      }, { status: 400 });
    }

    // Update invitation
    await Invitation.findByIdAndUpdate(invitationId, {
      $inc: { resendCount: 1 },
      lastResentAt: new Date(),
      status: "sent",
      emailSent: true,
      emailSentAt: new Date()
    });

    // TODO: Send invitation email here
    // For now, just mark as sent

    return Response.json({
      success: true,
      message: "Invitation resent successfully"
    });

  } catch (error) {
    console.error('Error resending invitation:', error);
    return Response.json({ 
      error: { 
        code: "INTERNAL",
        message: error instanceof Error ? error.message : 'Unknown error'
      } 
    }, { status: 500 });
  }
}
