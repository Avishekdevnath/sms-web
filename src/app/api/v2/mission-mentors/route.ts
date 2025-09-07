import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MissionMentorV2, MissionV2 } from '@/models/v2';
import { 
  createMissionMentorV2Schema, 
  missionMentorQueryV2Schema,
  bulkMentorAssignmentV2Schema 
} from '@/schemas/v2';
import { getAuthUserFromRequest } from '@/lib/rbac';

// ✅ V2 MISSION MENTORS API ROUTE
// GET: List mission mentors with filtering and pagination
// POST: Create new mission mentor assignment

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());
    
    // Validate query parameters
    const validatedQuery = missionMentorQueryV2Schema.parse(query);
    
    // Build filter object
    const filter: Record<string, unknown> = {};
    
    if (validatedQuery.status) filter.status = validatedQuery.status;
    if (validatedQuery.role) filter.role = validatedQuery.role;
    if (validatedQuery.missionId) filter.missionId = validatedQuery.missionId;
    if (validatedQuery.batchId) filter.batchId = validatedQuery.batchId;
    if (validatedQuery.specialization) filter.specialization = validatedQuery.specialization;
    if (validatedQuery.isRegular !== undefined) filter.isRegular = validatedQuery.isRegular;
    
    // Range filters
    if (validatedQuery.availabilityRate) {
      filter.availabilityRate = {
        $gte: validatedQuery.availabilityRate.min,
        $lte: validatedQuery.availabilityRate.max
      };
    }
    
    if (validatedQuery.maxStudents) {
      filter.maxStudents = {
        $gte: validatedQuery.maxStudents.min,
        $lte: validatedQuery.maxStudents.max
      };
    }
    
    if (validatedQuery.currentStudents) {
      filter.currentStudents = {
        $gte: validatedQuery.currentStudents.min,
        $lte: validatedQuery.currentStudents.max
      };
    }
    
    // Build sort object
    const sort: Record<string, 1 | -1> = {};
    sort[validatedQuery.sortBy] = validatedQuery.sortOrder === 'asc' ? 1 : -1;
    
    // Execute query with pagination
    const skip = (validatedQuery.page - 1) * validatedQuery.limit;
    
    const [missionMentors, total] = await Promise.all([
      MissionMentorV2.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(validatedQuery.limit)
        .populate('mentorId', 'name email role')
        .populate('missionId', 'title code status')
        .populate('batchId', 'name code')
        .lean(),
      MissionMentorV2.countDocuments(filter)
    ]);
    
    const totalPages = Math.ceil(total / validatedQuery.limit);
    
    return NextResponse.json({
      success: true,
      data: missionMentors,
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
    console.error('V2 Mission Mentors GET Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch mission mentors';
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
    console.log('V2 Mission Mentors POST - Raw body received:', JSON.stringify(body, null, 2));
    
    // Check if this is a bulk assignment
    if (body.mentorIds && Array.isArray(body.mentorIds)) {
      const validatedData = bulkMentorAssignmentV2Schema.parse(body);
      
      // Verify mission exists and get batchId
      const mission = await MissionV2.findById(validatedData.missionId);
      if (!mission) {
        return NextResponse.json(
          { success: false, error: 'Mission not found' },
          { status: 404 }
        );
      }
      
      // Add batchId from mission to validated data
      validatedData.batchId = mission.batchId.toString();
      
      // Check for existing assignments
      const existingAssignments = await MissionMentorV2.find({
        mentorId: { $in: validatedData.mentorIds },
        missionId: validatedData.missionId
      });
      
      if (existingAssignments.length > 0) {
        const existingMentorIds = existingAssignments.map(a => a.mentorId);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Some mentors are already assigned to this mission',
            existingMentorIds 
          },
          { status: 400 }
        );
      }
      
      // Create bulk assignments
      const assignments = validatedData.mentorIds.map(mentorId => ({
        mentorId,
        missionId: validatedData.missionId,
        batchId: validatedData.batchId,
        role: validatedData.role,
        specialization: validatedData.specialization || [],
        responsibilities: validatedData.responsibilities || [],
        maxStudents: validatedData.maxStudents,
                 createdBy: user._id
       }));
      
      const createdAssignments = await MissionMentorV2.insertMany(assignments);
      
      // Update mission mentor arrays
      await mission.addMentors(validatedData.mentorIds);
      
      return NextResponse.json({
        success: true,
        data: createdAssignments,
        message: `${createdAssignments.length} mentors assigned successfully`
      }, { status: 201 });
      
    } else {
      // Single assignment
      // First verify mission exists and get batchId
      const mission = await MissionV2.findById(body.missionId);
      if (!mission) {
        return NextResponse.json(
          { success: false, error: 'Mission not found' },
          { status: 404 }
        );
      }
      
      // Add batchId from mission to body before validation
      const bodyWithBatchId = {
        ...body,
        batchId: mission.batchId.toString()
      };
      
      const validatedData = createMissionMentorV2Schema.parse(bodyWithBatchId);
      
      // Check for existing assignment
      const existingAssignment = await MissionMentorV2.findOne({
        mentorId: validatedData.mentorId,
        missionId: validatedData.missionId
      });
      
      if (existingAssignment) {
        return NextResponse.json(
          { success: false, error: 'Mentor is already assigned to this mission' },
          { status: 400 }
        );
      }
      
      // Create assignment
      const missionMentor = new MissionMentorV2({
        ...validatedData,
                 createdBy: user._id
       });
      
      await missionMentor.save();
      
      // Update mission mentor arrays (fixed variable conflict)
      if (mission) {
        await mission.addMentor(validatedData.mentorId);
      }
      
      // Populate references for response
      await missionMentor.populate('mentorId', 'name email role');
      await missionMentor.populate('missionId', 'title code status');
      await missionMentor.populate('batchId', 'name code');
      
      return NextResponse.json({
        success: true,
        data: missionMentor,
        message: 'Mentor assigned successfully'
      }, { status: 201 });
    }
    
  } catch (error: unknown) {
    console.error('V2 Mission Mentors POST Error:', error);
    
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
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to assign mentor';
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage
      },
      { status: 500 }
    );
  }
}
