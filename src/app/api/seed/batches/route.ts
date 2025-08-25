import { connectToDatabase } from "@/lib/mongodb";
import { Batch } from "@/models/Batch";
import { Semester } from "@/models/Semester";

export async function POST() {
  await connectToDatabase();

  const targets = [
    { code: "BATCH-006", title: "Batch 006" },
    { code: "BATCH-007", title: "Batch 007" },
  ];

  const results: any[] = [];

  for (const t of targets) {
    let batch = await Batch.findOne({ code: t.code });
    if (!batch) {
      batch = await Batch.create({ code: t.code, title: t.title });
    }
    for (const num of [1, 2, 3] as const) {
      const exists = await Semester.findOne({ batchId: batch._id, number: num });
      if (!exists) {
        await Semester.create({ batchId: batch._id, number: num, title: `Semester ${num}` });
      }
    }
    results.push({ batch: { id: batch._id, code: batch.code, title: batch.title } });
  }

  return Response.json({ ok: true, created: results });
} 