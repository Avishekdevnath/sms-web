import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { StudentEnrollment } from "@/models/StudentEnrollment";
import { User } from "@/models/User";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";
import { validateEmail, sanitizeInput } from "@/lib/studentIdGenerator";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // Get authenticated user
    let me;
    try {
      me = await getAuthUserFromRequest(req);
    } catch (authError) {
      console.log('Enrollment API - Authentication error:', authError);
      return Response.json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required"
        }
      }, { status: 401 });
    }
    
    if (!me) {
      return Response.json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required"
        }
      }, { status: 401 });
    }
    
    // Check user roles
    try {
      requireRoles(me, ["admin", "developer", "manager"]);
    } catch (roleError) {
      console.log('Enrollment API - Role check failed:', roleError);
      return Response.json({
        error: {
          code: "FORBIDDEN",
          message: "Insufficient permissions"
        }
      }, { status: 403 });
    }

    const body = await req.json();
    console.log('Enrollment API - Request body:', body);
    const { emails, batchId } = body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      console.log('Enrollment API - Validation error: emails array is required');
      return Response.json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Emails array is required"
        }
      }, { status: 400 });
    }

    if (!batchId) {
      console.log('Enrollment API - Validation error: batchId is required');
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

    console.log('Enrollment API - Processing emails:', emails);
    console.log('Enrollment API - Batch ID:', batchId);
    
    for (const emailData of emails) {
      try {
        const email = emailData.email || emailData;
        console.log('Enrollment API - Processing email:', email);
        
        // Validate email
        if (!validateEmail(email)) {
          console.log('Enrollment API - Invalid email format:', email);
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
          console.log('Enrollment API - Already enrolled:', email);
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
          console.log('Enrollment API - User already exists:', email);
          results.failed++;
          results.errors.push({ email, reason: "User already exists as student" });
          continue;
        }

        // Create enrollment
        console.log('Enrollment API - Creating enrollment for:', email);
        const enrollment = new StudentEnrollment({
          batchId,
          email: email.toLowerCase(),
          status: 'pending',
          enrolledBy: me._id,
          enrolledAt: new Date(),
          invitationStatus: 'pending'
        });

        await enrollment.save();
        console.log('Enrollment API - Enrollment created successfully for:', email);
        
        results.successful++;
        results.enrollments.push({
          _id: enrollment._id,
          email: enrollment.email,
          status: enrollment.status
        });

      } catch (error) {
        console.error(`Enrollment API - Error enrolling ${emailData.email || emailData}:`, error);
        results.failed++;
        results.errors.push({ 
          email: emailData.email || emailData, 
          reason: "Internal server error" 
        });
      }
    }

    console.log('Enrollment API - Final results:', results);
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
    
    // Get authenticated user
    let me;
    try {
      me = await getAuthUserFromRequest(req);
    } catch (authError) {
      console.log('Enrollment API GET - Authentication error:', authError);
      return Response.json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required"
        }
      }, { status: 401 });
    }
    
    if (!me) {
      return Response.json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required"
        }
      }, { status: 401 });
    }
    
    // Check user roles
    try {
      requireRoles(me, ["admin", "developer", "manager"]);
    } catch (roleError) {
      console.log('Enrollment API GET - Role check failed:', roleError);
      return Response.json({
        error: {
          code: "FORBIDDEN",
          message: "Insufficient permissions"
        }
      }, { status: 403 });
    }

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
