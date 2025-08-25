import { Batch } from "@/models/Batch";

export async function generateNextBatchCode(): Promise<string> {
  // Find latest code like BATCH-001, BATCH-123
  const last = await Batch.findOne({ code: { $regex: /^BATCH-\d+$/ } })
    .sort({ code: -1 })
    .select("code")
    .lean();
  let nextNum = 1;
  if (last?.code) {
    const m = /^(?:BATCH-)(\d+)$/.exec(last.code);
    const n = m ? parseInt(m[1], 10) : 0;
    nextNum = isNaN(n) ? 1 : n + 1;
  }
  // Ensure uniqueness just in case of race by bumping if exists
  let code = `BATCH-${String(nextNum).padStart(3, "0")}`;
  // eslint-disable-next-line no-constant-condition
  for (let i = 0; i < 3; i++) {
    const exists = await Batch.findOne({ code }).lean();
    if (!exists) break;
    nextNum++;
    code = `BATCH-${String(nextNum).padStart(3, "0")}`;
  }
  return code;
} 