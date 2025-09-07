import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    
    // Check authentication and authorization
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["admin"]);
    
    const { id } = await params;
    
    // Find the user first
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if user is actually soft-deleted
    if (!existingUser.deletedAt) {
      return NextResponse.json(
        { error: 'User is not deleted' },
        { status: 400 }
      );
    }
    
    // Restore the user
    const restoredUser = await User.findByIdAndUpdate(
      id,
      {
        $unset: { deletedAt: 1, deletedBy: 1 },
        isActive: true
      },
      { new: true, runValidators: true }
    ).select('-password');
    
    return NextResponse.json({ 
      success: true, 
      message: 'User restored successfully',
      user: restoredUser 
    });
    
  } catch (error) {
    console.error('Error restoring user:', error);
    return NextResponse.json(
      { error: 'Failed to restore user' },
      { status: 500 }
    );
  }
}
