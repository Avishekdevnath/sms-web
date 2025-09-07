import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyUserToken } from '@/lib/auth';
import Group from '@/models/Group';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { groupId: string; studentId: string } }
) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      // Verify the token
      const tokenUser = verifyUserToken(token);
      
      if (!tokenUser || !tokenUser._id || !tokenUser.role) {
        throw new Error('Invalid token structure');
      }
    } catch (tokenError) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const { groupId, studentId } = params;

    const { db } = await connectToDatabase();
    const group = await Group.findById(groupId);

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    await group.removeStudent(studentId);

    return NextResponse.json({ 
      success: true, 
      message: 'Student removed from group'
    });
  } catch (error) {
    console.error('Error removing student from group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
