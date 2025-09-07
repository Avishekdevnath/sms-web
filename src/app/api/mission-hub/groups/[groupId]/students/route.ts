import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyUserToken } from '@/lib/auth';
import Group from '@/models/Group';

export async function POST(
  request: NextRequest,
  { params }: { params: { groupId: string } }
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

    const { groupId } = params;
    const body = await request.json();
    const { studentIds } = body;

    if (!studentIds || !Array.isArray(studentIds)) {
      return NextResponse.json({ error: 'Student IDs array is required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const group = await Group.findById(groupId);

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Add students to the group
    for (const studentId of studentIds) {
      await group.addStudent(studentId);
    }

    return NextResponse.json({ 
      success: true, 
      message: `${studentIds.length} student(s) added to group`
    });
  } catch (error) {
    console.error('Error adding students to group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
