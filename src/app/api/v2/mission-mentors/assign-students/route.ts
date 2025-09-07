import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MissionMentorV2, MissionStudentV2 } from '@/models/v2';
import { getAuthUserFromRequest } from '@/lib/rbac';

// ✅ V2 MISSION MENTORS ASSIGN STUDENTS API
// POST: Assign students to a mentor

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Check authentication using the same method as V1 APIs
    const user = await getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has permission (admin, sre, dev)
    if (!['admin', 'sre', 'developer'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    const { missionId, mentorId, studentIds, isPrimaryMentor } = body;

    // Validate required fields
    if (!missionId || !mentorId || !studentIds || !Array.isArray(studentIds)) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: missionId, mentorId, studentIds' },
        { status: 400 }
      );
    }

    // Check if mentor exists in mission
    const missionMentor = await MissionMentorV2.findOne({
      missionId,
      mentorId
    });

    if (!missionMentor) {
      return NextResponse.json(
        { success: false, error: 'Mentor not found in this mission' },
        { status: 404 }
      );
    }

    // Check if students exist in mission
    const missionStudents = await MissionStudentV2.find({
      _id: { $in: studentIds },
      missionId
    });

    if (missionStudents.length !== studentIds.length) {
      return NextResponse.json(
        { success: false, error: 'Some students not found in this mission' },
        { status: 404 }
      );
    }

    // Check mentor capacity (0 = unlimited)
    const currentStudents = missionMentor.currentStudents || 0;
    const maxStudents = missionMentor.maxStudents || 0;
    
    if (maxStudents > 0 && currentStudents + studentIds.length > maxStudents) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Mentor capacity exceeded. Current: ${currentStudents}, Max: ${maxStudents}, Trying to add: ${studentIds.length}` 
        },
        { status: 400 }
      );
    }

    // Update mentor's assigned students
    const updatedMentor = await MissionMentorV2.findByIdAndUpdate(
      missionMentor._id,
      {
        $addToSet: { assignedStudentIds: { $each: studentIds } },
        $inc: { currentStudents: studentIds.length }
      },
      { new: true }
    );

    // Update students' assigned mentor
    await MissionStudentV2.updateMany(
      { _id: { $in: studentIds } },
      {
        $set: {
          assignedMentorId: mentorId,
          isPrimaryMentor: isPrimaryMentor || false,
          assignedAt: new Date(),
          assignedBy: user._id
        }
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        mentor: updatedMentor,
        assignedStudents: studentIds.length
      },
      message: `Successfully assigned ${studentIds.length} student(s) to mentor`
    }, { status: 200 });
    
  } catch (error: unknown) {
    console.error('V2 Mission Mentors Assign Students Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to assign students to mentor';
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage
      },
      { status: 500 }
    );
  }
}
