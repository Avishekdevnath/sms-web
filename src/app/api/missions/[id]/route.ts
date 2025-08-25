import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Mission } from '@/models/Mission';

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
      .populate('students.mentorId', 'name email')
      .lean();

    if (!mission) {
      return NextResponse.json(
        { error: { message: 'Mission not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json(mission);
  } catch (error) {
    console.error('Error fetching mission:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
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
    
    const { id } = await params;
    const mission = await Mission.findById(id);
    if (!mission) {
      return NextResponse.json({ error: { message: "Mission not found" } }, { status: 404 });
    }
    
    // Check if mission has active students
    const hasActiveStudents = mission.students.some(student => student.status === 'active');
    if (hasActiveStudents) {
      return NextResponse.json({ 
        error: { 
          message: "Cannot delete mission with active students. Please archive it instead." 
        } 
      }, { status: 400 });
    }
    
    await Mission.findByIdAndDelete(id);
    
    return NextResponse.json({ message: "Mission deleted successfully" });
  } catch (error) {
    console.error('Error deleting mission:', error);
    return NextResponse.json({ error: { message: "Internal server error" } }, { status: 500 });
  }
} 