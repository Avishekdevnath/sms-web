import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Batch } from "@/models/Batch";
import { StudentEnrollment } from "@/models/StudentEnrollment";
import { StudentBatchMembership } from "@/models/StudentBatchMembership";
import { generateNextUserId } from "@/lib/userid";

export async function POST() {
  try {
    await connectToDatabase();

    // Get or create a batch
    let batch = await Batch.findOne({ code: "BATCH-001" });
    if (!batch) {
      batch = await Batch.create({ 
        title: "Web Development Batch 2024", 
        code: "BATCH-001",
        description: "Full-stack web development program"
      });
    }

    // Sample student data
    const students = [
      {
        email: "john.doe@student.com",
        name: "John Doe",
        firstname: "John",
        lastname: "Doe",
        phone: "+1234567890",
        profilePicture: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
      },
      {
        email: "jane.smith@student.com",
        name: "Jane Smith",
        firstname: "Jane",
        lastname: "Smith",
        phone: "+1234567891",
        profilePicture: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"
      },
      {
        email: "mike.johnson@student.com",
        name: "Mike Johnson",
        firstname: "Mike",
        lastname: "Johnson",
        phone: "+1234567892",
        profilePicture: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
      },
      {
        email: "sarah.wilson@student.com",
        name: "Sarah Wilson",
        firstname: "Sarah",
        lastname: "Wilson",
        phone: "+1234567893",
        profilePicture: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face"
      },
      {
        email: "alex.brown@student.com",
        name: "Alex Brown",
        firstname: "Alex",
        lastname: "Brown",
        phone: "+1234567894",
        profilePicture: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face"
      }
    ];

    const results = [];

    for (const studentData of students) {
      try {
        // Check if student already exists
        const existingUser = await User.findOne({ email: studentData.email });
        if (existingUser) {
          results.push({
            email: studentData.email,
            status: "skipped",
            reason: "User already exists"
          });
          continue;
        }

        // Create student user
        const userId = await generateNextUserId("student");
        const hashedPassword = await bcrypt.hash("temp123", 12);
        
        const user = await User.create({
          userId,
          email: studentData.email,
          name: studentData.name,
          role: "student",
          password: hashedPassword,
          isActive: false,
          profileCompleted: false,
          mustChangePassword: true
        });

        // Create pending enrollment
        await StudentEnrollment.create({
          email: studentData.email,
          batchId: batch._id,
          status: "pending"
        });

        // Create batch membership (approved)
        await StudentBatchMembership.create({
          studentId: user._id,
          batchId: batch._id,
          status: "approved"
        });

        results.push({
          email: studentData.email,
          status: "created",
          userId: user.userId,
          name: user.name
        });

      } catch (error) {
        console.error(`Error creating student ${studentData.email}:`, error);
        results.push({
          email: studentData.email,
          status: "error",
          error: error.message
        });
      }
    }

    return Response.json({
      success: true,
      message: "Student seed data created successfully",
      batch: {
        _id: batch._id,
        code: batch.code,
        title: batch.title
      },
      results,
      summary: {
        total: students.length,
        created: results.filter(r => r.status === "created").length,
        skipped: results.filter(r => r.status === "skipped").length,
        errors: results.filter(r => r.status === "error").length
      }
    });

  } catch (error) {
    console.error("Error seeding students:", error);
    return Response.json({
      error: {
        code: "INTERNAL",
        message: "Failed to seed student data"
      }
    }, { status: 500 });
  }
}
