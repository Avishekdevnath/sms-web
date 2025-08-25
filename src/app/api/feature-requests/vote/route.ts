import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { FeatureRequest } from "@/models/FeatureRequest";
import { getAuthUserFromRequest } from "@/lib/rbac";
import { FeatureRequestVoteSchema } from "@/schemas/featureRequest";
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError
} from "@/utils/apiHelpers";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    if (!me) {
      return createErrorResponse("Authentication required", 401);
    }
    
    const body = await req.json();
    const { featureRequestId, vote } = FeatureRequestVoteSchema.parse(body);
    
    const featureRequest = await FeatureRequest.findById(featureRequestId);
    if (!featureRequest) {
      return createErrorResponse("Feature request not found", 404);
    }
    
    // Simple voting system - just increment/decrement votes
    if (vote === true) {
      featureRequest.votes += 1;
    } else if (vote === false) {
      featureRequest.votes = Math.max(0, featureRequest.votes - 1);
    }
    
    await featureRequest.save();
    
    return createSuccessResponse(
      { votes: featureRequest.votes }, 
      "Vote recorded successfully"
    );
  } catch (error) {
    return handleApiError(error);
  }
} 