import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MissionV2 } from '@/models/v2';
import { createMissionV2Schema, missionQueryV2Schema } from '@/schemas/v2';
import { getAuthUserFromRequest, requireRoles } from '@/lib/rbac';
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/utils/apiHelpers';

// ✅ V2 MISSIONS API ROUTE - REPLACES OLD MISSION MODEL
// GET: List missions with filtering and pagination
// POST: Create new mission with automatic code generation

// Function to generate unique mission code
async function generateMissionCode(): Promise<string> {
  const prefix = 'MISSION';
  let counter = 1;
  let code: string;
  
  do {
    code = `${prefix}-${counter.toString().padStart(3, '0')}`;
    const existingMission = await MissionV2.findOne({ code });
    
    if (!existingMission) {
      return code;
    }
    counter++;
  } while (counter < 1000); // Safety limit
  
  throw new Error('Unable to generate unique mission code');
}

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());
    
    // Validate query parameters
    const validatedQuery = missionQueryV2Schema.parse(query);
    
    // Build filter object
    const filter: Record<string, unknown> = {};
    
    if (validatedQuery.status) filter.status = validatedQuery.status;
    if (validatedQuery.batchId) filter.batchId = validatedQuery.batchId;
    if (validatedQuery.createdBy) filter.createdBy = validatedQuery.createdBy;
    if (validatedQuery.search) {
      filter.$or = [
        { title: { $regex: validatedQuery.search, $options: 'i' } },
        { code: { $regex: validatedQuery.search, $options: 'i' } },
        { description: { $regex: validatedQuery.search, $options: 'i' } }
      ];
    }
    
    // Build sort object
    const sort: Record<string, 1 | -1> = {};
    sort[validatedQuery.sortBy] = validatedQuery.sortOrder === 'asc' ? 1 : -1;
    
    // Execute query with pagination
    const skip = (validatedQuery.page - 1) * validatedQuery.limit;
    
    const [missions, total] = await Promise.all([
      MissionV2.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(validatedQuery.limit)
        .populate('batchId', 'name code')
        .populate('createdBy', 'name email')
        .lean(),
      MissionV2.countDocuments(filter)
    ]);
    
    const totalPages = Math.ceil(total / validatedQuery.limit);
    
    return NextResponse.json({
      success: true,
      data: missions,
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
    console.error('V2 Missions GET Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch missions';
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
    
    // Check authentication and authorization
    const me = await getAuthUserFromRequest(request);
    requireRoles(me, ["admin", "manager", "sre"]);
    
    // Parse and validate request body
    const body = await request.json();
    const validatedData = createMissionV2Schema.parse(body);
    
    // Generate unique mission code if not provided
    let missionCode = validatedData.code;
    if (!missionCode || missionCode.trim() === '') {
      missionCode = await generateMissionCode();
    } else {
      // Check if the provided code already exists
      const existingMission = await MissionV2.findOne({ code: missionCode });
      if (existingMission) {
        return createErrorResponse(`Mission code '${missionCode}' already exists`, 400);
      }
    }
    
    // Create V2 mission with proper data transformation
    const missionV2Data = {
      ...validatedData,
      code: missionCode,
      // Transform dates if they're strings
      startDate: validatedData.startDate instanceof Date ? validatedData.startDate : 
                 (typeof validatedData.startDate === 'string' ? new Date(validatedData.startDate) : undefined),
      endDate: validatedData.endDate instanceof Date ? validatedData.endDate : 
               (typeof validatedData.endDate === 'string' ? new Date(validatedData.endDate) : undefined),
      createdBy: me!._id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Remove any undefined fields to avoid MongoDB issues
    Object.keys(missionV2Data).forEach(key => {
      if (missionV2Data[key as keyof typeof missionV2Data] === undefined) {
        delete missionV2Data[key as keyof typeof missionV2Data];
      }
    });
    
    const missionV2 = new MissionV2(missionV2Data);
    await missionV2.save();
    
    // Populate references for response
    await missionV2.populate('batchId', 'name code');
    await missionV2.populate('createdBy', 'name email');
    
    return createSuccessResponse(missionV2, "V2 Mission created successfully");
    
  } catch (error: unknown) {
    console.error('V2 Missions POST Error:', error);
    
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
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to create mission';
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage
      },
      { status: 500 }
    );
  }
}
