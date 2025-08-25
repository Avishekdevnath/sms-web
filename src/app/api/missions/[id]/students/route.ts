import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Mission } from "@/models/Mission";
import { User } from "@/models/User";
import { StudentBatchMembership } from "@/models/StudentBatchMembership";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    
    // Check authentication and authorization
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["admin", "manager", "sre"]);

    const { id: missionId } = await params;
    const { studentIds } = await req.json();

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return Response.json({ 
        error: { 
          code: "VALIDATION_ERROR", 
          message: "Student IDs array is required" 
        } 
      }, { status: 400 });
    }

    // Get the mission
    const mission = await Mission.findById(missionId);
    if (!mission) {
      return Response.json({ 
        error: { 
          code: "NOT_FOUND", 
          message: "Mission not found" 
        } 
      }, { status: 404 });
    }

    // Remove duplicates from the input array
    const uniqueStudentIds = [...new Set(studentIds)];
    if (uniqueStudentIds.length !== studentIds.length) {
      return Response.json({ 
        error: { 
          code: "VALIDATION_ERROR", 
          message: "Duplicate student IDs are not allowed" 
        } 
      }, { status: 400 });
    }

    // Verify all students belong to the mission's batch
    const batchMemberships = await StudentBatchMembership.find({
      studentId: { $in: uniqueStudentIds },
      batchId: mission.batchId,
      status: "approved"
    }).lean();

    const validStudentIds = batchMemberships.map(m => m.studentId.toString());
    const invalidStudentIds = uniqueStudentIds.filter(id => !validStudentIds.includes(id));

    if (invalidStudentIds.length > 0) {
      return Response.json({ 
        error: { 
          code: "VALIDATION_ERROR", 
          message: `Students ${invalidStudentIds.join(', ')} do not belong to this mission's batch` 
        } 
      }, { status: 400 });
    }

    // Check for existing students in the mission
    const existingStudentIds = mission.students.map(s => s.studentId.toString());
    const newStudentIds = uniqueStudentIds.filter(id => !existingStudentIds.includes(id));
    const duplicateStudentIds = uniqueStudentIds.filter(id => existingStudentIds.includes(id));

    if (newStudentIds.length === 0) {
      return Response.json({ 
        error: { 
          code: "VALIDATION_ERROR", 
          message: duplicateStudentIds.length > 0 
            ? `Students ${duplicateStudentIds.join(', ')} are already in this mission` 
            : "All selected students are already in this mission"
        } 
      }, { status: 400 });
    }

    // Get user details for new students
    const users = await User.find({ 
      _id: { $in: newStudentIds },
      role: 'student'
    }).lean();

    // Add new students to the mission
    const newStudents = newStudentIds.map(studentId => {
      const user = users.find(u => u._id.toString() === studentId);
      return {
        studentId: studentId,
        mentorId: null,
        status: 'active',
        progress: 0,
        startedAt: new Date(),
        courseProgress: []
      };
    });

    // Update the mission
    const updatedMission = await Mission.findByIdAndUpdate(
      missionId,
      {
        $push: { students: { $each: newStudents } }
      },
      { new: true }
    ).populate('students.studentId', 'name email')
     .populate('students.mentorId', 'name email')
     .lean();

    return Response.json({ 
      success: true,
      message: `Successfully added ${newStudents.length} student${newStudents.length !== 1 ? 's' : ''} to the mission`,
      data: {
        addedCount: newStudents.length,
        mission: updatedMission
      }
    });

  } catch (error) {
    console.error('Error adding students to mission:', error);
    return Response.json({ 
      error: { 
        code: "INTERNAL_ERROR", 
        message: "Failed to add students to mission" 
      } 
    }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    
    // Check authentication and authorization
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["admin", "manager", "sre"]);

    const { id: missionId } = await params;
    const { studentIds } = await req.json();

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return Response.json({ 
        error: { 
          code: "VALIDATION_ERROR", 
          message: "Student IDs array is required" 
        } 
      }, { status: 400 });
    }

    // Get the mission
    const mission = await Mission.findById(missionId);
    if (!mission) {
      return Response.json({ 
        error: { 
          code: "NOT_FOUND", 
          message: "Mission not found" 
        } 
      }, { status: 404 });
    }

    // Check if students exist in the mission
    const existingStudentIds = mission.students.map(s => s.studentId.toString());
    const validStudentIds = studentIds.filter(id => existingStudentIds.includes(id));

    if (validStudentIds.length === 0) {
      return Response.json({ 
        error: { 
          code: "VALIDATION_ERROR", 
          message: "None of the selected students are in this mission" 
        } 
      }, { status: 400 });
    }

    // Remove students from the mission
    const updatedMission = await Mission.findByIdAndUpdate(
      missionId,
      {
        $pull: { students: { studentId: { $in: validStudentIds } } }
      },
      { new: true }
    ).populate('students.studentId', 'name email')
     .populate('students.mentorId', 'name email')
     .lean();

    return Response.json({ 
      success: true,
      message: `Successfully removed ${validStudentIds.length} student${validStudentIds.length !== 1 ? 's' : ''} from the mission`,
      data: {
        removedCount: validStudentIds.length,
        mission: updatedMission
      }
    });

  } catch (error) {
    console.error('Error removing students from mission:', error);
    return Response.json({ 
      error: { 
        code: "INTERNAL_ERROR", 
        message: "Failed to remove students from mission" 
      } 
    }, { status: 500 });
  }
} 