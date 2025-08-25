import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { FeatureRequest } from "@/models/FeatureRequest";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";
import { FeatureRequestUpdateSchema } from "@/schemas/featureRequest";
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
  transformMongoResponse
} from "@/utils/apiHelpers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    
    const featureRequest = await FeatureRequest.findById(id)
      .populate('submittedBy', 'name email')
      .populate('assignedTo', 'name email')
      .lean();
    
    if (!featureRequest) {
      return createErrorResponse("Feature request not found", 404);
    }
    
    const transformedRequest = transformMongoResponse(featureRequest);
    return createSuccessResponse(transformedRequest);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    if (!me) {
      return createErrorResponse("Authentication required", 401);
    }
    
    const { id } = await params;
    const body = await req.json();
    const validatedData = FeatureRequestUpdateSchema.parse(body);
    
    const featureRequest = await FeatureRequest.findById(id);
    if (!featureRequest) {
      return createErrorResponse("Feature request not found", 404);
    }
    
    // Only allow admins, developers, and the original submitter to update
    const canUpdate = me.role === 'admin' || 
                     me.role === 'developer' || 
                     featureRequest.submittedBy.toString() === me._id.toString();
    
    if (!canUpdate) {
      return createErrorResponse("Insufficient permissions", 403);
    }
    
    // Update the feature request
    Object.assign(featureRequest, validatedData);
    
    // Set completedAt if status is changed to completed
    if (validatedData.status === 'completed' && !featureRequest.completedAt) {
      featureRequest.completedAt = new Date();
    }
    
    await featureRequest.save();
    
    const updatedRequest = await FeatureRequest.findById(id)
      .populate('submittedBy', 'name email')
      .populate('assignedTo', 'name email')
      .lean();
    
    const transformedRequest = transformMongoResponse(updatedRequest);
    return createSuccessResponse(transformedRequest, "Feature request updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    if (!me) {
      return createErrorResponse("Authentication required", 401);
    }
    
    // Only admins can delete feature requests
    if (me.role !== 'admin') {
      return createErrorResponse("Insufficient permissions", 403);
    }
    
    const { id } = await params;
    const featureRequest = await FeatureRequest.findByIdAndDelete(id);
    
    if (!featureRequest) {
      return createErrorResponse("Feature request not found", 404);
    }
    
    return createSuccessResponse(null, "Feature request deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
} 