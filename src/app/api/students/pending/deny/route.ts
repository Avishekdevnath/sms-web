import { NextRequest } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { StudentEnrollment } from "@/models/StudentEnrollment";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";

const denySchema = z.object({
  enrollmentIds: z.array(z.string()).min(1, "At least one enrollment ID is required")
});

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["admin", "manager", "sre"]);

    const json = await req.json();
    const { enrollmentIds } = denySchema.parse(json);

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

        // Update enrollment status to removed
        enrollment.status = "removed";
        await enrollment.save();

        results.push({
          enrollmentId,
          email: enrollment.email,
          status: "denied"
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
      message: `Successfully denied ${results.length} enrollments`
    });

  } catch (error) {
    console.error('Deny enrollments error:', error);
    return Response.json({
      error: {
        code: "INTERNAL",
        message: "An error occurred while denying enrollments"
      }
    }, { status: 500 });
  }
} 