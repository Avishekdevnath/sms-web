import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Mission } from "@/models/Mission";
import { User } from "@/models/User"; // Import User model to register schema
import { Batch } from "@/models/Batch"; // Import Batch model to register schema
import { CourseOffering } from "@/models/CourseOffering"; // Import CourseOffering model to register schema
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";
import { MissionCreateSchema, MissionUpdateSchema, MissionQuerySchema } from "@/schemas/mission";
import { MissionQueryParams, MissionWithDetails } from "@/types/models";
import { PaginatedResponse } from "@/types/api";

// Function to generate unique mission code
async function generateMissionCode(): Promise<string> {
  const prefix = 'MISSION';
  let counter = 1;
  let code: string;
  
  do {
    code = `${prefix}-${counter.toString().padStart(3, '0')}`;
    const existingMission = await Mission.findOne({ code });
    if (!existingMission) {
      return code;
    }
    counter++;
  } while (counter < 1000); // Safety limit
  
  throw new Error('Unable to generate unique mission code');
}
import { 
  createSuccessResponse, 
  createPaginatedResponse, 
  createErrorResponse, 
  createValidationErrorResponse,
  handleApiError,
  parseQueryParams,
  getPaginationFromQuery,
  buildSearchFilter,
  calculatePagination,
  transformMongoResponse
} from "@/utils/apiHelpers";
import { 
  safeExtractBatchId, 
  safeExtractBatchCode, 
  safeExtractUserName 
} from "@/utils/typeGuards";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    
    // Parse and validate query parameters
    const queryParams = parseQueryParams<MissionQueryParams>(searchParams);
    const validatedQuery = MissionQuerySchema.parse(queryParams);
    
    const { page = 1, limit = 20, batchId, status, createdBy, search, sortBy = 'createdAt', sortOrder = 'desc' } = validatedQuery;
    const { skip } = getPaginationFromQuery(searchParams);
    
    // Build filter
    const filter: any = {};
    if (batchId) filter.batchId = batchId;
    if (status) filter.status = status;
    if (createdBy) filter.createdBy = createdBy;
    if (search) {
      Object.assign(filter, buildSearchFilter(search, ['title', 'description']));
    }
    
    // Build sort
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Execute query
    const [missions, total] = await Promise.all([
      Mission.find(filter)
        .populate('createdBy', 'name email')
        .populate('batchId', 'code title')
        .populate('courses.courseOfferingId', 'courseId batchId semesterId')
        .populate('students.studentId', 'name email')
        .populate('students.mentorId', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Mission.countDocuments(filter)
    ]);
    
    // Transform response
    const transformedMissions = missions.map(mission => transformMongoResponse(mission)) as MissionWithDetails[];
    const pagination = calculatePagination(page, limit, total);
    
    return createPaginatedResponse(transformedMissions, pagination);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["admin", "manager", "sre"]);
    
    const body = await req.json();
    
    const validatedData = MissionCreateSchema.parse(body);
    
    // Generate unique mission code
    const missionCode = await generateMissionCode();
    
    const missionData = {
      ...validatedData,
      code: missionCode,
      startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
      endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
      createdBy: me!._id,
    };
    
    const mission = await Mission.create(missionData);
    
    // Return the created mission without population to avoid schema issues
    const transformedMission = transformMongoResponse(mission.toObject());
    
    return createSuccessResponse(transformedMission, "Mission created successfully");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["admin", "manager", "sre"]);
    
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return createErrorResponse("Mission ID required", 400);
    }
    
    const body = await req.json();
    const validatedData = MissionUpdateSchema.parse(body);
    
    const updates: any = { ...validatedData };
    if (validatedData.startDate) updates.startDate = new Date(validatedData.startDate);
    if (validatedData.endDate) updates.endDate = new Date(validatedData.endDate);
    
    const mission = await Mission.findByIdAndUpdate(id, updates, { new: true })
      .populate('createdBy', 'name email')
      .populate('batchId', 'code title')
      .populate('courses.courseOfferingId', 'courseId batchId semesterId')
      .populate('students.studentId', 'name email')
      .populate('students.mentorId', 'name email')
      .lean();
    
    if (!mission) {
      return createErrorResponse("Mission not found", 404);
    }
    
    const transformedMission = transformMongoResponse(mission) as MissionWithDetails;
    
    return createSuccessResponse(transformedMission, "Mission updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["admin", "manager", "sre"]);
    
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return createErrorResponse("Mission ID required", 400);
    }
    
    const mission = await Mission.findByIdAndDelete(id);
    
    if (!mission) {
      return createErrorResponse("Mission not found", 404);
    }
    
    return createSuccessResponse(null, "Mission deleted successfully");
  } catch (error) {
    console.error('DELETE /api/missions - Error:', error);
    return handleApiError(error);
  }
} 