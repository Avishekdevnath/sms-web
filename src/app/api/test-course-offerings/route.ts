import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { CourseOffering } from "@/models/CourseOffering";
import { Batch } from "@/models/Batch";
import { Course } from "@/models/Course";
import { Semester } from "@/models/Semester"; // Import Semester model
import { User } from "@/models/User"; // Import User model

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // Get all course offerings with populated data
    const courseOfferings = await CourseOffering.find()
      .populate('courseId', 'title code')
      .populate('batchId', 'title code')
      .populate('semesterId', 'number title')
      .lean();
    
    // Get all batches
    const batches = await Batch.find().lean();
    
    // Get all courses
    const courses = await Course.find().lean();
    
    // Get all semesters
    const semesters = await Semester.find().lean();
    
    return Response.json({
      success: true,
      data: {
        courseOfferings,
        batches,
        courses,
        semesters,
        counts: {
          courseOfferings: courseOfferings.length,
          batches: batches.length,
          courses: courses.length,
          semesters: semesters.length
        }
      }
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 