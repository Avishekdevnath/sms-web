import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Batch } from '@/models/Batch';
import { StudentBatchMembership } from '@/models/StudentBatchMembership';
import { getAuthUserFromRequest } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const me = await getAuthUserFromRequest(request);
    if (!me) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const batchCode = searchParams.get('batchCode');

    if (!batchCode) {
      return NextResponse.json({ error: 'Batch Code is required' }, { status: 400 });
    }

    await connectToDatabase();

    console.log(`Fetching students for batch: ${batchCode}`);

    // Find batch by code
    const batch = await Batch.findOne({ code: batchCode });
    if (!batch) {
      console.log(`Batch not found: ${batchCode}`);
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    console.log(`Found batch: ${batch._id} (${batch.code})`);

    // Get all student memberships for this batch
    const memberships = await StudentBatchMembership.find({ 
      batchId: batch._id 
    }).populate('studentId', 'name email userId role createdAt').lean();
    
    console.log(`Found ${memberships.length} student memberships for batch ${batchCode}`);

    // Extract student data from memberships
    const students = memberships.map(membership => {
      if (!membership.studentId) {
        console.warn(`StudentBatchMembership ${membership._id} has no populated studentId`);
        return null;
      }
      
      return {
        _id: membership.studentId._id,
        name: membership.studentId.name,
        email: membership.studentId.email,
        studentId: membership.studentId.userId,
        role: membership.studentId.role,
        createdAt: membership.createdAt
      };
    }).filter(Boolean); // Remove null entries

    console.log(`Returning ${students.length} valid students for batch ${batchCode}`);

    return NextResponse.json({
      success: true,
      data: { students }
    });

  } catch (error) {
    console.error('Error retrieving batch students:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
