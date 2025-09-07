import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MentorshipGroupV2, MissionV2 } from '@/models/v2';
import { Channel } from '@/models';
import type { Model } from 'mongoose';
import type { IChannel } from '@/models';
import { getAuthUserFromRequest } from '@/lib/rbac';

// ✅ V2 MENTORSHIP GROUPS API ROUTE
// GET: List mentorship groups with filtering and pagination
// POST: Create new mentorship group

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());
    
    // Build filter object
    const filter: Record<string, unknown> = {};
    
    if (query.missionId) filter.missionId = query.missionId;
    if (query.status) filter.status = query.status;
    if (query.groupType) filter.groupType = query.groupType;
    if (query.primaryMentorId) filter.primaryMentorId = query.primaryMentorId;
    if (query.skillLevel) filter.skillLevel = query.skillLevel;
    if (query.focusArea) filter.focusArea = { $in: [query.focusArea] };
    
    // Build sort object
    const sort: Record<string, 1 | -1> = {};
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    sort[sortBy] = sortOrder;
    
    // Pagination
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');
    const skip = (page - 1) * limit;
    
    // Execute query with pagination
    const [groups, total] = await Promise.all([
      MentorshipGroupV2.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('missionId', 'code title status')
        .populate('primaryMentorId', 'name email role')
        .populate('students', 'name email studentId')
        .populate('mentors', 'name email role')
        .lean(),
      MentorshipGroupV2.countDocuments(filter)
    ]);
    
    const totalPages = Math.ceil(total / limit);
    
    return NextResponse.json({
      success: true,
      data: groups,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
    
  } catch (error: unknown) {
    console.error('V2 Mentorship Groups GET Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch mentorship groups';
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
    
    // Check authentication
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
    console.log('V2 Mentorship Groups POST - Raw body received:', JSON.stringify(body, null, 2));
    
    // Verify mission exists
    const mission = await (MissionV2 as any).findById(body.missionId);
    if (!mission) {
      return NextResponse.json(
        { success: false, error: 'Mission not found' },
        { status: 404 }
      );
    }
    
    // Validate required fields
    if (!body.name || !body.missionId) {
      return NextResponse.json(
        { success: false, error: 'Group name and mission ID are required' },
        { status: 400 }
      );
    }
    
    // Check if group name already exists in this mission
    const existingGroup = await MentorshipGroupV2.findOne({
      name: body.name,
      missionId: body.missionId
    });
    
    if (existingGroup) {
      return NextResponse.json(
        { success: false, error: 'Group name already exists in this mission' },
        { status: 400 }
      );
    }
    
    // Create the group
    const groupData = {
      name: body.name,
      description: body.description || '',
      missionId: body.missionId,
      batchId: mission.batchId, // Get batchId from the mission
      primaryMentorId: body.primaryMentorId || null,
      students: body.studentIds || [],
      mentors: body.mentorIds || [],
      maxStudents: body.maxStudents || 0, // 0 = unlimited
      groupType: body.groupType || 'mentorship',
      focusArea: [], // Focus areas removed from group creation
      skillLevel: body.skillLevel || 'beginner',
      status: body.status || 'active',
      createdBy: user._id
    };
    
    const group = new MentorshipGroupV2(groupData);
    await group.save();
    
    // Update mission to include this group
    await mission.addGroup(group._id);

    // Auto-create group discussion channel (visibility: group)
    try {
      const ChannelModel = Channel as unknown as Model<IChannel>;
      await ChannelModel.create({
        missionId: group.missionId,
        groupId: group._id,
        type: 'group-discussion',
        visibility: 'group',
        allowedRoles: ['admin','manager','sre','mentor','student'],
        createdBy: user._id,
      } as any);
    } catch (autoErr) {
      console.error('Auto-create discussion channel failed:', autoErr);
      // non-fatal
    }
    
    // Populate references for response
    await group.populate('missionId', 'code title status');
    await group.populate('primaryMentorId', 'name email role');
    await group.populate('students', 'name email studentId');
    await group.populate('mentors', 'name email role');
    
    return NextResponse.json({
      success: true,
      data: group,
      message: 'Mentorship group created successfully'
    }, { status: 201 });
    
  } catch (error: unknown) {
    console.error('V2 Mentorship Groups POST Error:', error);
    
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ValidationError') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed', 
          details: (error as any).errors 
        },
        { status: 400 }
      );
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to create mentorship group';
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage
      },
      { status: 500 }
    );
  }
}