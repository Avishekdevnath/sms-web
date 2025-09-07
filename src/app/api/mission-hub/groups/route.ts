import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyUserToken } from '@/lib/auth';
import Group from '@/models/Group';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const missionId = searchParams.get('missionId');

    if (!missionId) {
      return NextResponse.json({ error: 'Mission ID is required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    const groups = await Group.findByMission(missionId);
    return NextResponse.json({ groups });
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { name, description, maxStudents, missionId } = body;

    if (!name || !missionId) {
      return NextResponse.json({ error: 'Name and mission ID are required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    const group = new Group({
      name,
      description,
      maxStudents,
      missionId
    });

    await group.save();

    return NextResponse.json({ 
      success: true, 
      group
    });
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
