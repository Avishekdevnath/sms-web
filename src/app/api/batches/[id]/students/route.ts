import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { StudentBatchMembership } from "@/models/StudentBatchMembership";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    
    const { id } = await params;
    
    // Get all student memberships for this batch
    const memberships = await StudentBatchMembership.find({ 
      batchId: id 
    }).populate('studentId', 'name email userId role createdAt').lean();
    
    // Extract student data from memberships
    const students = memberships.map(membership => ({
      _id: membership.studentId._id,
      name: membership.studentId.name,
      email: membership.studentId.email,
      userId: membership.studentId.userId,
      role: membership.studentId.role,
      createdAt: membership.createdAt
    }));
    
    return NextResponse.json({
      students,
      total: students.length
    });
  } catch (error) {
    console.error('Error fetching batch students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch batch students' },
      { status: 500 }
    );
  }
}
