import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { StudentEnrollment } from "@/models/StudentEnrollment";
import { StudentBatchMembership } from "@/models/StudentBatchMembership";
import { StudentProfile } from "@/models/StudentProfile";

export async function GET(req: NextRequest) {
  try {
    console.log('Debug: Starting debug endpoint');
    
    // Test database connection
    await connectToDatabase();
    console.log('Debug: Database connected successfully');
    
    const { searchParams } = new URL(req.url);
    const collection = searchParams.get("collection") || "all";
    
    console.log('Debug: Collection requested:', collection);

    let results = {};

    try {
      switch (collection) {
        case 'users':
          console.log('Debug: Querying User collection');
          const allUsersCase = await User.find({ role: "student" }).select("_id email name isActive createdAt").lean();
          console.log('Debug: Found users:', allUsersCase.length);
          
          const malformedUsersCase = allUsersCase.filter(u => !u.name || !u.email || u.name === "" || u.email === "");
          
          results = {
            collection: "User",
            totalStudents: allUsersCase.length,
            malformedUsers: malformedUsersCase.length,
            sampleUsers: allUsersCase.slice(0, 5),
            sampleMalformed: malformedUsersCase.slice(0, 5)
          };
          break;

        case 'enrollments':
          console.log('Debug: Querying StudentEnrollment collection');
          const allEnrollments = await StudentEnrollment.find({}).select("_id email status createdAt").lean();
          console.log('Debug: Found enrollments:', allEnrollments.length);
          
          const malformedEnrollmentsCase = allEnrollments.filter(e => !e.email || e.email === "");
          
          results = {
            collection: "StudentEnrollment",
            totalEnrollments: allEnrollments.length,
            malformedEnrollments: malformedEnrollmentsCase.length,
            sampleEnrollments: allEnrollments.slice(0, 5),
            sampleMalformed: malformedEnrollmentsCase.slice(0, 5)
          };
          break;

        case 'studentprofiles':
          console.log('Debug: Querying StudentProfile collection');
          const allProfiles = await StudentProfile.find({}).select("_id userId firstName lastName username phone completedAt").lean();
          console.log('Debug: Found profiles:', allProfiles.length);
          
          const malformedProfilesCase = allProfiles.filter(p => !p.firstName || !p.lastName || !p.username || !p.phone);
          
          results = {
            collection: "StudentProfile",
            totalProfiles: allProfiles.length,
            malformedProfiles: malformedProfilesCase.length,
            sampleProfiles: allProfiles.slice(0, 5),
            sampleMalformed: malformedProfilesCase.slice(0, 5)
          };
          break;

        case 'all':
        default:
          console.log('Debug: Querying all collections');
          
          const usersAll = await User.find({ role: "student" }).select("_id email name isActive createdAt").lean();
          const enrollmentsAll = await StudentEnrollment.find({}).select("_id email status createdAt").lean();
          const membershipsAll = await StudentBatchMembership.find({}).select("_id studentId batchId status").lean();
          
          const malformedUsersAll = usersAll.filter(u => !u.name || !u.email || u.name === "" || u.email === "");
          const malformedEnrollmentsAll = enrollmentsAll.filter(e => !e.email || e.email === "");
          
          results = {
            summary: {
              totalUsers: usersAll.length,
              totalEnrollments: enrollmentsAll.length,
              totalMemberships: membershipsAll.length,
              malformedUsers: malformedUsersAll.length,
              malformedEnrollments: malformedEnrollmentsAll.length
            },
            malformedData: {
              users: malformedUsersAll.slice(0, 5),
              enrollments: malformedEnrollmentsAll.slice(0, 5)
            }
          };
          break;
      }
      
      console.log('Debug: Query completed successfully');
      
    } catch (queryError) {
      console.error('Debug: Query error:', queryError);
      results = {
        error: 'Query failed',
        message: queryError.message,
        stack: queryError.stack
      };
    }

    return Response.json({ 
      success: true,
      collection,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Debug: Critical error:', error);
    return Response.json({ 
      error: { 
        code: "INTERNAL",
        message: error.message,
        stack: error.stack
      } 
    }, { status: 500 });
  }
}
