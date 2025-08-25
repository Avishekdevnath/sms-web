import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { StudentEnrollment } from "@/models/StudentEnrollment";
import { User } from "@/models/User";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";
import { validateEmail, sanitizeInput } from "@/lib/studentIdGenerator";

export async function POST(req: NextRequest) {
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
    requireRoles(me, ["admin", "developer", "manager"]);

    const body = await req.json();
    const { emails, batchId } = body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return Response.json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Emails array is required"
        }
      }, { status: 400 });
    }

    if (!batchId) {
      return Response.json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Batch ID is required"
        }
      }, { status: 400 });
    }

    const results = {
      total: emails.length,
      successful: 0,
      failed: 0,
      errors: [] as Array<{ email: string; reason: string }>,
      enrollments: [] as any[]
    };

    for (const emailData of emails) {
      try {
        const email = emailData.email || emailData;
        
        // Validate email
        if (!validateEmail(email)) {
          results.failed++;
          results.errors.push({ email, reason: "Invalid email format" });
          continue;
        }

        // Check if already enrolled
        const existingEnrollment = await StudentEnrollment.findOne({
          email: email.toLowerCase(),
          batchId
        }).lean();

        if (existingEnrollment) {
          results.failed++;
          results.errors.push({ email, reason: "Already enrolled in this batch" });
          continue;
        }

        // Check if user already exists
        const existingUser = await User.findOne({
          email: email.toLowerCase(),
          role: 'student'
        }).lean();

        if (existingUser) {
          results.failed++;
          results.errors.push({ email, reason: "User already exists as student" });
          continue;
        }

        // Create enrollment
        const enrollment = new StudentEnrollment({
          batchId,
          email: email.toLowerCase(),
          status: 'pending',
          enrolledBy: me._id,
          enrolledAt: new Date(),
          invitationStatus: 'pending'
        });

        await enrollment.save();
        
        results.successful++;
        results.enrollments.push({
          _id: enrollment._id,
          email: enrollment.email,
          status: enrollment.status
        });

      } catch (error) {
        console.error(`Error enrolling ${emailData.email || emailData}:`, error);
        results.failed++;
        results.errors.push({ 
          email: emailData.email || emailData, 
          reason: "Internal server error" 
        });
      }
    }

    return Response.json({
      success: true,
      message: `Enrollment completed. ${results.successful} successful, ${results.failed} failed.`,
      results
    });

  } catch (error) {
    console.error('Error in enrollment API:', error);
    return Response.json({
      error: {
        code: "INTERNAL",
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}

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

    // Build query
    const query: any = {};
    if (status && status !== "all") query.status = status;
    if (batchId) query.batchId = batchId;
    if (email) query.email = { $regex: email, $options: "i" };

    // Get total count
    const total = await StudentEnrollment.countDocuments(query);

    // Get enrollments with pagination
    const enrollments = await StudentEnrollment.find(query)
      .populate("batchId", "code title")
      .populate("userId", "name email studentId")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return Response.json({
      success: true,
      data: enrollments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching enrollments:', error);
    return Response.json({
      error: {
        code: "INTERNAL",
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}
