import { NextRequest } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";
import { StudentBatchMembership } from "@/models/StudentBatchMembership";

const schema = z.object({ studentId: z.string().min(1), batchId: z.string().min(1) });

export async function POST(req: NextRequest) {
  await connectToDatabase();
  const me = await getAuthUserFromRequest(req);
  requireRoles(me, ["admin", "manager"]);
  const body = await req.json();
  const input = schema.parse(body);
  const membership = await StudentBatchMembership.findOneAndUpdate(
    { studentId: input.studentId, batchId: input.batchId },
    { status: "removed", leftAt: new Date() },
    { new: true }
  );
  return Response.json({ data: membership });
} 