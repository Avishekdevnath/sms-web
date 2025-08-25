import { NextRequest } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { StudentProfile } from "@/models/StudentProfile";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";
import { generateNextUserId } from "@/lib/userid";
import { StudentBatchMembership } from "@/models/StudentBatchMembership";
import { StudentEnrollment } from "@/models/StudentEnrollment";

const approveSchema = z.object({
  enrollmentId: z.string().min(1),
  name: z.string().min(1).optional(),
  password: z.string().min(6).default("password123"),
});

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["admin", "manager"]);

    const body = await req.json();
    const input = approveSchema.parse(body);

    // Find the pending enrollment
    const enrollment = await StudentEnrollment.findById(input.enrollmentId)
      .populate('batchId', 'code title')
      .lean();

    if (!enrollment) {
      return Response.json({ 
        error: { code: "NOT_FOUND", message: "Enrollment not found" } 
      }, { status: 404 });
    }

    if (enrollment.status !== 'pending') {
      return Response.json({ 
        error: { code: "INVALID_STATUS", message: "Enrollment is not pending" } 
      }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: enrollment.email }).lean();
    if (existingUser) {
      return Response.json({ 
        error: { code: "CONFLICT.DUPLICATE", message: "User already exists with this email" } 
      }, { status: 409 });
    }

    // Generate user ID and hash password
    const userIdReadable = await generateNextUserId("student");
    const hash = await bcrypt.hash(input.password, 10);

    // Create the user
    const user = await User.create({
      userId: userIdReadable,
      email: enrollment.email,
      name: input.name || enrollment.email.split('@')[0],
      role: "student",
      password: hash,
      isActive: true,
      profileCompleted: false,
      mustChangePassword: true
    });

    // Create student profile
    await StudentProfile.create({
      userId: user._id,
      firstname: input.name || enrollment.email.split('@')[0],
      lastname: "",
      batch: [enrollment.batchId._id]
    });

    // Create batch membership
    await StudentBatchMembership.create({
      studentId: user._id,
      batchId: enrollment.batchId._id,
      status: "approved",
      joinedAt: new Date()
    });

    // Update enrollment status to approved
    await StudentEnrollment.findByIdAndUpdate(input.enrollmentId, {
      status: "approved"
    });

    return Response.json({ 
      success: true,
      message: "Student enrollment approved successfully",
      data: {
        _id: user._id,
        userId: user.userId,
        email: user.email,
        name: user.name,
        role: user.role,
        batch: enrollment.batchId
      }
    }, { status: 201 });

  } catch (err: unknown) {
    const isZod = typeof err === "object" && err !== null && "issues" in err;
    if (isZod) {
      return Response.json({ 
        error: { code: "VALIDATION.ERROR", details: (err as { issues: unknown }).issues } 
      }, { status: 400 });
    }
    
    console.error("Error approving enrollment:", err);
    return Response.json({ error: { code: "INTERNAL" } }, { status: 500 });
  }
}
