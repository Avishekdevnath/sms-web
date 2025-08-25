import { NextRequest } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";
import { StudentBatchMembership } from "@/models/StudentBatchMembership";

const schema = z.object({ batchId: z.string().min(1), ids: z.array(z.string().min(1)).min(1) });

export async function POST(req: NextRequest) {
  await connectToDatabase();
  const me = await getAuthUserFromRequest(req);
  requireRoles(me, ["admin", "manager", "sre", "developer"]);
  const body = await req.json();
  const input = schema.parse(body);
  let upserts = 0;
  for (const id of input.ids) {
    const res = await StudentBatchMembership.updateOne({ studentId: id, batchId: input.batchId }, { $setOnInsert: { status: "pending", joinedAt: null, leftAt: null } }, { upsert: true });
    if (res.upsertedCount || res.modifiedCount) upserts++;
  }
  return Response.json({ ok: true, upserts });
} 