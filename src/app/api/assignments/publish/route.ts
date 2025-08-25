import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Assignment } from "@/models/Assignment";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";

export async function POST(req: NextRequest) {
  await connectToDatabase();
  const me = await getAuthUserFromRequest(req);
  requireRoles(me, ["admin", "manager", "developer", "mentor"]);
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return Response.json({ error: { code: "VALIDATION.ERROR", message: "id required" } }, { status: 400 });
  await Assignment.findByIdAndUpdate(id, { publishedAt: new Date() });
  return Response.json({ ok: true });
} 