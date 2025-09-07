import { NextRequest } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { StudentEnrollment } from "@/models/StudentEnrollment";
import { StudentBatchMembership } from "@/models/StudentBatchMembership";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";
import { generateNextUserId } from "@/lib/userid";

const approveSchema = z.object({
  enrollmentIds: z.array(z.string()).min(1, "At least one enrollment ID is required")
});

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["admin", "manager", "sre"]);

    const json = await req.json();
    const { enrollmentIds } = approveSchema.parse(json);

    const results = [];
    const errors = [];

    for (const enrollmentId of enrollmentIds) {
      try {
        // Find the enrollment
        const enrollment = await StudentEnrollment.findById(enrollmentId);
        if (!enrollment) {
          errors.push(`Enrollment ${enrollmentId} not found`);
          continue;
        }

        if (enrollment.status !== "pending") {
          errors.push(`Enrollment ${enrollmentId} is not pending`);
          continue;
        }

        // Check if user already exists
        let user = await User.findOne({ email: enrollment.email });
        
        if (!user) {
          // Generate temporary password
          const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
          const hashedPassword = await bcrypt.hash(tempPassword, 12);
          
          // Generate user ID
          const userId = await generateNextUserId("student");
          
          // Create new user
          user = new User({
            email: enrollment.email,
            password: hashedPassword,
            role: "student",
            name: enrollment.email.split('@')[0], // Temporary name
            isActive: false,
            profileCompleted: false,
            mustChangePassword: true,
            passwordExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days expiry
            userId
          });
          
          await user.save();
        }

        // Create or update batch membership
        const membership = await StudentBatchMembership.findOneAndUpdate(
          { studentId: user._id, batchId: enrollment.batchId },
          { 
            status: "approved",
            joinedAt: new Date()
          },
          { upsert: true, new: true }
        );

        // Update enrollment status
        enrollment.status = "approved";
        await enrollment.save();

        results.push({
          enrollmentId,
          userId: user._id,
          email: enrollment.email,
          status: "approved"
        });

      } catch (error) {
        console.error(`Error processing enrollment ${enrollmentId}:`, error);
        errors.push(`Failed to process enrollment ${enrollmentId}: ${error.message}`);
      }
    }

    return Response.json({
      success: true,
      results,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully approved ${results.length} enrollments`
    });

  } catch (error) {
    console.error('Approve enrollments error:', error);
    return Response.json({
      error: {
        code: "INTERNAL",
        message: "An error occurred while approving enrollments"
      }
    }, { status: 500 });
  }
} 