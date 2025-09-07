import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Course } from "@/models/Course";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    await connectToDatabase();
    
    const { courseId } = await params;
    const course = await Course.findById(courseId);
    
    if (!course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(course);
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    await connectToDatabase();
    
    const { courseId } = await params;
    const body = await req.json();
    const { title, code, description } = body;
    
    if (!title || !code) {
      return NextResponse.json(
        { error: 'Title and code are required' },
        { status: 400 }
      );
    }
    
    // Check if course code already exists (excluding current course)
    const existingCourse = await Course.findOne({ 
      code, 
      _id: { $ne: courseId } 
    });
    
    if (existingCourse) {
      return NextResponse.json(
        { error: 'Course code already exists' },
        { status: 400 }
      );
    }
    
    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      {
        title,
        code,
        description: description || ''
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedCourse) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedCourse);
  } catch (error) {
    console.error('Error updating course:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Course code already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update course' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    await connectToDatabase();
    
    const { courseId } = await params;
    const deletedCourse = await Course.findByIdAndDelete(courseId);
    
    if (!deletedCourse) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 }
    );
  }
}
