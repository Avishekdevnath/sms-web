import { User } from "@/models/User";
import { emailService } from "@/lib/email";
import { Types } from "mongoose";

export interface NotificationRecipient {
  _id: Types.ObjectId;
  name: string;
  email: string;
  role: string;
}

export interface AssignmentNotificationData {
  assignmentId: string;
  assignmentTitle: string;
  courseOfferingName: string;
  submittedBy: {
    name: string;
    email: string;
    role: string;
  };
  processingResult: {
    totalEmails: number;
    newEmails: number;
    duplicates: number;
    errors: number;
  };
  submissionTime: Date;
}

export interface NotificationTemplate {
  subject: string;
  html: string;
  text: string;
}

/**
 * Gets all non-student members for notifications
 */
export async function getNonStudentMembers(): Promise<NotificationRecipient[]> {
  const users = await User.find({
    role: { $nin: ['student'] },
    email: { $exists: true, $ne: null }
  }).select('_id name email role').lean();
  
  return users.map(user => ({
    _id: user._id,
    name: user.name || 'Unknown',
    email: user.email,
    role: user.role
  }));
}

/**
 * Gets non-student members by specific roles
 */
export async function getNonStudentMembersByRoles(roles: string[]): Promise<NotificationRecipient[]> {
  const users = await User.find({
    role: { $in: roles },
    email: { $exists: true, $ne: null }
  }).select('_id name email role').lean();
  
  return users.map(user => ({
    _id: user._id,
    name: user.name || 'Unknown',
    email: user.email,
    role: user.role
  }));
}

/**
 * Creates email notification template for assignment email submission
 */
export function createAssignmentEmailSubmissionTemplate(data: AssignmentNotificationData): NotificationTemplate {
  const { assignmentTitle, courseOfferingName, submittedBy, processingResult, submissionTime } = data;
  
  const subject = `Assignment Email Submission: ${assignmentTitle}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #333; margin: 0 0 10px 0;">Assignment Email Submission Notification</h2>
        <p style="color: #666; margin: 0;">New email submission has been processed for an assignment.</p>
      </div>
      
      <div style="background-color: white; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px;">
        <h3 style="color: #333; margin: 0 0 15px 0;">Assignment Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f3f4; font-weight: bold; width: 30%;">Assignment:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f3f4;">${assignmentTitle}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f3f4; font-weight: bold;">Course:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f3f4;">${courseOfferingName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f3f4; font-weight: bold;">Submitted By:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f3f4;">${submittedBy.name} (${submittedBy.role})</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f3f4; font-weight: bold;">Submitted At:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f3f4;">${submissionTime.toLocaleString()}</td>
          </tr>
        </table>
        
        <h3 style="color: #333; margin: 20px 0 15px 0;">Processing Results</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 20px;">
          <div style="background-color: #e3f2fd; padding: 15px; border-radius: 6px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #1976d2;">${processingResult.totalEmails}</div>
            <div style="color: #666; font-size: 14px;">Total Emails</div>
          </div>
          <div style="background-color: #e8f5e8; padding: 15px; border-radius: 6px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #2e7d32;">${processingResult.newEmails}</div>
            <div style="color: #666; font-size: 14px;">New Emails</div>
          </div>
          <div style="background-color: #fff3e0; padding: 15px; border-radius: 6px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #f57c00;">${processingResult.duplicates}</div>
            <div style="color: #666; font-size: 14px;">Duplicates</div>
          </div>
          <div style="background-color: #ffebee; padding: 15px; border-radius: 6px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #d32f2f;">${processingResult.errors}</div>
            <div style="color: #666; font-size: 14px;">Errors</div>
          </div>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin-top: 20px;">
          <p style="margin: 0; color: #666; font-size: 14px;">
            This notification was sent to all non-student members of the system. 
            You can view the assignment details and email submissions in the admin dashboard.
          </p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
        <p style="color: #666; font-size: 12px; margin: 0;">
          Student Management System - Assignment Email Submission Notification
        </p>
      </div>
    </div>
  `;
  
  const text = `
Assignment Email Submission Notification

Assignment: ${assignmentTitle}
Course: ${courseOfferingName}
Submitted By: ${submittedBy.name} (${submittedBy.role})
Submitted At: ${submissionTime.toLocaleString()}

Processing Results:
- Total Emails: ${processingResult.totalEmails}
- New Emails: ${processingResult.newEmails}
- Duplicates: ${processingResult.duplicates}
- Errors: ${processingResult.errors}

This notification was sent to all non-student members of the system.
You can view the assignment details and email submissions in the admin dashboard.

Student Management System - Assignment Email Submission Notification
  `;
  
  return { subject, html, text };
}

/**
 * Sends assignment email submission notifications to all non-student members
 */
export async function sendAssignmentEmailSubmissionNotifications(
  data: AssignmentNotificationData
): Promise<{ sent: number; failed: number; errors: string[] }> {
  try {
    const recipients = await getNonStudentMembers();
    const template = createAssignmentEmailSubmissionTemplate(data);
    
    const results = await Promise.allSettled(
      recipients.map(recipient => 
        emailService.sendEmail(
          recipient.email,
          template.subject,
          template.html,
          template.text
        )
      )
    );
    
    const sent = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;
    const errors = results
      .filter(result => result.status === 'rejected')
      .map(result => (result as PromiseRejectedResult).reason?.message || 'Unknown error');
    
    return { sent, failed, errors };
  } catch (error) {
    console.error('Failed to send assignment email submission notifications:', error);
    return { sent: 0, failed: 0, errors: [error instanceof Error ? error.message : 'Unknown error'] };
  }
}

/**
 * Sends notifications to specific roles only
 */
export async function sendAssignmentEmailSubmissionNotificationsToRoles(
  data: AssignmentNotificationData,
  roles: string[]
): Promise<{ sent: number; failed: number; errors: string[] }> {
  try {
    const recipients = await getNonStudentMembersByRoles(roles);
    const template = createAssignmentEmailSubmissionTemplate(data);
    
    const results = await Promise.allSettled(
      recipients.map(recipient => 
        emailService.sendEmail(
          recipient.email,
          template.subject,
          template.html,
          template.text
        )
      )
    );
    
    const sent = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;
    const errors = results
      .filter(result => result.status === 'rejected')
      .map(result => (result as PromiseRejectedResult).reason?.message || 'Unknown error');
    
    return { sent, failed, errors };
  } catch (error) {
    console.error('Failed to send assignment email submission notifications to roles:', error);
    return { sent: 0, failed: 0, errors: [error instanceof Error ? error.message : 'Unknown error'] };
  }
}

/**
 * Creates a simple notification template for general assignment updates
 */
export function createAssignmentUpdateTemplate(
  assignmentTitle: string,
  updateType: 'published' | 'unpublished' | 'modified',
  updatedBy: { name: string; email: string; role: string }
): NotificationTemplate {
  const actionText = {
    published: 'published',
    unpublished: 'unpublished',
    modified: 'modified'
  }[updateType];
  
  const subject = `Assignment ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}: ${assignmentTitle}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #333; margin: 0 0 10px 0;">Assignment ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}</h2>
        <p style="color: #666; margin: 0;">An assignment has been ${actionText}.</p>
      </div>
      
      <div style="background-color: white; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px;">
        <h3 style="color: #333; margin: 0 0 15px 0;">Assignment Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f3f4; font-weight: bold; width: 30%;">Assignment:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f3f4;">${assignmentTitle}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f3f4; font-weight: bold;">Action:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f3f4;">${actionText.charAt(0).toUpperCase() + actionText.slice(1)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f3f4; font-weight: bold;">Updated By:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f3f4;">${updatedBy.name} (${updatedBy.role})</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f3f4; font-weight: bold;">Updated At:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f3f4;">${new Date().toLocaleString()}</td>
          </tr>
        </table>
      </div>
      
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
        <p style="color: #666; font-size: 12px; margin: 0;">
          Student Management System - Assignment Update Notification
        </p>
      </div>
    </div>
  `;
  
  const text = `
Assignment ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}

Assignment: ${assignmentTitle}
Action: ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}
Updated By: ${updatedBy.name} (${updatedBy.role})
Updated At: ${new Date().toLocaleString()}

Student Management System - Assignment Update Notification
  `;
  
  return { subject, html, text };
}

/**
 * Sends assignment update notifications to all non-student members
 */
export async function sendAssignmentUpdateNotifications(
  assignmentTitle: string,
  updateType: 'published' | 'unpublished' | 'modified',
  updatedBy: { name: string; email: string; role: string }
): Promise<{ sent: number; failed: number; errors: string[] }> {
  try {
    const recipients = await getNonStudentMembers();
    const template = createAssignmentUpdateTemplate(assignmentTitle, updateType, updatedBy);
    
    const results = await Promise.allSettled(
      recipients.map(recipient => 
        emailService.sendEmail(
          recipient.email,
          template.subject,
          template.html,
          template.text
        )
      )
    );
    
    const sent = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;
    const errors = results
      .filter(result => result.status === 'rejected')
      .map(result => (result as PromiseRejectedResult).reason?.message || 'Unknown error');
    
    return { sent, failed, errors };
  } catch (error) {
    console.error('Failed to send assignment update notifications:', error);
    return { sent: 0, failed: 0, errors: [error instanceof Error ? error.message : 'Unknown error'] };
  }
}

/**
 * Logs notification activity for audit purposes
 */
export function logNotificationActivity(
  type: 'email_submission' | 'assignment_update',
  recipients: NotificationRecipient[],
  result: { sent: number; failed: number; errors: string[] }
): void {
  console.log(`[NOTIFICATION] ${type.toUpperCase()}`, {
    timestamp: new Date().toISOString(),
    recipients: recipients.length,
    sent: result.sent,
    failed: result.failed,
    errors: result.errors.length > 0 ? result.errors : undefined
  });
}
