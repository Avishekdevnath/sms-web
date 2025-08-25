import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";
import { StudentEnrollment } from "@/models/StudentEnrollment";

export async function POST(req: NextRequest) {
  await connectToDatabase();
  const me = await getAuthUserFromRequest(req);
  requireRoles(me, ["admin", "manager", "sre", "developer"]);
  const { searchParams } = new URL(req.url);
  const batchId = searchParams.get("batchId");
  if (!batchId) return Response.json({ error: { code: "VALIDATION.ERROR", message: "batchId required" } }, { status: 400 });

  const pendings = await StudentEnrollment.find({ batchId, status: "pending" }).lean();
  const seen = new Set<string>();
  let removed = 0;
  for (const p of pendings) {
    const key = p.email.toLowerCase();
    if (seen.has(key)) {
      await StudentEnrollment.updateOne({ _id: p._id }, { $set: { status: "removed" } });
      removed++;
    } else {
      seen.add(key);
    }
  }

  return Response.json({ ok: true, removed });
} 