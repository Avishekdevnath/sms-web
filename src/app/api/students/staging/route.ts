import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/rbac';
import { can } from '@/lib/rbac';
import { StagingEmail } from '@/models/StagingEmail';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  try {
    // Connect to database
    await connectToDatabase();

    // Get authenticated user
    const user = await getAuthUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    if (!can(user, 'student.read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get('batchId');

    if (!batchId) {
      return NextResponse.json({ error: 'Batch ID is required' }, { status: 400 });
    }

    // Get staging emails for the batch
    const stagingEmails = await StagingEmail.find({ batchId })
      .populate('batchId', 'title code')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      stagingEmails,
      total: stagingEmails.length
    });

  } catch (error) {
    console.error('Error fetching staging emails:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
