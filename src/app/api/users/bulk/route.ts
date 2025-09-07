import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // Check authentication and authorization
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["admin"]);
    
    const body = await req.json();
    const { action, userIds } = body;
    
    if (!action || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request. Action and userIds array are required.' },
        { status: 400 }
      );
    }
    
    // Validate action
    const validActions = ['activate', 'deactivate', 'delete'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be one of: activate, deactivate, delete' },
        { status: 400 }
      );
    }
    
    // Prevent admin from modifying themselves
    if (userIds.includes(me?._id)) {
      return NextResponse.json(
        { error: 'Cannot modify your own account' },
        { status: 403 }
      );
    }
    
    let updateData: any = {};
    let result: any;
    
    switch (action) {
      case 'activate':
        updateData = { isActive: true };
        result = await User.updateMany(
          { 
            _id: { $in: userIds },
            role: { $ne: "student" }, // Only allow non-student users
            deletedAt: { $exists: false }
          },
          updateData
        );
        break;
        
      case 'deactivate':
        updateData = { isActive: false };
        result = await User.updateMany(
          { 
            _id: { $in: userIds },
            role: { $ne: "student" }, // Only allow non-student users
            deletedAt: { $exists: false }
          },
          updateData
        );
        break;
        
      case 'delete':
        // Soft delete
        updateData = { 
          deletedAt: new Date(),
          deletedBy: me?._id,
          isActive: false
        };
        result = await User.updateMany(
          { 
            _id: { $in: userIds },
            role: { $ne: "student" }, // Only allow non-student users
            deletedAt: { $exists: false }
          },
          updateData
        );
        break;
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
    
    return NextResponse.json({
      success: true,
      message: `Successfully ${action}d ${result.modifiedCount} users`,
      modifiedCount: result.modifiedCount,
      action
    });
    
  } catch (error) {
    console.error('Error performing bulk user operation:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk operation' },
      { status: 500 }
    );
  }
}
