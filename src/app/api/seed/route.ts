import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Batch } from "@/models/Batch";
import { Semester } from "@/models/Semester";
import { generateNextUserId } from "@/lib/userid";

export async function POST() {
  await connectToDatabase();

  const users = [
    { email: "dev@example.com", name: "Dev", role: "developer", password: "password123" },
    { email: "admin@example.com", name: "Admin", role: "admin", password: "password123" },
    { email: "manager@example.com", name: "Manager", role: "manager", password: "password123" },
    { email: "sre@example.com", name: "SRE", role: "sre", password: "password123" },
    { email: "mentor@example.com", name: "Mentor", role: "mentor", password: "password123" },
    { email: "student@example.com", name: "Student", role: "student", password: "password123" },
  ] as const;

  for (const u of users) {
    const exists = await User.findOne({ email: u.email });
    if (!exists) {
      const hash = await bcrypt.hash(u.password, 10);
      const userId = await generateNextUserId(u.role as any);
      await User.create({ userId, email: u.email, name: u.name, role: u.role, password: hash });
    }
  }

  // Backfill any existing users without userId
  const withoutId = await User.find({ $or: [{ userId: { $exists: false } }, { userId: null }, { userId: "" }] }).select("_id role userId");
  for (const u of withoutId) {
    const userId = await generateNextUserId(u.role as any);
    await User.findByIdAndUpdate(u._id, { userId });
  }

  let batch = await Batch.findOne({ code: "BATCH-001" });
  if (!batch) batch = await Batch.create({ title: "Batch 001", code: "BATCH-001" });

  for (const num of [1, 2, 3] as const) {
    const exists = await Semester.findOne({ batchId: batch._id, number: num });
    if (!exists) await Semester.create({ batchId: batch._id, number: num, title: `Semester ${num}` });
  }

  return Response.json({ ok: true });
} 