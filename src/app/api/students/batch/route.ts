import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { StudentBatchMembership } from "@/models/StudentBatchMembership";
import { StudentMission } from "@/models/StudentMission"; // Add import for StudentMission
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // Check authentication and authorization
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["admin", "manager", "sre"]);

    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get("batchId");
    const excludeMissionId = searchParams.get("excludeMissionId"); // New parameter to exclude students from a specific mission

    if (!batchId) {
      return Response.json({ 
        error: { 
          code: "VALIDATION_ERROR", 
          message: "Batch ID is required" 
        } 
      }, { status: 400 });
    }

    // Get all approved student memberships for this batch
    const memberships = await StudentBatchMembership.find({ 
      batchId: batchId,
      status: "approved"
    }).populate('studentId', 'name email isActive profileCompleted role').lean();

    // Extract student data from memberships
    let students = memberships
      .map(membership => {
        const user = membership.studentId as any;
        if (!user || user.role !== 'student') return null;
        
        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          userId: user._id,
          isActive: user.isActive,
          profileCompleted: user.profileCompleted || false
        };
      })
      .filter(Boolean); // Remove null entries

    // If excludeMissionId is provided, filter out students already in that mission
    if (excludeMissionId) {
      const existingStudentMissions = await StudentMission.find({
        missionId: excludeMissionId,
        studentId: { $in: students.map(s => s._id) },
        status: { $ne: 'dropped' }
      }).lean();
      
      const existingStudentIds = existingStudentMissions.map(sm => sm.studentId.toString());
      console.log('Excluding students already in mission:', {
        missionId: excludeMissionId,
        existingStudentIds,
        totalStudents: students.length
      });
      students = students.filter(student => !existingStudentIds.includes(student._id));
      console.log('Students after filtering:', students.length);
    }

    return Response.json({ 
      success: true,
      data: students 
    });

  } catch (error) {
    console.error('Error fetching batch students:', error);
    return Response.json({ 
      error: { 
        code: "INTERNAL_ERROR", 
        message: "Failed to fetch batch students" 
      } 
    }, { status: 500 });
  }
} 