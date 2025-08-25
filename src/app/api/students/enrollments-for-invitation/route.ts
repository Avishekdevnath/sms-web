import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { StudentEnrollment } from "@/models/StudentEnrollment";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";
import { Types } from "mongoose";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["admin", "developer", "manager"]);

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const batchId = searchParams.get("batchId");
    const email = searchParams.get("email");

    // Build query - get enrollments that can be invited
    const query: any = {
      status: { $in: ["pending", "approved"] } // Only pending/approved enrollments
    };
    
    if (status && status !== "all") {
      if (status === "invited") {
        query.invitationStatus = "sent";
      } else if (status === "pending") {
        query.invitationStatus = { $ne: "sent" };
      } else if (status === "cancelled") {
        query.invitationStatus = "cancelled";
      }
    }
    
    if (batchId && batchId !== "all") {
      // Convert string batchId to ObjectId if it's a valid ObjectId
      if (Types.ObjectId.isValid(batchId)) {
        query.batchId = new Types.ObjectId(batchId);
      }
    }
    if (email) query.email = { $regex: email, $options: "i" };

    // Get total count
    const total = await StudentEnrollment.countDocuments(query);

         // Get enrollments with pagination
     const enrollments = await StudentEnrollment.find(query)
       .populate("batchId", "code title")
       .populate("userId", "passwordExpiresAt")
       .sort({ createdAt: -1 })
       .skip((page - 1) * limit)
       .limit(limit)
       .lean();

         // Transform data to match invitation format
     const transformedData = enrollments.map(enrollment => ({
       _id: enrollment._id,
       email: enrollment.email,
       status: enrollment.invitationStatus === "sent" ? "invited" : "pending",
       sentAt: enrollment.invitationSentAt,
       invitedBy: enrollment.enrolledBy || { name: "System", email: "system@example.com" },
       batchId: enrollment.batchId,
       resendCount: 0, // TODO: Add resend tracking
       createdAt: enrollment.createdAt,
       enrollmentId: enrollment._id,
       canBeInvited: enrollment.status === "pending" && enrollment.invitationStatus !== "sent",
       passwordExpiresAt: enrollment.userId?.passwordExpiresAt || null
     }));

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
    console.error('Error fetching enrollments for invitation:', error);
    return Response.json({
      error: {
        code: "INTERNAL",
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}
