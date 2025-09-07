import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MissionStudentV2, MissionV2 } from '@/models/v2';
import { 
  createMissionStudentV2Schema, 
  missionStudentQueryV2Schema,
  bulkStudentAssignmentV2Schema 
} from '@/schemas/v2';
import { verifyUserToken } from '@/lib/auth';

// ✅ V2 MISSION STUDENTS API ROUTE
// GET: List mission students with filtering and pagination
// POST: Create new mission student assignment

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());
    
    // Validate query parameters
    const validatedQuery = missionStudentQueryV2Schema.parse(query);
    
    // Build filter object
    const filter: Record<string, unknown> = {};
    
    if (validatedQuery.status) filter.status = validatedQuery.status;
    if (validatedQuery.missionId) filter.missionId = validatedQuery.missionId;
    if (validatedQuery.batchId) filter.batchId = validatedQuery.batchId;
    if (validatedQuery.mentorshipGroupId) filter.mentorshipGroupId = validatedQuery.mentorshipGroupId;
    if (validatedQuery.isRegular !== undefined) filter.isRegular = validatedQuery.isRegular;
    
    // Range filters
    if (validatedQuery.attendanceRate) {
      filter.attendanceRate = {
        $gte: validatedQuery.attendanceRate.min,
        $lte: validatedQuery.attendanceRate.max
      };
    }
    
    if (validatedQuery.progress) {
      filter.progress = {
        $gte: validatedQuery.progress.min,
        $lte: validatedQuery.progress.max
      };
    }
    
    // Build sort object
    const sort: Record<string, 1 | -1> = {};
    sort[validatedQuery.sortBy] = validatedQuery.sortOrder === 'asc' ? 1 : -1;
    
    // Execute query with pagination
    const skip = (validatedQuery.page - 1) * validatedQuery.limit;
    
    const [missionStudents, total] = await Promise.all([
      MissionStudentV2.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(validatedQuery.limit)
        .populate('studentId', 'name email studentId')
        .populate('missionId', 'title code status')
        .populate('batchId', 'name code')
        .populate('mentorshipGroupId', 'name status')
        .lean(),
      MissionStudentV2.countDocuments(filter)
    ]);
    
    const totalPages = Math.ceil(total / validatedQuery.limit);
    
    return NextResponse.json({
      success: true,
      data: missionStudents,
      pagination: {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        total,
        totalPages,
        hasNext: validatedQuery.page < totalPages,
        hasPrev: validatedQuery.page > 1
      }
    });
    
  } catch (error: unknown) {
    console.error('V2 Mission Students GET Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch mission students';
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    let user;
    try {
      // Verify the token
      user = verifyUserToken(token);
      
      if (!user || !user._id || !user.role) {
        throw new Error('Invalid token structure');
      }
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    
    // Check if this is a bulk assignment
    if (body.studentIds && Array.isArray(body.studentIds)) {
      const validatedData = bulkStudentAssignmentV2Schema.parse(body);
      
      // Verify mission exists
      const mission = await MissionV2.findById(validatedData.missionId);
      if (!mission) {
        return NextResponse.json(
          { success: false, error: 'Mission not found' },
          { status: 404 }
        );
      }
      
      // Check for existing assignments
      const existingAssignments = await MissionStudentV2.find({
        studentId: { $in: validatedData.studentIds },
        missionId: validatedData.missionId
      });
      
      if (existingAssignments.length > 0) {
        const existingStudentIds = existingAssignments.map(a => a.studentId);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Some students are already assigned to this mission',
            existingStudentIds 
          },
          { status: 400 }
        );
      }
      
      // Create bulk assignments
      const assignments = validatedData.studentIds.map(studentId => ({
        studentId,
        missionId: validatedData.missionId,
        batchId: validatedData.batchId,
        status: validatedData.status,
        missionNotes: validatedData.missionNotes,
                 startedAt: new Date(),
         lastActivity: new Date(),
         createdBy: user._id
       }));
      
      const createdAssignments = await MissionStudentV2.insertMany(assignments);
      
      // Update mission student arrays
      await mission.addStudents(validatedData.studentIds);
      
      return NextResponse.json({
        success: true,
        data: createdAssignments,
        message: `${createdAssignments.length} students assigned successfully`
      }, { status: 201 });
      
    } else {
      // Single assignment
      const validatedData = createMissionStudentV2Schema.parse(body);
      
      // Verify mission exists
      const mission = await MissionV2.findById(validatedData.missionId);
      if (!mission) {
        return NextResponse.json(
          { success: false, error: 'Mission not found' },
          { status: 404 }
        );
      }
      
      // Check for existing assignment
      const existingAssignment = await MissionStudentV2.findOne({
        studentId: validatedData.studentId,
        missionId: validatedData.missionId
      });
      
      if (existingAssignment) {
        return NextResponse.json(
          { success: false, error: 'Student is already assigned to this mission' },
          { status: 400 }
        );
      }
      
      // Create assignment
      const missionStudent = new MissionStudentV2({
        ...validatedData,
                 startedAt: new Date(),
         lastActivity: new Date(),
         createdBy: user._id
       });
      
      await missionStudent.save();
      
      // Update mission student arrays
      if (mission) {
        await mission.addStudent(validatedData.studentId);
      }
      
      // Populate references for response
      await missionStudent.populate('studentId', 'name email studentId');
      await missionStudent.populate('missionId', 'title code status');
      await missionStudent.populate('batchId', 'name code');
      
      return NextResponse.json({
        success: true,
        data: missionStudent,
        message: 'Student assigned successfully'
      }, { status: 201 });
    }
    
  } catch (error: unknown) {
    console.error('V2 Mission Students POST Error:', error);
    
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed', 
          details: (error as { errors: unknown }).errors 
        },
        { status: 400 }
      );
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to assign student';
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage
      },
      { status: 500 }
    );
  }
}
