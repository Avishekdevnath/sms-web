import { connectToDatabase } from "@/lib/mongodb";
import { Batch } from "@/models/Batch";
import { Semester } from "@/models/Semester";
import { Course } from "@/models/Course";
import { generateCourseCodeForPosition } from "@/lib/courseCodeGenerator";

export async function POST() {
  await connectToDatabase();

  const batches = await Batch.find({ code: { $in: ["BATCH-006", "BATCH-007"] } }).lean();
  const created: any[] = [];

  for (const b of batches) {
    const sems = await Semester.find({ batchId: b._id }).lean();
    for (const s of sems) {
      // Use proper semester-based course codes
      const list = [
        { 
          code: generateCourseCodeForPosition(s.number, 1), // CS101, CS201, CS301
          title: `Course 01 (Semester ${s.number})`,
          description: `First course for Semester ${s.number}`
        },
        { 
          code: generateCourseCodeForPosition(s.number, 2), // CS102, CS202, CS302
          title: `Course 02 (Semester ${s.number})`,
          description: `Second course for Semester ${s.number}`
        },
      ];
      
      for (const c of list) {
        let course = await Course.findOne({ code: c.code });
        if (!course) {
          course = await Course.create({ 
            code: c.code, 
            title: c.title, 
            description: c.description,
            semesterId: s._id 
          });
          created.push({ 
            batch: b.code, 
            semester: s.number, 
            code: course.code,
            title: course.title 
          });
        }
      }
    }
  }

  return Response.json({ ok: true, created });
} 