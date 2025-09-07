import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";
import bcrypt from "bcryptjs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    
    // Check authentication and authorization
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["admin"]);
    
    const { id } = await params;
    
    const user = await User.findById(id).select('-password').lean();
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Ensure we're not returning student users
    if (user.role === "student") {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    
    // Check authentication and authorization
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["admin"]);
    
    const { id } = await params;
    const body = await req.json();
    
    // Find the user first
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Ensure we're not modifying student users
    if (existingUser.role === "student") {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }
    
    // Prevent admin from modifying themselves
    if (id === me?._id) {
      return NextResponse.json(
        { error: 'Cannot modify your own account from this interface' },
        { status: 403 }
      );
    }
    
    // Prepare update data
    const updateData: any = {};
    
    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined) updateData.email = body.email.toLowerCase();
    if (body.role !== undefined) {
      // Validate role
      const allowedRoles = ["admin", "developer", "manager", "sre", "mentor"];
      if (!allowedRoles.includes(body.role)) {
        return NextResponse.json(
          { error: 'Invalid role' },
          { status: 400 }
        );
      }
      updateData.role = body.role;
    }
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    
    // Handle password update if provided
    if (body.password) {
      if (body.password.length < 6) {
        return NextResponse.json(
          { error: 'Password must be at least 6 characters long' },
          { status: 400 }
        );
      }
      updateData.password = await bcrypt.hash(body.password, 12);
      updateData.mustChangePassword = false;
    }
    
    // Check if email is being changed and if it already exists
    if (body.email && body.email !== existingUser.email) {
      const emailExists = await User.findOne({ 
        email: body.email.toLowerCase(),
        _id: { $ne: id }
      });
      if (emailExists) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 409 }
        );
      }
    }
    
    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
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
    requireRoles(me, ["admin"]);
    
    const { id } = await params;
    
    // Get query parameters for delete type
    const { searchParams } = new URL(req.url);
    const hardDelete = searchParams.get("hard") === "true";
    
    // Find the user first
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Ensure we're not deleting student users
    if (existingUser.role === "student") {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }
    
    // Prevent admin from deleting themselves
    if (id === me?._id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 403 }
      );
    }
    
    if (hardDelete) {
      // Hard delete - actually remove from database
      await User.findByIdAndDelete(id);
      return NextResponse.json({ 
        success: true, 
        message: 'User permanently deleted' 
      });
    } else {
      // Soft delete - mark as deleted instead of actually removing
      await User.findByIdAndUpdate(id, {
        deletedAt: new Date(),
        deletedBy: me?._id,
        isActive: false
      });
      return NextResponse.json({ 
        success: true, 
        message: 'User soft deleted (can be restored)' 
      });
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
