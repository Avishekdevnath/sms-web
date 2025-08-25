import { NextRequest } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { StudentAssignmentSubmission } from "@/models/StudentAssignmentSubmission";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";

const createSchema = z.object({ assignmentId: z.string().min(1), fileUrl: z.string().url() });

export async function GET(req: NextRequest) {
  await connectToDatabase();
  const me = await getAuthUserFromRequest(req);
  const { searchParams } = new URL(req.url);
  const assignmentId = searchParams.get("assignmentId");
  const studentId = searchParams.get("studentId");
  const q: any = {};
  if (assignmentId) q.assignmentId = assignmentId;
  if (studentId) q.studentId = studentId;
  // Students can see only their own submissions
  if (me?.role === "student") q.studentId = me._id;
  const data = await StudentAssignmentSubmission.find(q).lean();
  return Response.json({ data });
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["student"]);
    const body = await req.json();
    const input = createSchema.parse(body);
    const doc = await StudentAssignmentSubmission.create({ assignmentId: input.assignmentId, studentId: me!._id, fileUrl: input.fileUrl });
    return Response.json({ data: doc }, { status: 201 });
  } catch (err: unknown) {
    const isZod = typeof err === "object" && err !== null && "issues" in err;
    if (isZod) return Response.json({ error: { code: "VALIDATION.ERROR" } }, { status: 400 });
    return Response.json({ error: { code: "INTERNAL" } }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["admin", "developer", "manager", "mentor"]);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return Response.json({ error: { code: "VALIDATION.ERROR", message: "id required" } }, { status: 400 });
    const body = await req.json();
    const schema = z.object({ pointsAwarded: z.number().min(0).optional(), feedback: z.string().optional() });
    const input = schema.parse(body);
    const doc = await StudentAssignmentSubmission.findByIdAndUpdate(id, input, { new: true });
    return Response.json({ data: doc });
  } catch {
    return Response.json({ error: { code: "INTERNAL" } }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["admin", "developer", "manager"]);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return Response.json({ error: { code: "VALIDATION.ERROR", message: "id required" } }, { status: 400 });
    await StudentAssignmentSubmission.findByIdAndDelete(id);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: { code: "INTERNAL" } }, { status: 500 });
  }
} 