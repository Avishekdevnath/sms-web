import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { StudentCourse } from "@/models/StudentCourse";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["student"]);

    // Find all courses the student is enrolled in
    const studentCourses = await StudentCourse.find({ 
      studentId: me._id 
    })
    .populate('courseId', 'title code description')
    .lean();

    // Extract course information
    const courses = studentCourses.map(sc => ({
      _id: sc.courseId._id,
      title: sc.courseId.title,
      code: sc.courseId.code,
      description: sc.courseId.description,
      enrolledAt: sc.createdAt
    }));

    return Response.json({ 
      data: courses,
      total: courses.length
    });

  } catch (err: unknown) {
    console.error('Error fetching student courses:', err);
    
    return Response.json({ 
      error: { 
        code: "INTERNAL", 
        message: "Internal server error" 
      } 
    }, { status: 500 });
  }
}
