import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";
import { generateNextUserId } from "@/lib/userid";

export async function POST(req: NextRequest) {
  await connectToDatabase();
  const me = await getAuthUserFromRequest(req);
  requireRoles(me, ["admin", "developer"]);

  const users = await User.find({ $or: [{ userId: { $exists: false } }, { userId: null }] }).select("_id role");
  let updated = 0;
  for (const u of users) {
    const userId = await generateNextUserId(u.role as any);
    await User.findByIdAndUpdate(u._id, { userId });
    updated++;
  }
  return Response.json({ ok: true, updated });
} 