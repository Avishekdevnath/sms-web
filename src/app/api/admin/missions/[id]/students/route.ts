import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Mission } from "@/models/Mission";
import { User } from "@/models/User";
import { StudentBatchMembership } from "@/models/StudentBatchMembership";
import { StudentMission } from "@/models/StudentMission"; // Added import for StudentMission
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    
    // Check authentication and authorization
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["admin", "manager", "sre"]);

    const { id: missionId } = await params;

    // Get the mission details
    const mission = await Mission.findById(missionId)
      .populate('batchId', 'code title')
      .lean();

    if (!mission) {
      return Response.json({ 
        error: { 
          code: "NOT_FOUND", 
          message: "Mission not found" 
        } 
      }, { status: 404 });
    }

    // Get students enrolled in this mission using StudentMission model
    const studentMissions = await StudentMission.find({ 
      missionId: missionId,
      status: { $ne: 'dropped' } // Exclude dropped students
    })
    .populate('studentId', 'name email userId')
    .populate('mentorId', 'name email')
    .lean();

    console.log('StudentMission query result:', {
      missionId,
      query: { missionId: missionId, status: { $ne: 'dropped' } },
      foundCount: studentMissions.length,
      results: studentMissions
    });

    // Check if there are any StudentMission records at all
    const totalStudentMissions = await StudentMission.countDocuments({});
    const missionStudentMissions = await StudentMission.countDocuments({ missionId: missionId });
    console.log('Database stats:', {
      totalStudentMissions,
      missionStudentMissions,
      missionId
    });

    // Transform the data to match the expected format
    const students = studentMissions.map(sm => ({
      _id: sm._id,
      studentId: sm.studentId,
      mentorId: sm.mentorId,
      status: sm.status,
      progress: sm.progress,
      startedAt: sm.startedAt,
      completedAt: sm.completedAt,
      courseProgress: sm.courseProgress || []
    }));

    // Debug: Check if this mission has all batch students
    const { searchParams } = new URL(req.url);
    const debug = searchParams.get("debug");
    
    if (debug === "true") {
      // Get all students from the batch to compare
      const batchStudents = await StudentBatchMembership.find({
        batchId: mission.batchId,
        status: "approved"
      }).populate('studentId', 'name email').lean();
      
      const batchStudentIds = batchStudents.map(bs => bs.studentId._id.toString());
      const missionStudentIds = students.map(ms => ms.studentId._id.toString());
      
      // Also check all StudentMission records for this mission
      const allStudentMissions = await StudentMission.find({ missionId: missionId }).lean();
      
      // Check Mission model's embedded students
      const missionDoc = await Mission.findById(missionId).lean();
      const embeddedStudents = missionDoc?.students || [];
      
      return Response.json({ 
        success: true,
        debug: {
          missionId: mission._id,
          batchId: mission.batchId,
          missionStudentsCount: students.length,
          batchStudentsCount: batchStudents.length,
          missionStudentIds,
          batchStudentIds,
          hasAllBatchStudents: missionStudentIds.length === batchStudents.length && 
            missionStudentIds.every(id => batchStudentIds.includes(id)),
          allStudentMissions: allStudentMissions,
          allStudentMissionsCount: allStudentMissions.length,
          embeddedStudents: embeddedStudents,
          embeddedStudentsCount: embeddedStudents.length,
          dataSource: embeddedStudents.length > 0 ? 'Mission Model (Embedded)' : 'StudentMission Collection'
        },
        data: {
          missionId: mission._id,
          students: students,
          totalStudents: students.length
        }
      });
    }

    // Return only the students who are actually enrolled in this mission
    return Response.json({ 
      success: true,
      data: {
        missionId: mission._id,
        students: students,
        totalStudents: students.length
      }
    });

  } catch (error) {
    console.error('Error fetching mission students:', error);
    return Response.json({ 
      error: { 
        code: "INTERNAL_ERROR", 
        message: "Failed to fetch mission students" 
      } 
    }, { status: 500 });
  }
}

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

    // Check for existing students in this specific mission using StudentMission model
    const existingStudentMissions = await StudentMission.find({
      missionId: missionId,
      studentId: { $in: uniqueStudentIds }
    }).lean();

    const existingStudentIds = existingStudentMissions.map(sm => sm.studentId.toString());
    const newStudentIds = uniqueStudentIds.filter(id => !existingStudentIds.includes(id));
    const duplicateStudentIds = uniqueStudentIds.filter(id => existingStudentIds.includes(id));

    if (newStudentIds.length === 0) {
      return Response.json({ 
        error: { 
          code: "VALIDATION_ERROR", 
          message: duplicateStudentIds.length > 0 
            ? `Students ${duplicateStudentIds.join(', ')} are already enrolled in this mission` 
            : "All selected students are already enrolled in this mission"
        } 
      }, { status: 400 });
    }

    // Get user details for new students
    const users = await User.find({ 
      _id: { $in: newStudentIds },
      role: 'student'
    }).lean();

    // Create new StudentMission records for each student
    const newStudentMissions = newStudentIds.map(studentId => {
      const user = users.find(u => u._id.toString() === studentId);
      return {
        studentId: studentId,
        missionId: missionId,
        batchId: mission.batchId,
        mentorId: null, // Will be assigned later if needed
        status: 'active',
        progress: 0,
        startedAt: new Date(),
        lastActivity: new Date(),
        courseProgress: []
      };
    });

    // Insert new StudentMission records
    const createdStudentMissions = await StudentMission.insertMany(newStudentMissions);

    // Get the updated list of students for this mission
    const updatedStudentMissions = await StudentMission.find({ 
      missionId: missionId,
      status: { $ne: 'dropped' }
    })
    .populate('studentId', 'name email userId')
    .populate('mentorId', 'name email')
    .lean();

    // Transform the data to match the expected format
    const students = updatedStudentMissions.map(sm => ({
      _id: sm._id,
      studentId: sm.studentId,
      mentorId: sm.mentorId,
      status: sm.status,
      progress: sm.progress,
      startedAt: sm.startedAt,
      completedAt: sm.completedAt,
      courseProgress: sm.courseProgress || []
    }));

    return Response.json({ 
      success: true,
      message: `Successfully enrolled ${newStudentMissions.length} student${newStudentMissions.length !== 1 ? 's' : ''} in the mission`,
      data: {
        addedCount: newStudentMissions.length,
        students: students,
        totalStudents: students.length
      }
    });

  } catch (error) {
    console.error('Error enrolling students in mission:', error);
    return Response.json({ 
      error: { 
        code: "INTERNAL_ERROR", 
        message: "Failed to enroll students in mission" 
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

    // Check if students exist in this specific mission using StudentMission model
    const existingStudentMissions = await StudentMission.find({
      missionId: missionId,
      studentId: { $in: studentIds }
    }).lean();

    const validStudentIds = existingStudentMissions.map(sm => sm.studentId.toString());
    const invalidStudentIds = studentIds.filter(id => !validStudentIds.includes(id));

    if (validStudentIds.length === 0) {
      return Response.json({ 
        error: { 
          code: "VALIDATION_ERROR", 
          message: "None of the selected students are enrolled in this mission" 
        } 
      }, { status: 400 });
    }

    if (invalidStudentIds.length > 0) {
      console.log(`Warning: Some student IDs were not found in this mission: ${invalidStudentIds.join(', ')}`);
    }

    // Remove students from the mission by updating StudentMission records
    // We'll mark them as 'dropped' instead of deleting to maintain history
    const updatedStudentMissions = await StudentMission.updateMany(
      {
        missionId: missionId,
        studentId: { $in: validStudentIds }
      },
      {
        $set: { 
          status: 'dropped',
          lastActivity: new Date()
        }
      }
    );

    // Get the updated list of active students for this mission
    const remainingStudentMissions = await StudentMission.find({ 
      missionId: missionId,
      status: { $ne: 'dropped' }
    })
    .populate('studentId', 'name email userId')
    .populate('mentorId', 'name email')
    .lean();

    // Transform the data to match the expected format
    const students = remainingStudentMissions.map(sm => ({
      _id: sm._id,
      studentId: sm.studentId,
      mentorId: sm.mentorId,
      status: sm.status,
      progress: sm.progress,
      startedAt: sm.startedAt,
      completedAt: sm.completedAt,
      courseProgress: sm.courseProgress || []
    }));

    return Response.json({ 
      success: true,
      message: `Successfully removed ${validStudentIds.length} student${validStudentIds.length !== 1 ? 's' : ''} from the mission`,
      data: {
        removedCount: validStudentIds.length,
        students: students,
        totalStudents: students.length
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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    
    // Check authentication and authorization
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["admin", "manager", "sre"]);

    const { id: missionId } = await params;
    const { action } = await req.json();

    if (action === 'clear') {
      // Mark all students as 'dropped' instead of deleting to maintain history
      const updatedStudentMissions = await StudentMission.updateMany(
        { missionId: missionId },
        { 
          $set: { 
            status: 'dropped',
            lastActivity: new Date()
          } 
        }
      );

      return Response.json({ 
        success: true,
        message: `All students cleared from mission (marked as dropped)`,
        data: {
          updatedCount: updatedStudentMissions.modifiedCount
        }
      });
    }

    if (action === 'fix') {
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

      // Get all students from the batch
      const batchStudents = await StudentBatchMembership.find({
        batchId: mission.batchId,
        status: "approved"
      }).lean();
      
      const batchStudentIds = batchStudents.map(bs => bs.studentId.toString());
      
      // Get all StudentMission records for this mission
      const missionStudentMissions = await StudentMission.find({
        missionId: missionId
      }).lean();
      
      const missionStudentIds = missionStudentMissions.map(sm => sm.studentId.toString());
      
      // Find students in mission who are not in batch (these should be marked as dropped)
      const invalidStudentIds = missionStudentIds.filter(id => !batchStudentIds.includes(id));
      
      if (invalidStudentIds.length > 0) {
        // Mark invalid students as dropped
        await StudentMission.updateMany(
          {
            missionId: missionId,
            studentId: { $in: invalidStudentIds }
          },
          {
            $set: { 
              status: 'dropped',
              lastActivity: new Date()
            }
          }
        );

        return Response.json({ 
          success: true,
          message: `Fixed mission by marking ${invalidStudentIds.length} invalid students as dropped`,
          data: {
            removedCount: invalidStudentIds.length
          }
        });
      } else {
        return Response.json({ 
          success: true,
          message: "Mission is already correct - no invalid students found",
          data: {
            removedCount: 0
          }
        });
      }
    }

    if (action === 'sync') {
      // Sync students from Mission model's embedded array to StudentMission collection
      const mission = await Mission.findById(missionId);
      if (!mission) {
        return Response.json({ 
          error: { 
            code: "NOT_FOUND", 
            message: "Mission not found" 
          } 
        }, { status: 404 });
      }

      let syncedCount = 0;
      let errors = [];

      // Check if mission has embedded students
      if (mission.students && mission.students.length > 0) {
        console.log(`Found ${mission.students.length} students in Mission model's embedded array`);
        
        for (const embeddedStudent of mission.students) {
          try {
            // Check if StudentMission record already exists
            const existingRecord = await StudentMission.findOne({
              missionId: missionId,
              studentId: embeddedStudent.studentId
            });

            if (!existingRecord) {
              // Create new StudentMission record
              await StudentMission.create({
                studentId: embeddedStudent.studentId,
                missionId: missionId,
                batchId: mission.batchId,
                mentorId: embeddedStudent.primaryMentorId || null,
                status: embeddedStudent.status || 'active',
                progress: embeddedStudent.progress || 0,
                startedAt: embeddedStudent.startedAt || new Date(),
                lastActivity: new Date(),
                courseProgress: embeddedStudent.courseProgress || []
              });
              syncedCount++;
            }
          } catch (error) {
            console.error('Error syncing student:', error);
            errors.push(`Failed to sync student ${embeddedStudent.studentId}: ${error.message}`);
          }
        }
      }

      return Response.json({ 
        success: true,
        message: `Synced ${syncedCount} students from Mission model to StudentMission collection`,
        data: {
          syncedCount,
          totalEmbeddedStudents: mission.students?.length || 0,
          errors: errors.length > 0 ? errors : undefined
        }
      });
    }

    return Response.json({ 
      error: { 
        code: "VALIDATION_ERROR", 
        message: "Invalid action. Use 'clear' to remove all students or 'fix' to fix invalid students." 
      } 
    }, { status: 400 });

  } catch (error) {
    console.error('Error updating mission students:', error);
    return Response.json({ 
      error: { 
        code: "INTERNAL_ERROR", 
        message: "Failed to update mission students" 
      } 
    }, { status: 500 });
  }
} 

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    
    // Check authentication and authorization
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["admin", "manager", "sre"]);

    const { id: missionId } = await params;
    const { studentId, status, progress } = await req.json();

    if (!studentId) {
      return Response.json({ 
        error: { 
          code: "VALIDATION_ERROR", 
          message: "Student ID is required" 
        } 
      }, { status: 400 });
    }

    if (!status || !['active', 'completed', 'failed', 'dropped'].includes(status)) {
      return Response.json({ 
        error: { 
          code: "VALIDATION_ERROR", 
          message: "Valid status is required (active, completed, failed, dropped)" 
        } 
      }, { status: 400 });
    }

    // Check if the student is enrolled in this mission
    const studentMission = await StudentMission.findOne({
      missionId: missionId,
      studentId: studentId
    });

    if (!studentMission) {
      return Response.json({ 
        error: { 
          code: "NOT_FOUND", 
          message: "Student is not enrolled in this mission" 
        } 
      }, { status: 404 });
    }

    // Update the student's status and progress
    const updateData: any = {
      status: status,
      lastActivity: new Date()
    };

    if (progress !== undefined) {
      updateData.progress = Math.max(0, Math.min(100, progress));
    }

    if (status === 'completed') {
      updateData.completedAt = new Date();
    } else if (status === 'dropped') {
      updateData.droppedAt = new Date();
    }

    await StudentMission.findByIdAndUpdate(studentMission._id, updateData);

    // Get the updated student mission record
    const updatedStudentMission = await StudentMission.findById(studentMission._id)
      .populate('studentId', 'name email userId')
      .populate('mentorId', 'name email')
      .lean();

    // Transform the data to match the expected format
    const student = {
      _id: updatedStudentMission._id,
      studentId: updatedStudentMission.studentId,
      mentorId: updatedStudentMission.mentorId,
      status: updatedStudentMission.status,
      progress: updatedStudentMission.progress,
      startedAt: updatedStudentMission.startedAt,
      completedAt: updatedStudentMission.completedAt,
      courseProgress: updatedStudentMission.courseProgress || []
    };

    return Response.json({ 
      success: true,
      message: `Student status updated to ${status}`,
      data: {
        student: student
      }
    });

  } catch (error) {
    console.error('Error updating student status:', error);
    return Response.json({ 
      error: { 
        code: "INTERNAL_ERROR", 
        message: "Failed to update student status" 
      } 
    }, { status: 500 });
  }
} 