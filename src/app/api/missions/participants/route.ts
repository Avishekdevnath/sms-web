import { NextRequest } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";
import { MissionParticipant } from "@/models/MissionParticipant";

export async function GET(req: NextRequest) {
  await connectToDatabase();
  const me = await getAuthUserFromRequest(req);
  requireRoles(me, ["admin", "manager", "sre", "developer"]);
  const { searchParams } = new URL(req.url);
  const missionId = searchParams.get("missionId");
  if (!missionId) return Response.json({ error: { code: "VALIDATION.ERROR", message: "missionId required" } }, { status: 400 });
  const data = await MissionParticipant.find({ missionId }).lean();
  return Response.json({ data });
}

const patchSchema = z.object({ missionId: z.string().min(1), studentId: z.string().min(1), status: z.enum(["active", "inactive", "suspended"]), reason: z.string().optional() });

export async function POST(req: NextRequest) {
  await connectToDatabase();
  const me = await getAuthUserFromRequest(req);
  requireRoles(me, ["admin", "manager", "sre", "developer"]);
  const body = await req.json();
  const input = patchSchema.parse(body);
  const doc = await MissionParticipant.findOneAndUpdate(
    { missionId: input.missionId, studentId: input.studentId },
    { status: input.status, reason: input.reason, updatedBy: me!._id, updatedAt: new Date() },
    { upsert: true, new: true }
  );
  return Response.json({ data: doc });
} 