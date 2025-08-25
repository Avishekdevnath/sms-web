import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { FeatureRequest } from "@/models/FeatureRequest";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";
import { FeatureRequestCreateSchema, FeatureRequestQuerySchema } from "@/schemas/featureRequest";
import {
  createSuccessResponse,
  createPaginatedResponse,
  createErrorResponse,
  handleApiError,
  parseQueryParams,
  getPaginationFromQuery,
  buildSearchFilter,
  calculatePagination,
  transformMongoResponse
} from "@/utils/apiHelpers";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const queryParams = parseQueryParams(searchParams);
    const validatedQuery = FeatureRequestQuerySchema.parse(queryParams);
    
    const { 
      page = 1, 
      limit = 20, 
      category, 
      priority, 
      status, 
      userRole, 
      assignedTo, 
      submittedBy, 
      search, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = validatedQuery;
    
    const { skip } = getPaginationFromQuery(searchParams);
    const filter: any = {};
    
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (status) filter.status = status;
    if (userRole) filter.userRole = userRole;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (submittedBy) filter.submittedBy = submittedBy;
    
    if (search) {
      Object.assign(filter, buildSearchFilter(search, ['title', 'description', 'tags']));
    }
    
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const [featureRequests, total] = await Promise.all([
      FeatureRequest.find(filter)
        .populate('submittedBy', 'name email')
        .populate('assignedTo', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      FeatureRequest.countDocuments(filter)
    ]);
    
    const transformedRequests = featureRequests.map(request => transformMongoResponse(request));
    const pagination = calculatePagination(page, limit, total);
    
    return createPaginatedResponse(transformedRequests, pagination);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    if (!me) {
      return createErrorResponse("Authentication required", 401);
    }
    
    const body = await req.json();
    const validatedData = FeatureRequestCreateSchema.parse(body);
    
    const featureRequest = await FeatureRequest.create({
      ...validatedData,
      submittedBy: me._id,
      userRole: me.role,
      userEmail: me.email,
      userName: me.name,
      votes: 0
    });
    
    const populatedRequest = await FeatureRequest.findById(featureRequest._id)
      .populate('submittedBy', 'name email')
      .populate('assignedTo', 'name email')
      .lean();
    
    const transformedRequest = transformMongoResponse(populatedRequest);
    return createSuccessResponse(transformedRequest, "Feature request submitted successfully");
  } catch (error) {
    return handleApiError(error);
  }
} 