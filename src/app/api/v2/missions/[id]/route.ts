import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MissionV2 } from '@/models/v2';
import { updateMissionV2Schema, updateMissionStatusV2Schema } from '@/schemas/v2';
import { getAuthUserFromRequest, requireRoles } from '@/lib/rbac';
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/utils/apiHelpers';

// ✅ V2 MISSION INDIVIDUAL OPERATIONS
// GET: Get mission by ID
// PUT: Update mission
// DELETE: Delete mission

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    
    const { id } = await params;
    
    const mission = await MissionV2.findById(id)
      .populate('batchId', 'name code')
      .populate('createdBy', 'name email')
      .populate('studentIds', 'name email')
      .populate('mentorIds', 'name email')
      .populate('groupIds', 'name')
      .lean();
    
    if (!mission) {
      return createErrorResponse('Mission not found', 404);
    }
    
    return createSuccessResponse(mission, 'Mission retrieved successfully');
    
  } catch (error) {
    console.error('V2 Mission GET Error:', error);
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    
    const me = await getAuthUserFromRequest(request);
    requireRoles(me, ["admin", "manager", "sre"]);
    
    const { id } = await params;
    const body = await request.json();
    
    console.log('V2 Mission PUT - Request body:', body);
    console.log('V2 Mission PUT - Mission ID:', id);
    
    // Use simpler schema for status-only updates
    let validatedData;
    if (Object.keys(body).length === 1 && body.status) {
      validatedData = updateMissionStatusV2Schema.parse(body);
      console.log('V2 Mission PUT - Status-only update validated:', validatedData);
    } else {
      validatedData = updateMissionV2Schema.parse(body);
      console.log('V2 Mission PUT - Full update validated:', validatedData);
    }
    
    // Check if mission exists
    const existingMission = await MissionV2.findById(id);
    if (!existingMission) {
      return createErrorResponse('Mission not found', 404);
    }
    
    // Check if code is being changed and if it already exists
    if (validatedData.code && validatedData.code !== existingMission.code) {
      const codeExists = await MissionV2.findOne({ code: validatedData.code });
      if (codeExists) {
        return createErrorResponse(`Mission code '${validatedData.code}' already exists`, 400);
      }
    }
    
    // Transform dates if they're strings
    const updates: any = { ...validatedData };
    if (validatedData.startDate && typeof validatedData.startDate === 'string') {
      updates.startDate = new Date(validatedData.startDate);
    }
    if (validatedData.endDate && typeof validatedData.endDate === 'string') {
      updates.endDate = new Date(validatedData.endDate);
    }
    
    updates.updatedAt = new Date();
    
    const mission = await MissionV2.findByIdAndUpdate(id, updates, { new: true })
      .populate('batchId', 'name code')
      .populate('createdBy', 'name email')
      .populate('studentIds', 'name email')
      .populate('mentorIds', 'name email')
      .populate('groupIds', 'name');
    
    if (!mission) {
      return createErrorResponse('Mission not found', 404);
    }
    
    return createSuccessResponse(mission, 'Mission updated successfully');
    
  } catch (error) {
    console.error('V2 Mission PUT Error:', error);
    console.error('V2 Mission PUT Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    
    const me = await getAuthUserFromRequest(request);
    requireRoles(me, ["admin", "manager", "sre"]);
    
    const { id } = await params;
    
    const mission = await MissionV2.findById(id);
    if (!mission) {
      return createErrorResponse('Mission not found', 404);
    }
    
    // Check if mission has active students
    if (mission.totalStudents > 0) {
      return createErrorResponse('Cannot delete mission with active students. Please archive it instead.', 400);
    }
    
    await MissionV2.findByIdAndDelete(id);
    
    return createSuccessResponse(null, 'Mission deleted successfully');
    
  } catch (error) {
    console.error('V2 Mission DELETE Error:', error);
    return handleApiError(error);
  }
}
