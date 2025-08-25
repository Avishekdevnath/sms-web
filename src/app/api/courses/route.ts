import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Course } from "@/models/Course";

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
    
    const [courses, total] = await Promise.all([
      Course.find(filter)
        .skip(skip)
        .limit(limit)
        .lean(),
      Course.countDocuments(filter)
    ]);
    
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
    const { title, code, semesterId } = body;
    
    if (!title || !code || !semesterId) {
      return NextResponse.json(
        { error: 'Title, code, and semesterId are required' },
        { status: 400 }
      );
    }
    
    const course = new Course({
      title,
      code,
      semesterId
    });
    
    await course.save();
    
    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    );
  }
}