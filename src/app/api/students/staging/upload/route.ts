import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/rbac';
import { can } from '@/lib/rbac';
import { StagingEmail } from '@/models/StagingEmail';
import { EnrollmentBatch } from '@/models/EnrollmentBatch';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(req: NextRequest) {
  try {
    // Connect to database
    await connectToDatabase();

    // Get authenticated user
    const user = await getAuthUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    if (!can(user, 'student.create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { emails, batchId } = await req.json();

    // Validate input
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: 'Emails array is required' }, { status: 400 });
    }

    if (!batchId) {
      return NextResponse.json({ error: 'Batch ID is required' }, { status: 400 });
    }

    // Verify batch exists
    const batch = await EnrollmentBatch.findById(batchId);
    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    // Process emails
    const results = [];
    const errors = [];

    for (const email of emails) {
      try {
        // Check if email already exists in staging
        const existingStaging = await StagingEmail.findOne({ email, batchId });
        if (existingStaging) {
          errors.push({ email, error: 'Email already in staging for this batch' });
          continue;
        }

        // Create staging email record
        const stagingEmail = new StagingEmail({
          email: email.toLowerCase().trim(),
          batchId,
          status: 'PENDING_UPLOAD'
        });

        await stagingEmail.save();
        results.push({ email, status: 'success' });
      } catch (error) {
        errors.push({ email, error: 'Failed to process email' });
      }
    }

    return NextResponse.json({
      success: true,
      total: emails.length,
      processed: results.length,
      errors: errors.length,
      results,
      errors
    });

  } catch (error) {
    console.error('Error in staging upload:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
