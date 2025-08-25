import { connectToDatabase } from "@/lib/mongodb";
import { Batch } from "@/models/Batch";
import { Semester } from "@/models/Semester";
import { Course } from "@/models/Course";

export async function POST() {
  await connectToDatabase();

  const batches = await Batch.find({ code: { $in: ["BATCH-006", "BATCH-007"] } }).lean();
  const created: any[] = [];

  for (const b of batches) {
    const sems = await Semester.find({ batchId: b._id }).lean();
    for (const s of sems) {
      const list = [
        { code: `${b.code}-S${s.number}-C01`, title: `Course 01 (S${s.number})` },
        { code: `${b.code}-S${s.number}-C02`, title: `Course 02 (S${s.number})` },
      ];
      for (const c of list) {
        let course = await Course.findOne({ code: c.code });
        if (!course) {
          course = await Course.create({ code: c.code, title: c.title, semesterId: s._id });
          created.push({ batch: b.code, semester: s.number, code: course.code });
        }
      }
    }
  }

  return Response.json({ ok: true, created });
} 