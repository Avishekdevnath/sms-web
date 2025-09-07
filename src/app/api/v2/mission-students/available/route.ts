import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MissionStudentV2, MentorshipGroupV2 } from '@/models/v2';
import { getAuthUserFromRequest } from '@/lib/rbac';

// ✅ V2 AVAILABLE MISSION STUDENTS API ROUTE
// GET: List mission students who are NOT already assigned to any group
// Used specifically for the Create Group page

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const missionId = searchParams.get('missionId');
    
    if (!missionId) {
      return NextResponse.json(
        { success: false, error: 'Mission ID is required' },
        { status: 400 }
      );
    }
    
    // Get all students assigned to groups in this mission
    const assignedStudentIds = await MentorshipGroupV2.find(
      { missionId },
      { students: 1 }
    ).lean();
    
    // Extract all student IDs that are already assigned to groups
    const assignedIds = assignedStudentIds.flatMap(group => group.students);
    
    // Find students in this mission who are NOT assigned to any group
    const availableStudents = await MissionStudentV2.find({
      missionId,
      status: 'active',
      studentId: { $nin: assignedIds } // Exclude students already in groups
    })
    .populate('studentId', 'name email studentId')
    .select('studentId status progress attendanceRate')
    .lean();
    
    return NextResponse.json({
      success: true,
      data: availableStudents,
      count: availableStudents.length
    });
    
  } catch (error: unknown) {
    console.error('Available Mission Students GET Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch available students';
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage 
      },
      { status: 500 }
    );
  }
}
