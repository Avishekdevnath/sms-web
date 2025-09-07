import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Assignment } from "@/models/Assignment";
import { User } from "@/models/User";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";
import { handleApiError, createErrorResponse } from "@/utils/apiHelpers";
import { processEmailList, validateEmailSubmission, extractEmailsFromText } from "@/utils/emailProcessing";
import { rateLimitMiddleware, EMAIL_SUBMISSION_RATE_LIMIT, GLOBAL_EMAIL_SUBMISSION_RATE_LIMIT } from "@/utils/rateLimiting";
import { sendAssignmentEmailSubmissionNotifications, logNotificationActivity } from "@/utils/notificationUtils";
import { Types } from "mongoose";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    // Rate limiting check
    const userRateLimit = rateLimitMiddleware(req, EMAIL_SUBMISSION_RATE_LIMIT, false);
    if (!userRateLimit.allowed) {
      return NextResponse.json(
        { error: userRateLimit.error, remaining: userRateLimit.remaining, resetTime: userRateLimit.resetTime },
        { status: 429, headers: { 'X-RateLimit-Remaining': userRateLimit.remaining.toString() } }
      );
    }
    
    const globalRateLimit = rateLimitMiddleware(req, GLOBAL_EMAIL_SUBMISSION_RATE_LIMIT, true);
    if (!globalRateLimit.allowed) {
      return NextResponse.json(
        { error: globalRateLimit.error, remaining: globalRateLimit.remaining, resetTime: globalRateLimit.resetTime },
        { status: 429, headers: { 'X-RateLimit-Remaining': globalRateLimit.remaining.toString() } }
      );
    }
    
    const me = await getAuthUserFromRequest(req);
    if (!me) {
      return createErrorResponse('Unauthorized', 401);
    }
    requireRoles(me, ["admin", "manager", "developer", "sre"]);
    
    const { id } = params;
    
    if (!Types.ObjectId.isValid(id)) {
      return createErrorResponse('Invalid assignment ID', 400);
    }
    
    const body = await req.json();
    const { emailList, emailText } = body;
    
    // Extract emails from either list or text
    let emails: string[] = [];
    if (emailList && Array.isArray(emailList)) {
      emails = emailList;
    } else if (emailText && typeof emailText === 'string') {
      emails = extractEmailsFromText(emailText);
    } else {
      return createErrorResponse('Either emailList or emailText is required', 400);
    }
    
    // Validate submission constraints
    const validation = validateEmailSubmission(emails);
    if (!validation.isValid) {
      return createErrorResponse(validation.error!, 400);
    }
    
    // Check if assignment exists and is published
    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return createErrorResponse('Assignment not found', 404);
    }
    
    if (!assignment.publishedAt) {
      return createErrorResponse('Only published assignments can receive email submissions', 400);
    }
    
    // Get existing emails for duplicate checking
    const existingEmails = assignment.completedEmails.map(ce => ce.email);
    
    // Process emails
    const processingResult = processEmailList(emails, existingEmails);
    
    if (processingResult.validEmails.length === 0) {
      return NextResponse.json({
        message: 'No new valid emails to add',
        processingResult,
        duplicates: processingResult.duplicateEmails,
        errors: processingResult.invalidEmails
      });
    }
    
    // Find students by email for valid emails
    const studentEmails = await User.find({
      email: { $in: processingResult.validEmails },
      role: 'student'
    }).select('_id email name studentId');
    
    const studentEmailMap = new Map(
      studentEmails.map(student => [student.email, student._id])
    );
    
    // Prepare new completed emails
    const newCompletedEmails = processingResult.validEmails.map(email => ({
      email,
      studentId: studentEmailMap.get(email) || null,
      addedAt: new Date(),
      addedBy: me._id
    }));
    
    // Create submission record
    const submissionRecord = {
      submittedBy: me._id,
      submittedAt: new Date(),
      emailList: processingResult.validEmails,
      processedCount: processingResult.validEmails.length,
      successCount: processingResult.validEmails.length,
      errorCount: processingResult.invalidEmails.length,
      status: processingResult.invalidEmails.length > 0 ? 'partial' : 'completed'
    };
    
    // Update assignment with new emails and submission record
    const updatedAssignment = await Assignment.findByIdAndUpdate(
      id,
      {
        $push: {
          completedEmails: { $each: newCompletedEmails },
          emailSubmissions: submissionRecord
        }
      },
      { new: true }
    )
      .populate('courseOfferingId', 'title code')
      .populate('createdBy', 'name email')
      .populate('completedEmails.studentId', 'name email studentId')
      .populate('completedEmails.addedBy', 'name email')
      .populate('emailSubmissions.submittedBy', 'name email')
      .lean();
    
    // Send notifications to all non-student members (background process)
    try {
      const notificationData = {
        assignmentId: id,
        assignmentTitle: assignment.title,
        courseOfferingName: assignment.courseOfferingId?.title || 'Unknown Course',
        submittedBy: {
          name: me.name || 'Unknown',
          email: me.email,
          role: me.role
        },
        processingResult: {
          totalEmails: processingResult.validEmails.length + processingResult.duplicateEmails.length + processingResult.invalidEmails.length,
          newEmails: processingResult.validEmails.length,
          duplicates: processingResult.duplicateEmails.length,
          errors: processingResult.invalidEmails.length
        },
        submissionTime: new Date()
      };
      
      // Send notifications asynchronously (don't wait for completion)
      sendAssignmentEmailSubmissionNotifications(notificationData)
        .then(result => {
          logNotificationActivity('email_submission', [], result);
        })
        .catch(error => {
          console.error('Failed to send notifications:', error);
        });
    } catch (notificationError) {
      console.error('Notification error:', notificationError);
      // Don't fail the main operation if notifications fail
    }
    
    return NextResponse.json({
      message: 'Emails processed successfully',
      data: {
        assignment: updatedAssignment,
        processingResult,
        duplicates: processingResult.duplicateEmails,
        errors: processingResult.invalidEmails,
        newEmailsAdded: processingResult.validEmails.length
      }
    });
    
  } catch (error) {
    return handleApiError(error);
  }
}
