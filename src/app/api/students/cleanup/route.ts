import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { StudentEnrollment } from "@/models/StudentEnrollment";
import { StudentBatchMembership } from "@/models/StudentBatchMembership";
import { StudentProfile } from "@/models/StudentProfile";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["admin"]); // Only admins can cleanup

    const body = await req.json();
    const { action, dryRun = true } = body;

    if (!action) {
      return Response.json({ 
        error: { code: "VALIDATION.ERROR", message: "Action is required" } 
      }, { status: 400 });
    }

    let results = {};

    switch (action) {
      case 'find-malformed':
        // Find all malformed records
        const malformedUsers = await User.find({
          role: "student",
          $or: [
            { name: { $exists: false } },
            { name: null },
            { name: "" },
            { email: { $exists: false } },
            { email: null },
            { email: "" }
          ]
        }).select("_id email name createdAt").lean();

        const malformedEnrollments = await StudentEnrollment.find({
          $or: [
            { email: { $exists: false } },
            { email: null },
            { email: "" }
          ]
        }).select("_id email createdAt").lean();

        results = {
          malformedUsers: malformedUsers.length,
          malformedEnrollments: malformedEnrollments.length,
          sampleUsers: malformedUsers.slice(0, 5),
          sampleEnrollments: malformedEnrollments.slice(0, 5)
        };
        break;

      case 'delete-malformed-users':
        if (dryRun) {
          // Count what would be deleted
          const count = await User.countDocuments({
            role: "student",
            $or: [
              { name: { $exists: false } },
              { name: null },
              { name: "" },
              { email: { $exists: false } },
              { email: null },
              { email: "" }
            ]
          });
          results = { wouldDelete: count, dryRun: true };
        } else {
          // Actually delete malformed users
          const deleteResult = await User.deleteMany({
            role: "student",
            $or: [
              { name: { $exists: false } },
              { name: null },
              { name: "" },
              { email: { $exists: false } },
              { email: null },
              { email: "" }
            ]
          });
          results = { deleted: deleteResult.deletedCount, dryRun: false };
        }
        break;

      case 'delete-malformed-enrollments':
        if (dryRun) {
          // Count what would be deleted
          const count = await StudentEnrollment.countDocuments({
            $or: [
              { email: { $exists: false } },
              { email: null },
              { email: "" }
            ]
          });
          results = { wouldDelete: count, dryRun: true };
        } else {
          // Actually delete malformed enrollments
          const deleteResult = await StudentEnrollment.deleteMany({
            $or: [
              { email: { $exists: false } },
              { email: null },
              { email: "" }
            ]
          });
          results = { deleted: deleteResult.deletedCount, dryRun: false };
        }
        break;

      case 'cleanup-all':
        if (dryRun) {
          // Count all malformed records
          const userCount = await User.countDocuments({
            role: "student",
            $or: [
              { name: { $exists: false } },
              { name: null },
              { name: "" },
              { email: { $exists: false } },
              { email: null },
              { email: "" }
            ]
          });
          const enrollmentCount = await StudentEnrollment.countDocuments({
            $or: [
              { email: { $exists: false } },
              { email: null },
              { email: "" }
            ]
          });
          results = { 
            wouldDeleteUsers: userCount, 
            wouldDeleteEnrollments: enrollmentCount, 
            dryRun: true 
          };
        } else {
          // Delete all malformed records
          const userResult = await User.deleteMany({
            role: "student",
            $or: [
              { name: { $exists: false } },
              { name: null },
              { name: "" },
              { email: { $exists: false } },
              { email: null },
              { email: "" }
            ]
          });
          const enrollmentResult = await StudentEnrollment.deleteMany({
            $or: [
              { email: { $exists: false } },
              { email: null },
              { email: "" }
            ]
          });
          results = { 
            deletedUsers: userResult.deletedCount, 
            deletedEnrollments: enrollmentResult.deletedCount, 
            dryRun: false 
          };
        }
        break;

      default:
        return Response.json({ 
          error: { code: "VALIDATION.ERROR", message: "Invalid action" } 
        }, { status: 400 });
    }

    return Response.json({ 
      success: true,
      action,
      dryRun,
      results
    });

  } catch (error) {
    console.error('Error in cleanup:', error);
    return Response.json({ error: { code: "INTERNAL" } }, { status: 500 });
  }
}
