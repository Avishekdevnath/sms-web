import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";
import { StudentBatchMembership } from "@/models/StudentBatchMembership";
import { User } from "@/models/User";

export async function GET(req: NextRequest) {
  await connectToDatabase();
  const me = await getAuthUserFromRequest(req);
  requireRoles(me, ["admin", "manager"]);
  const { searchParams } = new URL(req.url);
  const batchId = searchParams.get("batchId");
  if (!batchId) return Response.json({ error: { code: "VALIDATION.ERROR", message: "batchId required" } }, { status: 400 });

  const memberships = await StudentBatchMembership.find({ batchId }).select("studentId").lean();
  const studentIds = memberships.map(m => m.studentId);
  const users = await User.find({ _id: { $in: studentIds } }).select("_id email name").lean();
  const emailToUsers = new Map<string, { _id: string; email: string; name: string }[]>();
  for (const u of users) {
    const key = u.email.toLowerCase();
    const arr = emailToUsers.get(key) || [];
    arr.push({ _id: String(u._id), email: u.email, name: u.name });
    emailToUsers.set(key, arr);
  }
  const duplicates = Array.from(emailToUsers.entries())
    .filter(([, list]) => list.length > 1)
    .map(([email, list]) => ({ email, users: list }));

  return Response.json({ data: duplicates });
} 