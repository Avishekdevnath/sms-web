import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { StudentEnrollment } from "@/models/StudentEnrollment";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";
import { emailService } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["admin", "manager"]);

    const body = await req.json();
    const { studentId, email, isReinvite = false } = body;

    if (!studentId && !email) {
      return Response.json({ 
        error: { code: "VALIDATION.ERROR", message: "Student ID or email is required" } 
      }, { status: 400 });
    }

    let student;
    let studentEmail;

    if (studentId) {
      // Find by student ID (for active students)
      student = await User.findById(studentId).lean();
      if (!student) {
        return Response.json({ 
          error: { code: "NOT_FOUND", message: "Student not found" } 
        }, { status: 404 });
      }
      studentEmail = student.email;
    } else {
      // Find by email (for pending enrollments)
      const enrollment = await StudentEnrollment.findOne({ email }).lean();
      if (!enrollment) {
        return Response.json({ 
          error: { code: "NOT_FOUND", message: "Student enrollment not found" } 
        }, { status: 404 });
      }
      studentEmail = enrollment.email;
    }

    // Generate invitation token (simple timestamp-based for now)
    const invitationToken = Buffer.from(`${studentEmail}-${Date.now()}`).toString('base64');
    const invitationExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Update user or enrollment with invitation details
    if (studentId) {
      await User.findByIdAndUpdate(studentId, {
        invitedAt: new Date(),
        invitationToken,
        invitationExpiry
      });
    } else {
      await StudentEnrollment.findOneAndUpdate({ email }, {
        invitedAt: new Date(),
        invitationToken,
        invitationExpiry
      });
    }

    // Send invitation email
    const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/profile-complete?token=${invitationToken}`;
    
    const emailContent = {
      to: studentEmail,
      subject: isReinvite ? 'Re-invitation to Complete Your Profile' : 'Complete Your Student Profile',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to Student Management System</h2>
          <p>Hello!</p>
          <p>${isReinvite ? 'This is a reminder to complete your student profile.' : 'You have been enrolled as a student. Please complete your profile to get started.'}</p>
          <p>Click the button below to complete your profile:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationLink}" 
               style="background-color: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Complete Profile
            </a>
          </div>
          <p>This invitation will expire in 7 days.</p>
          <p>If you have any questions, please contact the administration.</p>
          <p>Best regards,<br>Student Management System</p>
        </div>
      `
    };

    try {
      await emailService.sendEmail(
        emailContent.to,
        emailContent.subject,
        emailContent.html
      );
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      // Don't fail the entire operation if email fails
    }

    return Response.json({ 
      success: true,
      message: isReinvite ? 'Re-invitation sent successfully' : 'Invitation sent successfully',
      invitationExpiry: invitationExpiry.toISOString()
    });

  } catch (error) {
    console.error('Error sending invitation:', error);
    return Response.json({ error: { code: "INTERNAL" } }, { status: 500 });
  }
} 