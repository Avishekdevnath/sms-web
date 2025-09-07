import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { StudentMission } from "@/models/StudentMission";
import { Mission } from "@/models/Mission";
import { User } from "@/models/User";
import { StudentBatchMembership } from "@/models/StudentBatchMembership";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";

// Get all missions for a specific student
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // Check authentication and authorization
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["admin", "manager", "sre", "mentor", "student"]);

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const missionId = searchParams.get("missionId");

    if (studentId) {
      // Get all missions for a specific student
      const studentMissions = await StudentMission.find({ 
        studentId: studentId,
        status: { $ne: 'dropped' }
      })
      .populate('missionId', 'title code status')
      .populate('batchId', 'code title')
      .populate('mentorId', 'name email')
      .lean();

      return Response.json({ 
        success: true,
        data: studentMissions
      });
    }

    if (missionId) {
      // Get all students for a specific mission
      const studentMissions = await StudentMission.find({ 
        missionId: missionId,
        status: { $ne: 'dropped' }
      })
      .populate('studentId', 'name email userId')
      .populate('mentorId', 'name email')
      .lean();

      return Response.json({ 
        success: true,
        data: studentMissions
      });
    }

    return Response.json({ 
      error: { 
        code: "VALIDATION_ERROR", 
        message: "Either studentId or missionId is required" 
      } 
    }, { status: 400 });

  } catch (error) {
    console.error('Error fetching student missions:', error);
    return Response.json({ 
      error: { 
        code: "INTERNAL_ERROR", 
        message: "Failed to fetch student missions" 
      } 
    }, { status: 500 });
  }
}

// Enroll a student in a mission
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // Check authentication and authorization
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["admin", "manager", "sre"]);

    const { studentId, missionId } = await req.json();

    if (!studentId || !missionId) {
      return Response.json({ 
        error: { 
          code: "VALIDATION_ERROR", 
          message: "Student ID and Mission ID are required" 
        } 
      }, { status: 400 });
    }

    // Get the mission to verify batch
    const mission = await Mission.findById(missionId);
    if (!mission) {
      return Response.json({ 
        error: { 
          code: "NOT_FOUND", 
          message: "Mission not found" 
        } 
      }, { status: 404 });
    }

    // Verify student belongs to the mission's batch
    const batchMembership = await StudentBatchMembership.findOne({
      studentId: studentId,
      batchId: mission.batchId,
      status: "approved"
    });

    if (!batchMembership) {
      return Response.json({ 
        error: { 
          code: "VALIDATION_ERROR", 
          message: "Student does not belong to this mission's batch" 
        } 
      }, { status: 400 });
    }

    // Check if student is already enrolled
    const existingEnrollment = await StudentMission.findOne({
      studentId: studentId,
      missionId: missionId
    });

    if (existingEnrollment) {
      return Response.json({ 
        error: { 
          code: "VALIDATION_ERROR", 
          message: "Student is already enrolled in this mission" 
        } 
      }, { status: 400 });
    }

    // Create new student mission enrollment
    const studentMission = await StudentMission.create({
      studentId: studentId,
      missionId: missionId,
      batchId: mission.batchId,
      status: 'active',
      progress: 0,
      startedAt: new Date(),
      lastActivity: new Date(),
      courseProgress: []
    });

    // Populate the created record
    const populatedStudentMission = await StudentMission.findById(studentMission._id)
      .populate('studentId', 'name email userId')
      .populate('missionId', 'title code')
      .populate('batchId', 'code title')
      .lean();

    return Response.json({ 
      success: true,
      message: "Student successfully enrolled in mission",
      data: populatedStudentMission
    });

  } catch (error) {
    console.error('Error enrolling student in mission:', error);
    return Response.json({ 
      error: { 
        code: "INTERNAL_ERROR", 
        message: "Failed to enroll student in mission" 
      } 
    }, { status: 500 });
  }
}
