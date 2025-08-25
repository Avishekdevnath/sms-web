import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Invitation, IInvitation } from "@/models/Invitation";
import { StudentEnrollment } from "@/models/StudentEnrollment";
import { User } from "@/models/User";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";
import { generateInvitationToken } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["admin", "developer", "manager"]);

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const email = searchParams.get("email");
    const batchId = searchParams.get("batchId");

    // Build query
    const query: any = {};
    if (status && status !== "all") query.status = status;
    if (email) query.email = { $regex: email, $options: "i" };
    if (batchId) query.batchId = batchId;

    // Get total count
    const total = await Invitation.countDocuments(query);

    // Get invitations with pagination
    const invitations = await Invitation.find(query)
      .populate("invitedBy", "name email")
      .populate("studentId", "email status")
      .populate("batchId", "code title")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return Response.json({
      success: true,
      data: invitations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching invitations:', error);
    return Response.json({ 
      error: { 
        code: "INTERNAL",
        message: error instanceof Error ? error.message : 'Unknown error'
      } 
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["admin", "developer", "manager"]);

    const body = await req.json();
    const { emails, batchId, courseId, message } = body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return Response.json({ 
        error: { 
          code: "VALIDATION_ERROR",
          message: "Emails array is required" 
        } 
      }, { status: 400 });
    }

    const invitations: Partial<IInvitation>[] = [];
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    for (const email of emails) {
      // Check if invitation already exists
      const existingInvitation = await Invitation.findOne({ 
        email: email.toLowerCase(),
        status: { $in: ["pending", "sent"] }
      });

      if (existingInvitation) {
        continue; // Skip if already invited
      }

      // Generate temporary credentials
      const tempUsername = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const tempPassword = Math.random().toString(36).substr(2, 8);

      const invitation: Partial<IInvitation> = {
        email: email.toLowerCase(),
        invitationToken: generateInvitationToken(),
        invitationExpiresAt: expiresAt,
        status: "pending",
        invitedBy: me._id,
        batchId: batchId || undefined,
        courseId: courseId || undefined,
        temporaryUsername: tempUsername,
        temporaryPassword: tempPassword,
        emailSent: false,
        resendCount: 0
      };

      invitations.push(invitation);
    }

    if (invitations.length === 0) {
      return Response.json({ 
        error: { 
          code: "NO_INVITATIONS",
          message: "No new invitations to send" 
        } 
      }, { status: 400 });
    }

    // Insert invitations
    const result = await Invitation.insertMany(invitations);

    // TODO: Send invitation emails here
    // For now, just mark as sent
    await Invitation.updateMany(
      { _id: { $in: result.map(r => r._id) } },
      { 
        status: "sent",
        emailSent: true,
        emailSentAt: new Date(),
        sentAt: new Date()
      }
    );

    return Response.json({
      success: true,
      message: `Successfully created ${result.length} invitations`,
      invitations: result.length
    });

  } catch (error) {
    console.error('Error creating invitations:', error);
    return Response.json({ 
      error: { 
        code: "INTERNAL",
        message: error instanceof Error ? error.message : 'Unknown error'
      } 
    }, { status: 500 });
  }
}
