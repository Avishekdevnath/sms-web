import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { StudentEnrollment } from "@/models/StudentEnrollment";
import { User } from "@/models/User";
import { StudentProfile } from "@/models/StudentProfile";
import { generateStudentId, generateUniqueUsername, validatePhoneNumber, sanitizeInput } from "@/lib/studentIdGenerator";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await req.json();
    const { 
      enrollmentId, 
      firstName, 
      lastName, 
      username, 
      phone, 
      courseGoal,
      password 
    } = body;

    // Validate required fields
    if (!enrollmentId || !firstName || !lastName || !username || !phone || !password) {
      return Response.json({
        error: {
          code: "VALIDATION_ERROR",
          message: "All required fields must be provided"
        }
      }, { status: 400 });
    }

    // Validate phone number
    if (!validatePhoneNumber(phone)) {
      return Response.json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid phone number format"
        }
      }, { status: 400 });
    }

    // Find enrollment
    const enrollment = await StudentEnrollment.findById(enrollmentId)
      .populate("batchId", "code title")
      .lean();

    if (!enrollment) {
      return Response.json({
        error: {
          code: "NOT_FOUND",
          message: "Enrollment not found"
        }
      }, { status: 404 });
    }

    if (enrollment.status !== 'invited') {
      return Response.json({
        error: {
          code: "INVALID_STATUS",
          message: "Enrollment must be in 'invited' status to activate"
        }
      }, { status: 400 });
    }

    // Check if username is available
    const existingUser = await User.findOne({ username }).lean();
    if (existingUser) {
      return Response.json({
        error: {
          code: "USERNAME_TAKEN",
          message: "Username is already taken"
        }
      }, { status: 400 });
    }

    // Generate student ID
    const studentId = await generateStudentId(enrollment.batchId._id.toString());

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user account
    const user = new User({
      userId: studentId,
      email: enrollment.email,
      password: hashedPassword,
      role: 'student',
      name: `${sanitizeInput(firstName)} ${sanitizeInput(lastName)}`,
      isActive: true,
      studentId,
      username: sanitizeInput(username),
      phone: sanitizeInput(phone),
      profileCompleted: true,
      profilePicture: '/placeholder-avatar.png'
    });

    await user.save();

    // Create student profile
    const studentProfile = new StudentProfile({
      userId: user._id,
      firstName: sanitizeInput(firstName),
      lastName: sanitizeInput(lastName),
      username: sanitizeInput(username),
      phone: sanitizeInput(phone),
      profilePicture: '/placeholder-avatar.png',
      academicInfo: {
        courseGoal: sanitizeInput(courseGoal || '')
      },
      completedAt: new Date()
    });

    await studentProfile.save();

    // Update enrollment status
    await StudentEnrollment.findByIdAndUpdate(enrollmentId, {
      status: 'activated',
      activatedAt: new Date(),
      activatedBy: user._id,
      userId: user._id
    });

    return Response.json({
      success: true,
      message: "Student activated successfully",
      data: {
        userId: user._id,
        studentId: user.studentId,
        email: user.email,
        username: user.username,
        name: user.name
      }
    });

  } catch (error) {
    console.error('Error activating student:', error);
    return Response.json({
      error: {
        code: "INTERNAL",
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}
