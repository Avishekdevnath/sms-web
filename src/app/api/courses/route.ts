import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Course } from "@/models/Course";
import { Semester } from "@/models/Semester";
import { generateNextCourseCode, generateSimpleCourseCode } from "@/lib/courseCodeGenerator";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const skip = (page - 1) * limit;
    const semesterId = searchParams.get("semesterId");
    
    const filter: any = {};
    if (semesterId) {
      filter.semesterId = semesterId;
    }
    
    // Ensure we're getting all courses when no specific semester is requested
    console.log('Courses API - About to query with filter:', filter);
    
    // First, let's check what's actually in the database
    const totalInDB = await Course.countDocuments();
    console.log('Courses API - Total documents in database:', totalInDB);
    
    // Try to get all courses without any filtering first
    const allCoursesRaw = await Course.find().lean();
    console.log('Courses API - All courses found (raw):', allCoursesRaw.length);
    
    // Get courses with conditional population - only populate if semesterId exists
    let courses;
    if (semesterId) {
      // If filtering by semester, we know semesterId exists
      courses = await Course.find(filter)
        .populate('semesterId', 'number title')
        .skip(skip)
        .limit(limit)
        .lean();
    } else {
      // If not filtering by semester, handle courses with and without semesterId
      courses = await Course.find(filter)
        .skip(skip)
        .limit(limit)
        .lean();
      
      // Manually populate semesterId for courses that have it
      for (let course of courses) {
        if (course.semesterId) {
          const semester = await Semester.findById(course.semesterId).select('number title').lean();
          if (semester) {
            course.semesterId = semester;
          }
        }
      }
    }
    
    const total = await Course.countDocuments(filter);
    
    console.log('Courses API - Filter:', filter);
    console.log('Courses API - Found courses:', courses.length);
    console.log('Courses API - Total count:', total);
    
    return NextResponse.json({
      courses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await req.json();
    const { title, description, semesterId } = body;
    
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }
    
    // Validate semester exists if provided
    if (semesterId) {
      const semester = await Semester.findById(semesterId);
      if (!semester) {
        return NextResponse.json(
          { error: 'Semester not found' },
          { status: 404 }
        );
      }
    }
    
    // Generate course code - if semesterId provided, use semester-based generation
    // Otherwise, generate a unique code
    let code;
    if (semesterId) {
      const semester = await Semester.findById(semesterId);
      if (semester) {
        code = await generateNextCourseCode(semester.number);
      }
    }
    
    // If no semesterId or code generation failed, generate a simple unique code
    if (!code) {
      code = await generateSimpleCourseCode();
    }
    
    const course = new Course({
      title,
      code,
      description: description || '',
      semesterId: semesterId || undefined
    });
    
    await course.save();
    
    // Populate semester info for response if semesterId exists
    let populatedCourse;
    if (semesterId) {
      populatedCourse = await Course.findById(course._id)
        .populate('semesterId', 'number title')
        .lean();
    } else {
      populatedCourse = await Course.findById(course._id).lean();
    }
    
    return NextResponse.json(populatedCourse, { status: 201 });
  } catch (error) {
    console.error('Error creating course:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Course code already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    );
  }
}