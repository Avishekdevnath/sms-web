import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/rbac';
import { can } from '@/lib/rbac';
import { StagingEmail } from '@/models/StagingEmail';
import { User } from '@/models/User';
import { EnrollmentBatch } from '@/models/EnrollmentBatch';
import { generateStudentId } from '@/lib/studentIdGenerator';
import { connectToDatabase } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

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
    if (!can(user, 'student.enroll')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { batchId, emailIds } = await req.json();

    if (!batchId) {
      return NextResponse.json({ error: 'Batch ID is required' }, { status: 400 });
    }

    if (!emailIds || !Array.isArray(emailIds) || emailIds.length === 0) {
      return NextResponse.json({ error: 'Email IDs array is required' }, { status: 400 });
    }

    // Verify batch exists
    const batch = await EnrollmentBatch.findById(batchId);
    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    // Get approved staging emails
    const stagingEmails = await StagingEmail.find({
      _id: { $in: emailIds },
      batchId,
      status: 'APPROVED'
    });

    if (stagingEmails.length === 0) {
      return NextResponse.json({ error: 'No approved emails found to enroll' }, { status: 400 });
    }

    // Get existing student IDs for this batch to generate new ones
    const existingUsers = await User.find({ 
      role: 'student',
      studentId: { $regex: `^B${batch.code}` }
    });
    const existingStudentIds = existingUsers.map(u => u.studentId).filter(Boolean);

    // Enroll students
    let enrolledCount = 0;
    const errors = [];
    const enrolledStudents = [];

    for (const stagingEmail of stagingEmails) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: stagingEmail.email });
        if (existingUser) {
          errors.push({ email: stagingEmail.email, error: 'User already exists' });
          continue;
        }

        // Generate student ID
        const studentId = await generateStudentId(batchId);
        existingStudentIds.push(studentId);

        // Generate temporary password
        const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
        const hashedPassword = await bcrypt.hash(tempPassword, 12);

        // Create user account
        const newUser = new User({
          email: stagingEmail.email,
          password: hashedPassword,
          role: 'student',
          name: `Student ${studentId}`, // Placeholder name
          isActive: false, // Will be activated after profile completion
          mustChangePassword: true,
          studentId,
          invitedAt: new Date()
        });

        await newUser.save();

        // Update staging email status (optional - could mark as enrolled)
        // stagingEmail.status = 'ENROLLED';
        // await stagingEmail.save();

        enrolledCount++;
        enrolledStudents.push({
          email: stagingEmail.email,
          studentId,
          tempPassword
        });

      } catch (error) {
        console.error(`Error enrolling ${stagingEmail.email}:`, error);
        errors.push({ email: stagingEmail.email, error: 'Failed to create user account' });
      }
    }

    return NextResponse.json({
      success: true,
      total: stagingEmails.length,
      enrolled: enrolledCount,
      errors: errors.length,
      enrolledStudents,
      errors
    });

  } catch (error) {
    console.error('Error in staging enroll:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
