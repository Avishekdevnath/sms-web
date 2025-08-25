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
    const user = await getAuthUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    if (!can(user, 'student.create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { batchId } = await req.json();

    if (!batchId) {
      return NextResponse.json({ error: 'Batch ID is required' }, { status: 400 });
    }

    // Get all pending emails for the batch
    const stagingEmails = await StagingEmail.find({ 
      batchId, 
      status: 'PENDING_UPLOAD' 
    }).populate('batchId');

    const validationResults = [];

    for (const stagingEmail of stagingEmails) {
      const email = stagingEmail.email;
      const validationErrors = [];

      // Check if email already exists in User collection
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        validationErrors.push('Email already registered in system');
      }

      // Check if email already exists in other batches
      const existingInOtherBatches = await StagingEmail.findOne({
        email,
        batchId: { $ne: batchId },
        status: { $in: ['PENDING_UPLOAD', 'VALIDATED', 'APPROVED'] }
      });
      if (existingInOtherBatches) {
        validationErrors.push('Email already in another batch');
      }

      // Basic email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        validationErrors.push('Invalid email format');
      }

      // Update staging email status
      if (validationErrors.length === 0) {
        stagingEmail.status = 'VALIDATED';
        stagingEmail.validationErrors = [];
      } else {
        stagingEmail.status = 'REJECTED';
        stagingEmail.validationErrors = validationErrors;
      }

      await stagingEmail.save();

      validationResults.push({
        email,
        status: stagingEmail.status,
        errors: validationErrors
      });
    }

    return NextResponse.json({
      success: true,
      total: stagingEmails.length,
      validated: validationResults.filter(r => r.status === 'VALIDATED').length,
      rejected: validationResults.filter(r => r.status === 'REJECTED').length,
      results: validationResults
    });

  } catch (error) {
    console.error('Error in staging validation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
