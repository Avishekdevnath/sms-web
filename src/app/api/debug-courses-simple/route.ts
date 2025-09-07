import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Course } from "@/models/Course";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // Get all courses without any filtering or population
    const allCourses = await Course.find().lean();
    
    // Get courses with semesterId
    const coursesWithSemester = await Course.find({ 
      semesterId: { $exists: true, $ne: null } 
    }).lean();
    
    // Get courses without semesterId
    const coursesWithoutSemester = await Course.find({ 
      $or: [
        { semesterId: { $exists: false } },
        { semesterId: null }
      ]
    }).lean();
    
    // Get total count
    const totalCount = await Course.countDocuments();
    
    return Response.json({
      success: true,
      debug: {
        totalCourses: totalCount,
        allCourses: allCourses,
        coursesWithSemester: coursesWithSemester.length,
        coursesWithoutSemester: coursesWithoutSemester.length,
        sampleCourses: allCourses.slice(0, 5), // Show first 5 courses
        rawData: allCourses // Show raw data for debugging
      }
    });
  } catch (error) {
    console.error('Debug courses endpoint error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
