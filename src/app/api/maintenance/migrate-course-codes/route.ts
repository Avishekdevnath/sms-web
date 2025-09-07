import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Course } from "@/models/Course";
import { Semester } from "@/models/Semester";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";
import { generateCourseCodeForPosition } from "@/lib/courseCodeGenerator";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["admin", "developer"]);

    // Get all existing courses
    const existingCourses = await Course.find({}).lean();
    const migrationResults = [];

    for (const course of existingCourses) {
      try {
        let newCode = course.code;
        let semesterId = course.semesterId;
        let needsUpdate = false;

        // Check if course already has proper semester-based code
        if (!course.code.match(/^CS[123]\d{2}$/)) {
          // Determine semester based on existing code or assign to semester 1 as default
          let semesterNumber = 1;
          
          if (course.code.includes('S1') || course.code.includes('101')) {
            semesterNumber = 1;
          } else if (course.code.includes('S2') || course.code.includes('201')) {
            semesterNumber = 2;
          } else if (course.code.includes('S3') || course.code.includes('301')) {
            semesterNumber = 3;
          }

          // Find or create semester
          let semester = await Semester.findOne({ number: semesterNumber }).lean();
          if (!semester) {
            // Create a default semester if none exists
            const defaultBatch = await Semester.findOne({}).lean();
            if (defaultBatch) {
              semester = await Semester.create({
                batchId: defaultBatch.batchId,
                number: semesterNumber,
                title: `Semester ${semesterNumber}`
              });
            }
          }

          if (semester) {
            // Generate new semester-based code
            newCode = generateCourseCodeForPosition(semesterNumber, 1);
            semesterId = semester._id;
            needsUpdate = true;
          }
        }

        // Update course if needed
        if (needsUpdate) {
          await Course.findByIdAndUpdate(course._id, {
            code: newCode,
            semesterId: semesterId
          });

          migrationResults.push({
            oldCode: course.code,
            newCode: newCode,
            title: course.title,
            semesterNumber: semesterId ? (await Semester.findById(semesterId).lean())?.number : 'Unknown'
          });
        } else {
          migrationResults.push({
            oldCode: course.code,
            newCode: course.code,
            title: course.title,
            semesterNumber: 'No change needed',
            status: 'Already correct'
          });
        }
      } catch (error) {
        migrationResults.push({
          oldCode: course.code,
          newCode: 'ERROR',
          title: course.title,
          error: error.message
        });
      }
    }

    return Response.json({
      success: true,
      message: `Migration completed. ${migrationResults.length} courses processed.`,
      results: migrationResults
    });

  } catch (error) {
    console.error('Migration error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
