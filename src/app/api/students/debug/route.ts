import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { StudentEnrollment } from "@/models/StudentEnrollment";
import { StudentBatchMembership } from "@/models/StudentBatchMembership";
import { StudentProfile } from "@/models/StudentProfile";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["admin"]); // Only admins can debug

    const { searchParams } = new URL(req.url);
    const collection = searchParams.get("collection") || "all";

    let results = {};

    switch (collection) {
      case 'users':
        // Examine User collection
        const allUsers = await User.find({ role: "student" }).select("_id email name isActive profileCompleted createdAt").lean();
        const usersWithoutNames = allUsers.filter(u => !u.name || u.name === "");
        const usersWithoutEmails = allUsers.filter(u => !u.email || u.email === "");
        const inactiveUsers = allUsers.filter(u => !u.isActive);
        
        results = {
          collection: "User",
          totalStudents: allUsers.length,
          usersWithoutNames: usersWithoutNames.length,
          usersWithoutEmails: usersWithoutEmails.length,
          inactiveUsers: inactiveUsers.length,
          sampleUsersWithoutNames: usersWithoutNames.slice(0, 5),
          sampleUsersWithoutEmails: usersWithoutEmails.slice(0, 5),
          sampleInactiveUsers: inactiveUsers.slice(0, 5),
          allUsersSample: allUsers.slice(0, 10)
        };
        break;

      case 'enrollments':
        // Examine StudentEnrollment collection
        const allEnrollments = await StudentEnrollment.find({}).select("_id email status batchId createdAt").lean();
        const enrollmentsWithoutEmails = allEnrollments.filter(e => !e.email || e.email === "");
        const pendingEnrollments = allEnrollments.filter(e => e.status === "pending");
        
        results = {
          collection: "StudentEnrollment",
          totalEnrollments: allEnrollments.length,
          enrollmentsWithoutEmails: enrollmentsWithoutEmails.length,
          pendingEnrollments: pendingEnrollments.length,
          sampleEnrollmentsWithoutEmails: enrollmentsWithoutEmails.slice(0, 5),
          samplePendingEnrollments: pendingEnrollments.slice(0, 5),
          allEnrollmentsSample: allEnrollments.slice(0, 10)
        };
        break;

      case 'memberships':
        // Examine StudentBatchMembership collection
        const allMemberships = await StudentBatchMembership.find({}).populate('studentId', 'email name').populate('batchId', 'code title').lean();
        const membershipsWithoutStudents = allMemberships.filter(m => !m.studentId);
        const membershipsWithoutBatches = allMemberships.filter(m => !m.batchId);
        
        results = {
          collection: "StudentBatchMembership",
          totalMemberships: allMemberships.length,
          membershipsWithoutStudents: membershipsWithoutStudents.length,
          membershipsWithoutBatches: membershipsWithoutBatches.length,
          sampleMembershipsWithoutStudents: membershipsWithoutStudents.slice(0, 5),
          sampleMembershipsWithoutBatches: membershipsWithoutBatches.slice(0, 5),
          allMembershipsSample: allMemberships.slice(0, 10)
        };
        break;

      case 'all':
      default:
        // Examine all collections
        const users = await User.find({ role: "student" }).select("_id email name isActive createdAt").lean();
        const enrollments = await StudentEnrollment.find({}).select("_id email status createdAt").lean();
        const memberships = await StudentBatchMembership.find({}).select("_id studentId batchId status").lean();
        
        const malformedUsers = users.filter(u => !u.name || !u.email || u.name === "" || u.email === "");
        const malformedEnrollments = enrollments.filter(e => !e.email || e.email === "");
        
        results = {
          summary: {
            totalUsers: users.length,
            totalEnrollments: enrollments.length,
            totalMemberships: memberships.length,
            malformedUsers: malformedUsers.length,
            malformedEnrollments: malformedEnrollments.length
          },
          collections: {
            users: {
              total: users.length,
              withNames: users.filter(u => u.name && u.name !== "").length,
              withEmails: users.filter(u => u.email && u.email !== "").length,
              active: users.filter(u => u.isActive).length,
              inactive: users.filter(u => !u.isActive).length
            },
            enrollments: {
              total: enrollments.length,
              withEmails: enrollments.filter(e => e.email && e.email !== "").length,
              pending: enrollments.filter(e => e.status === "pending").length,
              approved: enrollments.filter(e => e.status === "approved").length
            },
            memberships: {
              total: memberships.length,
              withStudents: memberships.filter(m => m.studentId).length,
              withBatches: memberships.filter(m => m.batchId).length
            }
          },
          malformedData: {
            users: malformedUsers.slice(0, 5),
            enrollments: malformedEnrollments.slice(0, 5)
          }
        };
        break;
    }

    return Response.json({ 
      success: true,
      collection,
      results
    });

  } catch (error) {
    console.error('Error in debug:', error);
    return Response.json({ error: { code: "INTERNAL" } }, { status: 500 });
  }
}
