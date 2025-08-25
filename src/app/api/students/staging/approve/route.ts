import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/rbac';
import { can } from '@/lib/rbac';
import { StagingEmail } from '@/models/StagingEmail';
import { User } from '@/models/User';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(req: NextRequest) {
  try {
    // Connect to database
    await connectToDatabase();

    // Get authenticated user
    const userPayload = await getAuthUserFromRequest(req);
    if (!userPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get full user object from database
    const user = await User.findById(userPayload._id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // Check permissions
    if (!can(user, 'student.create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { batchId, emailIds } = await req.json();

    if (!batchId) {
      return NextResponse.json({ error: 'Batch ID is required' }, { status: 400 });
    }

    if (!emailIds || !Array.isArray(emailIds) || emailIds.length === 0) {
      return NextResponse.json({ error: 'Email IDs array is required' }, { status: 400 });
    }

    // Get staging emails to approve
    const stagingEmails = await StagingEmail.find({
      _id: { $in: emailIds },
      batchId,
      status: 'VALIDATED'
    });

    if (stagingEmails.length === 0) {
      return NextResponse.json({ error: 'No valid emails found to approve' }, { status: 400 });
    }

    // Approve emails
    let approvedCount = 0;
    const errors = [];

    for (const stagingEmail of stagingEmails) {
      try {
        stagingEmail.status = 'APPROVED';
        await stagingEmail.save();
        approvedCount++;
      } catch (error) {
        errors.push({ email: stagingEmail.email, error: 'Failed to approve' });
      }
    }

    return NextResponse.json({
      success: true,
      total: stagingEmails.length,
      approved: approvedCount,
      errorCount: errors.length,
      errors
    });

  } catch (error) {
    console.error('Error in staging approve:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
