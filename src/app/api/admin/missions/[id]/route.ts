import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Mission } from '@/models/Mission';
import { getAuthUserFromRequest, requireRoles } from '@/lib/rbac';
import { MissionUpdateSchema, MissionStatusUpdateSchema } from '@/schemas/mission';
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/utils/apiHelpers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    
    const { id } = await params;
    const mission = await Mission.findById(id)
      .populate('batchId', 'code title')
      .populate('students.studentId', 'name email studentId')
      .populate('students.primaryMentorId', 'name email')
      .populate('mentors.mentorId', 'name email')
      .populate({
        path: 'courses.courseOfferingId',
        populate: {
          path: 'courseId',
          select: 'title code'
        }
      })
      .populate('createdBy', 'name email')
      .lean();

    if (!mission) {
      return createErrorResponse('Mission not found', 404);
    }

    return createSuccessResponse(mission);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    
    // Check authentication and authorization
    const me = await getAuthUserFromRequest(request);
    requireRoles(me, ["admin", "manager", "sre"]);
    
    const { id } = await params;
    const body = await request.json();
    
    // Check if this is a status-only update
    if (Object.keys(body).length === 1 && body.status) {
      const validatedData = MissionStatusUpdateSchema.parse(body);
      
      const mission = await Mission.findByIdAndUpdate(
        id,
        { status: validatedData.status },
        { new: true }
      )
      .populate('batchId', 'code title')
      .populate('students.studentId', 'name email')
      .populate('students.primaryMentorId', 'name email')
      .populate({
        path: 'courses.courseOfferingId',
        populate: {
          path: 'courseId',
          select: 'title code'
        }
      })
      .populate('createdBy', 'name email')
      .lean();
      
      if (!mission) {
        return createErrorResponse('Mission not found', 404);
      }
      
      return createSuccessResponse(mission, 'Mission status updated successfully');
    }
    
    // Full mission update
    const validatedData = MissionUpdateSchema.parse(body);
    
    const updates: any = { ...validatedData };
    if (validatedData.startDate) updates.startDate = new Date(validatedData.startDate);
    if (validatedData.endDate) updates.endDate = new Date(validatedData.endDate);
    
    const mission = await Mission.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    )
    .populate('batchId', 'code title')
    .populate('students.studentId', 'name email')
    .populate('students.primaryMentorId', 'name email')
    .populate({
      path: 'courses.courseOfferingId',
      populate: {
        path: 'courseId',
        select: 'title code'
      }
    })
    .populate('createdBy', 'name email')
    .lean();
    
    if (!mission) {
      return createErrorResponse('Mission not found', 404);
    }
    
    return createSuccessResponse(mission, 'Mission updated successfully');
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
    
    // Check authentication and authorization
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["admin", "manager", "sre"]);
    
    const { id } = await params;
    const mission = await Mission.findById(id);
    if (!mission) {
      return createErrorResponse("Mission not found", 404);
    }
    
    // Check if mission has active students using StudentMission collection
    const StudentMission = (await import("@/models/StudentMission")).StudentMission;
    const activeStudents = await StudentMission.find({ 
      missionId: id, 
      status: 'active' 
    }).countDocuments();
    
    if (activeStudents > 0) {
      return createErrorResponse("Cannot delete mission with active students. Please archive it instead.", 400);
    }
    
    await Mission.findByIdAndDelete(id);
    
    return createSuccessResponse(null, "Mission deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
} 