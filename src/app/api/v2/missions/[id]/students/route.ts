import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MissionV2, MissionStudentV2 } from '@/models/v2';
import { User, StudentProfile, StudentBatchMembership } from '@/models';

// GET: Get all students enrolled in a specific mission
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id: missionId } = await params;
    const { searchParams } = new URL(request.url);
    const debug = searchParams.get('debug');

    // Verify mission exists
    const mission = await MissionV2.findById(missionId);
    if (!mission) {
      return NextResponse.json(
        { success: false, error: 'Mission not found' },
        { status: 404 }
      );
    }

    // Check if we should include all batch students
    const includeBatchStudents = searchParams.get('includeBatchStudents') === 'true';

    let students = [];

    if (includeBatchStudents) {
      // Get all students from the mission's batch
      const batchStudents = await StudentBatchMembership.find({
        batchId: mission.batchId,
        status: 'approved'
      })
      .populate('studentId', 'name email studentId')
      .populate('batchId', 'code title')
      .lean();

      // Transform batch students to match frontend expectations
      students = batchStudents.map(bs => {
        // Check if this student is enrolled in the mission
        const missionStudent = null; // Will be populated below
        
        return {
          _id: `batch_${bs._id}`, // Use batch membership ID as unique identifier
          studentId: bs.studentId._id,
          missionId: missionId,
          status: 'active', // Default status for batch students
          enrollmentDate: bs.joinedAt,
          progress: 0, // Default progress
          isBatchStudent: true, // Flag to indicate this is a batch student
          student: {
            _id: bs.studentId._id,
            name: bs.studentId.name,
            email: bs.studentId.email,
            studentId: bs.studentId.studentId,
            batchId: bs.batchId ? {
              _id: bs.batchId._id,
              code: bs.batchId.code,
              name: bs.batchId.title
            } : null
          }
        };
      });

      // Get mission students to mark which ones are enrolled
      const missionStudents = await MissionStudentV2.find({ missionId })
        .populate('studentId', 'name email studentId')
        .populate('batchId', 'code title')
        .lean();

      // Update students with mission enrollment info
      students = students.map(student => {
        const missionStudent = missionStudents.find(ms => 
          ms.studentId._id.toString() === student.studentId.toString()
        );
        
        if (missionStudent) {
          return {
            ...student,
            _id: missionStudent._id, // Use mission student ID
            status: missionStudent.status,
            enrollmentDate: missionStudent.startedAt,
            progress: missionStudent.progress,
            isBatchStudent: false, // This student is enrolled in mission
            isMissionEnrolled: true
          };
        }
        
        return {
          ...student,
          isMissionEnrolled: false
        };
      });
    } else {
      // Get only mission students (original behavior)
      const missionStudents = await MissionStudentV2.find({ missionId })
        .populate('studentId', 'name email studentId')
        .populate('batchId', 'code title')
        .lean();

      // Transform to match frontend expectations
      students = missionStudents.map(ms => ({
        _id: ms._id,
        studentId: ms.studentId._id,
        missionId: ms.missionId,
        status: ms.status,
        enrollmentDate: ms.startedAt,
        progress: ms.progress,
        isMissionEnrolled: true,
        student: {
          _id: ms.studentId._id,
          name: ms.studentId.name,
          email: ms.studentId.email,
          studentId: ms.studentId.studentId,
          batchId: ms.batchId ? {
            _id: ms.batchId._id,
            code: ms.batchId.code,
            name: ms.batchId.title
          } : null
        }
      }));
    }

    // Debug mode
    if (debug === 'true') {
      const batchStudents = await StudentBatchMembership.find({
        batchId: mission.batchId,
        status: 'approved'
      }).populate('studentId', 'name email').lean();
      
      return NextResponse.json({
        success: true,
        debug: {
          missionId: mission._id,
          batchId: mission.batchId,
          missionStudentsCount: students.length,
          batchStudentsCount: batchStudents.length,
          missionStudentIds: students.map(s => s.studentId),
          batchStudentIds: batchStudents.map(bs => bs.studentId._id),
          hasAllBatchStudents: students.length === batchStudents.length,
          allStudentMissionsCount: students.length,
          dataSource: 'MissionStudentV2 Collection (v2)'
        },
        students
      });
    }

    return NextResponse.json({
      success: true,
      students
    });

  } catch (error) {
    console.error('Error fetching mission students:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch mission students' },
      { status: 500 }
    );
  }
}

// POST: Add students to a mission
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id: missionId } = await params;

    // Verify mission exists
    const mission = await MissionV2.findById(missionId);
    if (!mission) {
      return NextResponse.json(
        { success: false, error: 'Mission not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { studentIds } = body;

    if (!studentIds || !Array.isArray(studentIds)) {
      return NextResponse.json(
        { success: false, error: 'studentIds array is required' },
        { status: 400 }
      );
    }

    // Get student details and batch memberships
    const students = await User.find({ 
      _id: { $in: studentIds },
      role: 'student',
      isActive: true
    }).lean();

    if (students.length !== studentIds.length) {
      return NextResponse.json(
        { success: false, error: 'Some students not found or inactive' },
        { status: 400 }
      );
    }

    // Get batch memberships for these students
    const batchMemberships = await StudentBatchMembership.find({
      studentId: { $in: studentIds },
      status: 'approved'
    }).populate('batchId', 'code title').lean();

    // Check for existing mission enrollments
    const existingEnrollments = await MissionStudentV2.find({
      studentId: { $in: studentIds },
      missionId
    });

    if (existingEnrollments.length > 0) {
      const existingStudentIds = existingEnrollments.map(e => e.studentId.toString());
      return NextResponse.json(
        { 
          success: false, 
          error: 'Some students are already enrolled in this mission',
          existingStudentIds 
        },
        { status: 400 }
      );
    }

    // Create mission student enrollments
    const enrollments = students.map(student => {
      const batchMembership = batchMemberships.find(bm => 
        bm.studentId.toString() === student._id.toString()
      );

      if (!batchMembership) {
        throw new Error(`Student ${student.name} is not assigned to any batch`);
      }

      return {
        studentId: student._id,
        missionId,
        batchId: batchMembership.batchId._id,
        status: 'active' as const,
        progress: 0,
        startedAt: new Date(),
        lastActivity: new Date(),
        isRegular: true,
        attendanceRate: 100
      };
    });

    const createdEnrollments = await MissionStudentV2.insertMany(enrollments);

    // Update mission student count
    await MissionV2.findByIdAndUpdate(missionId, {
      $inc: { totalStudents: enrollments.length },
      $push: { studentIds: { $each: studentIds } }
    });

    return NextResponse.json({
      success: true,
      message: `${enrollments.length} students enrolled successfully`,
      enrollments: createdEnrollments
    }, { status: 201 });

  } catch (error) {
    console.error('Error adding students to mission:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to add students to mission' 
      },
      { status: 500 }
    );
  }
}

// PATCH: Update a specific student's status in the mission
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('PATCH: Request received for mission students');
  try {
    await connectToDatabase();
    const { id: missionId } = await params;
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    
    console.log('PATCH: Parsed parameters:', { missionId, studentId, url: request.url });

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'studentId is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'status is required' },
        { status: 400 }
      );
    }

    console.log('PATCH: Updating student status:', { missionId, studentId, status });
    
    // First check if any students exist in this mission
    const allStudentsInMission = await MissionStudentV2.find({ missionId });
    console.log('PATCH: All students in mission:', allStudentsInMission.length);
    console.log('PATCH: Student IDs in mission:', allStudentsInMission.map(s => s.studentId.toString()));
    
    // Update the mission student
    const updated = await MissionStudentV2.findOneAndUpdate(
      { missionId, studentId },
      { status, lastActivity: new Date() },
      { new: true }
    );

    console.log('PATCH: Update result:', updated);

    if (!updated) {
      console.log('PATCH: Student not found in mission:', { missionId, studentId });
      return NextResponse.json(
        { success: false, error: 'Student not found in mission' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Student status updated successfully',
      student: updated
    });

  } catch (error) {
    console.error('Error updating student status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update student status' },
      { status: 500 }
    );
  }
}

// PUT: Handle bulk actions (clear, fix, sync)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id: missionId } = await params;
    const body = await request.json();
    const { action } = body;

    if (action === 'clear') {
      // Remove all students from the mission
      const result = await MissionStudentV2.deleteMany({ missionId });
      
      // Update mission student count
      await MissionV2.findByIdAndUpdate(missionId, {
        $set: { totalStudents: 0, studentIds: [] }
      });

      return NextResponse.json({
        success: true,
        message: `All students cleared from mission (${result.deletedCount} students removed)`,
        data: { removedCount: result.deletedCount }
      });
    }

    if (action === 'fix') {
      // Get the mission to verify batch
      const mission = await MissionV2.findById(missionId);
      if (!mission) {
        return NextResponse.json(
          { success: false, error: 'Mission not found' },
          { status: 404 }
        );
      }

      // Get all valid students from the batch
      const validBatchStudents = await StudentBatchMembership.find({
        batchId: mission.batchId,
        status: 'approved'
      }).lean();
      
      const validStudentIds = validBatchStudents.map(bs => bs.studentId.toString());
      
      // Remove students who are not in the valid batch
      const result = await MissionStudentV2.deleteMany({
        missionId,
        studentId: { $nin: validStudentIds }
      });

      // Update mission student count
      const remainingCount = await MissionStudentV2.countDocuments({ missionId });
      await MissionV2.findByIdAndUpdate(missionId, {
        $set: { 
          totalStudents: remainingCount,
          studentIds: validStudentIds.filter(id => 
            mission.studentIds.map(sid => sid.toString()).includes(id)
          )
        }
      });

      return NextResponse.json({
        success: true,
        message: `Fixed mission by removing ${result.deletedCount} invalid students`,
        data: { removedCount: result.deletedCount }
      });
    }

    if (action === 'sync') {
      return NextResponse.json({
        success: true,
        message: 'Sync action not implemented for v2 - v2 missions don\'t use embedded students',
        data: { syncedCount: 0, totalEmbeddedStudents: 0 }
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use clear, fix, or sync.' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error handling bulk action:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process bulk action' },
      { status: 500 }
    );
  }
}

// DELETE: Remove a student from a mission
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id: missionId } = await params;
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'studentId is required' },
        { status: 400 }
      );
    }

    // Remove the mission student
    const deleted = await MissionStudentV2.findOneAndDelete({
      missionId,
      studentId
    });

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Student not found in mission' },
        { status: 404 }
      );
    }

    // Update mission student count
    await MissionV2.findByIdAndUpdate(missionId, {
      $inc: { totalStudents: -1 },
      $pull: { studentIds: studentId }
    });

    return NextResponse.json({
      success: true,
      message: 'Student removed from mission successfully'
    });

  } catch (error) {
    console.error('Error removing student from mission:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove student from mission' },
      { status: 500 }
    );
  }
}
