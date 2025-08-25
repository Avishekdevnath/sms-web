import nodemailer from 'nodemailer';

// Email delivery status
export type EmailDeliveryStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';

// Email tracking record
export interface EmailTracking {
  id: string;
  to: string;
  subject: string;
  template: string;
  status: EmailDeliveryStatus;
  sentAt?: Date;
  deliveredAt?: Date;
  failedAt?: Date;
  error?: string;
  retryCount: number;
  maxRetries: number;
  scheduledFor?: Date;
  metadata?: Record<string, any>;
}

// Email preferences
export interface EmailPreferences {
  userId: string;
  emailNotifications: boolean;
  marketingEmails: boolean;
  weeklyDigest: boolean;
  assignmentReminders: boolean;
  attendanceAlerts: boolean;
  customPreferences?: Record<string, boolean>;
}

// Email template
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html: string;
  text?: string;
  variables: string[];
  category: 'system' | 'marketing' | 'notification' | 'custom';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Bulk email operation
export interface BulkEmailOperation {
  id: string;
  name: string;
  templateId: string;
  recipients: string[];
  variables: Record<string, any>;
  scheduledFor?: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: {
    total: number;
    sent: number;
    failed: number;
    pending: number;
  };
  createdAt: Date;
  completedAt?: Date;
}

class EmailService {
  private transporter!: nodemailer.Transporter;
  private templates: Map<string, EmailTemplate> = new Map();
  private tracking: Map<string, EmailTracking> = new Map();
  private preferences: Map<string, EmailPreferences> = new Map();
  private bulkOperations: Map<string, BulkEmailOperation> = new Map();
  private initialized: boolean = false;

  constructor() {
    // Initialize default templates immediately
    this.initializeDefaultTemplates();
    
    // Initialize transporter asynchronously
    this.initializeTransporter();
  }

  private async initializeTransporter() {
    try {
      if (process.env.NODE_ENV === 'production') {
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
      } else {
        // Development: Try Gmail first, fallback to Ethereal for testing
        if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
          // Use Gmail SMTP for actual email sending
          this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.GMAIL_USER,
              pass: process.env.GMAIL_APP_PASSWORD
            }
          });
          
          // Test the connection
          this.transporter.verify((error, success) => {
            if (error) {
              console.log('❌ Gmail connection failed:', error.message);
              this.setupEtherealEmail();
            } else {
              console.log('✅ Gmail email service connected successfully');
            }
          });
        } else {
          // Use Ethereal Email for testing (free, no setup required)
          await this.setupEtherealEmail();
        }
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize email transporter:', error);
      // Fallback to mock transporter
      this.setupMockTransporter();
    }
  }

  private setupMockTransporter() {
    this.transporter = {
      sendMail: async (mailOptions: any) => {
        console.log('📧 MOCK EMAIL (not actually sent):');
        console.log('  To:', mailOptions.to);
        console.log('  Subject:', mailOptions.subject);
        console.log('  HTML Preview:', mailOptions.html?.substring(0, 200) + '...');
        return { messageId: 'mock-' + Date.now() };
      }
    } as any;
    this.initialized = true;
  }

  private async setupEtherealEmail() {
    try {
      // Create test account on Ethereal Email
      const testAccount = await nodemailer.createTestAccount();
      
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      
      console.log('✅ Ethereal Email service connected successfully');
      console.log('📧 Test account created:', testAccount.user);
      console.log('🔗 View emails at: https://ethereal.email');
    } catch (error) {
      console.log('❌ Failed to setup Ethereal Email:', error);
      // Fallback to mock transporter
      this.transporter = {
        sendMail: async (mailOptions: any) => {
          console.log('📧 MOCK EMAIL (not actually sent):');
          console.log('  To:', mailOptions.to);
          console.log('  Subject:', mailOptions.subject);
          console.log('  HTML Preview:', mailOptions.html?.substring(0, 200) + '...');
          return { messageId: 'mock-' + Date.now() };
        }
      } as any;
    }
  }

  private initializeDefaultTemplates() {
    const defaultTemplates: EmailTemplate[] = [
      {
        id: 'student-invitation',
        name: 'Student Invitation',
        subject: 'Welcome to {{institutionName}} - Complete Your Profile',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Welcome to {{institutionName}}!</h2>
            <p>Hello {{studentName}},</p>
            <p>You have been invited to join {{institutionName}} as a student. Please complete your profile to get started.</p>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Your Login Details:</h3>
              <p><strong>Email:</strong> {{email}}</p>
              <p><strong>Temporary Password:</strong> {{temporaryPassword}}</p>
            </div>
            <div style="margin: 20px 0;">
              <h3>Next Steps:</h3>
              <ol style="margin-left: 20px;">
                <li>Click the "Login" button below to access your account</li>
                <li>Use your email and temporary password to login</li>
                <li>Complete your profile setup</li>
              </ol>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{loginUrl}}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-right: 10px;">Login to Your Account</a>
              <a href="{{profileUrl}}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Complete Profile</a>
            </div>
            <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">
              If you have any questions, please contact our support team.
            </p>
          </div>
        `,
        text: `
          Welcome to {{institutionName}}!
          
          Hello {{studentName}},
          
          You have been invited to join {{institutionName}} as a student. Please complete your profile to get started.
          
          Your Login Details:
          Email: {{email}}
          Temporary Password: {{temporaryPassword}}
          
          Next Steps:
          1. Login to your account: {{loginUrl}}
          2. Use your email and temporary password
          3. Complete your profile setup: {{profileUrl}}
          
          If you have any questions, please contact our support team.
        `,
        variables: ['institutionName', 'studentName', 'email', 'temporaryPassword', 'profileUrl', 'loginUrl'],
        category: 'system',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'assignment-reminder',
        name: 'Assignment Reminder',
        subject: 'Reminder: {{assignmentTitle}} Due Soon',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Assignment Reminder</h2>
            <p>Hello {{studentName}},</p>
            <p>This is a friendly reminder that your assignment is due soon.</p>
            <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
              <h3>{{assignmentTitle}}</h3>
              <p><strong>Due Date:</strong> {{dueDate}}</p>
              <p><strong>Course:</strong> {{courseName}}</p>
              <p><strong>Max Points:</strong> {{maxPoints}}</p>
            </div>
            <a href="{{assignmentUrl}}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Assignment</a>
          </div>
        `,
        text: `
          Assignment Reminder
          
          Hello {{studentName}},
          
          This is a friendly reminder that your assignment is due soon.
          
          {{assignmentTitle}}
          Due Date: {{dueDate}}
          Course: {{courseName}}
          Max Points: {{maxPoints}}
          
          View Assignment: {{assignmentUrl}}
        `,
        variables: ['studentName', 'assignmentTitle', 'dueDate', 'courseName', 'maxPoints', 'assignmentUrl'],
        category: 'notification',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'attendance-alert',
        name: 'Attendance Alert',
        subject: 'Attendance Alert - {{courseName}}',
    html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f59e0b;">Attendance Alert</h2>
            <p>Hello {{studentName}},</p>
            <p>Your attendance in {{courseName}} has fallen below the required threshold.</p>
            <div style="background-color: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <h3>Current Attendance: {{attendancePercentage}}%</h3>
              <p><strong>Required:</strong> {{requiredPercentage}}%</p>
              <p><strong>Classes Missed:</strong> {{missedClasses}}</p>
            </div>
            <p>Please ensure regular attendance to maintain your academic standing.</p>
        </div>
        `,
        text: `
          Attendance Alert
          
          Hello {{studentName}},
          
          Your attendance in {{courseName}} has fallen below the required threshold.
          
          Current Attendance: {{attendancePercentage}}%
          Required: {{requiredPercentage}}%
          Classes Missed: {{missedClasses}}
          
          Please ensure regular attendance to maintain your academic standing.
        `,
        variables: ['studentName', 'courseName', 'attendancePercentage', 'requiredPercentage', 'missedClasses'],
        category: 'notification',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  // Template Management
  async createTemplate(template: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmailTemplate> {
    const newTemplate: EmailTemplate = {
      ...template,
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.templates.set(newTemplate.id, newTemplate);
    return newTemplate;
  }

  async updateTemplate(id: string, updates: Partial<EmailTemplate>): Promise<EmailTemplate | null> {
    const template = this.templates.get(id);
    if (!template) return null;

    const updatedTemplate: EmailTemplate = {
      ...template,
      ...updates,
      updatedAt: new Date(),
    };

    this.templates.set(id, updatedTemplate);
    return updatedTemplate;
  }

  async getTemplate(id: string): Promise<EmailTemplate | null> {
    return this.templates.get(id) || null;
  }

  async listTemplates(category?: string): Promise<EmailTemplate[]> {
    let templates = Array.from(this.templates.values());
    if (category) {
      templates = templates.filter(t => t.category === category);
    }
    return templates;
  }

  // Email Preferences Management
  async setEmailPreferences(userId: string, preferences: Partial<EmailPreferences>): Promise<EmailPreferences> {
    const existing = this.preferences.get(userId) || {
      userId,
      emailNotifications: true,
      marketingEmails: true,
      weeklyDigest: true,
      assignmentReminders: true,
      attendanceAlerts: true,
      customPreferences: {},
    };

    const updatedPreferences: EmailPreferences = {
      ...existing,
      ...preferences,
    };

    this.preferences.set(userId, updatedPreferences);
    return updatedPreferences;
  }

  async getEmailPreferences(userId: string): Promise<EmailPreferences | null> {
    return this.preferences.get(userId) || null;
  }

  // Email Tracking
  private createTrackingId(): string {
    return `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async trackEmail(to: string, subject: string, template: string, metadata?: Record<string, any>): Promise<string> {
    const trackingId = this.createTrackingId();
    const tracking: EmailTracking = {
      id: trackingId,
      to,
      subject,
      template,
      status: 'pending',
      retryCount: 0,
      maxRetries: 3,
      metadata,
    };

    this.tracking.set(trackingId, tracking);
    return trackingId;
  }

  async updateEmailStatus(trackingId: string, status: EmailDeliveryStatus, error?: string): Promise<void> {
    const tracking = this.tracking.get(trackingId);
    if (!tracking) return;

    tracking.status = status;
    tracking.error = error;

    switch (status) {
      case 'sent':
        tracking.sentAt = new Date();
        break;
      case 'delivered':
        tracking.deliveredAt = new Date();
        break;
      case 'failed':
        tracking.failedAt = new Date();
        break;
    }

    this.tracking.set(trackingId, tracking);
  }

  async getEmailTracking(trackingId: string): Promise<EmailTracking | null> {
    return this.tracking.get(trackingId) || null;
  }

  // Template Variable Replacement
  private replaceVariables(template: string, variables: Record<string, any>): string {
    let result = template;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, String(value));
    });
    return result;
  }

  // Send Email with Template
  async sendTemplateEmail(
    to: string,
    templateId: string,
    variables: Record<string, any>,
    options?: {
      scheduledFor?: Date;
      metadata?: Record<string, any>;
    }
  ): Promise<string> {
    const template = await this.getTemplate(templateId);
    if (!template || !template.isActive) {
      throw new Error(`Template ${templateId} not found or inactive`);
    }

    const subject = this.replaceVariables(template.subject, variables);
    const html = this.replaceVariables(template.html, variables);
    const text = template.text ? this.replaceVariables(template.text, variables) : undefined;

    return this.sendEmail(to, subject, html, text, options);
  }

  // Check if service is ready
  async isReady(): Promise<boolean> {
    if (!this.initialized) {
      let attempts = 0;
      while (!this.initialized && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }
    }
    return this.initialized && !!this.transporter;
  }

  // Send Single Email
  async sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string,
    options?: {
      scheduledFor?: Date;
      metadata?: Record<string, any>;
    }
  ): Promise<string> {
    // Ensure service is ready
    if (!(await this.isReady())) {
      throw new Error('Email service is not ready');
    }

    const trackingId = await this.trackEmail(to, subject, 'custom', options?.metadata);

    if (options?.scheduledFor) {
      // Schedule email for later
      const tracking = this.tracking.get(trackingId);
      if (tracking) {
        tracking.scheduledFor = options.scheduledFor;
        this.tracking.set(trackingId, tracking);
      }
      return trackingId;
    }

    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@example.com',
        to,
        subject,
        html,
        text,
      };

      await this.transporter.sendMail(mailOptions);
      await this.updateEmailStatus(trackingId, 'sent');
      
      return trackingId;
    } catch (error) {
      await this.updateEmailStatus(trackingId, 'failed', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  // Resend Failed Email
  async resendEmail(trackingId: string): Promise<string> {
    const tracking = this.tracking.get(trackingId);
    if (!tracking) {
      throw new Error('Email tracking not found');
    }

    if (tracking.status !== 'failed') {
      throw new Error('Email is not in failed status');
    }

    if (tracking.retryCount >= tracking.maxRetries) {
      throw new Error('Maximum retry attempts reached');
    }

    tracking.retryCount++;
    tracking.status = 'pending';
    this.tracking.set(trackingId, tracking);

    // Re-send the email
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@example.com',
        to: tracking.to,
        subject: tracking.subject,
      };

      await this.transporter.sendMail(mailOptions);
      await this.updateEmailStatus(trackingId, 'sent');
      
      return trackingId;
    } catch (error) {
      await this.updateEmailStatus(trackingId, 'failed', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  // Bulk Email Operations
  async createBulkEmailOperation(
    name: string,
    templateId: string,
    recipients: string[],
    variables: Record<string, any>,
    scheduledFor?: Date
  ): Promise<BulkEmailOperation> {
    const operation: BulkEmailOperation = {
      id: `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      templateId,
      recipients,
      variables,
      scheduledFor,
      status: 'pending',
      progress: {
        total: recipients.length,
        sent: 0,
        failed: 0,
        pending: recipients.length,
      },
      createdAt: new Date(),
    };

    this.bulkOperations.set(operation.id, operation);
    return operation;
  }

  async processBulkEmail(operationId: string): Promise<void> {
    const operation = this.bulkOperations.get(operationId);
    if (!operation) {
      throw new Error('Bulk operation not found');
    }

    operation.status = 'processing';
    this.bulkOperations.set(operationId, operation);

    const template = await this.getTemplate(operation.templateId);
    if (!template) {
      operation.status = 'failed';
      this.bulkOperations.set(operationId, operation);
      throw new Error('Template not found');
    }

    for (const recipient of operation.recipients) {
      try {
        await this.sendTemplateEmail(recipient, operation.templateId, operation.variables);
        operation.progress.sent++;
        operation.progress.pending--;
      } catch (error) {
        operation.progress.failed++;
        operation.progress.pending--;
        console.error(`Failed to send email to ${recipient}:`, error);
      }
    }

    operation.status = 'completed';
    operation.completedAt = new Date();
    this.bulkOperations.set(operationId, operation);
  }

  async getBulkOperation(operationId: string): Promise<BulkEmailOperation | null> {
    return this.bulkOperations.get(operationId) || null;
  }

  async listBulkOperations(): Promise<BulkEmailOperation[]> {
    return Array.from(this.bulkOperations.values());
  }

  // Legacy method for backward compatibility
  async studentInvitation(email: string, name: string, temporaryPassword: string, profileUrl: string): Promise<string> {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    return this.sendTemplateEmail(email, 'student-invitation', {
      institutionName: process.env.INSTITUTION_NAME || 'Our Institution',
      studentName: name,
      email,
      temporaryPassword,
      profileUrl,
      loginUrl: `${baseUrl}/login`,
    });
  }

  // Test connection method
  async testConnection(): Promise<boolean> {
    try {
      // Wait for initialization if not ready
      if (!this.initialized) {
        console.log('Email service not yet initialized, waiting...');
        let attempts = 0;
        while (!this.initialized && attempts < 10) {
          await new Promise(resolve => setTimeout(resolve, 500));
          attempts++;
        }
        
        if (!this.initialized) {
          console.error('Email service failed to initialize after 5 seconds');
          return false;
        }
      }
      
      if (!this.transporter) {
        console.error('No email transporter available');
        return false;
      }
      
      // Verify the connection
      return new Promise((resolve) => {
        this.transporter.verify((error, success) => {
          if (error) {
            console.error('Email connection test failed:', error);
            resolve(false);
          } else {
            console.log('Email connection test successful');
            resolve(true);
          }
        });
      });
    } catch (error) {
      console.error('Email connection test error:', error);
      return false;
    }
  }

  // Alias for backward compatibility
  async sendStudentInvitation(email: string, temporaryPassword: string, name: string): Promise<string> {
    const profileUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/profile-complete`;
    return this.studentInvitation(email, name, temporaryPassword, profileUrl);
  }
}

// Export singleton instance
export const emailService = new EmailService();