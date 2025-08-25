import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";
import { User } from "@/models/User";
import { StudentProfile } from "@/models/StudentProfile";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["admin", "manager", "developer", "sre"]);

    const { id } = await params;
    const user = await User.findById(id).lean();
    if (!user) {
      return Response.json({ error: { code: "NOT_FOUND", message: "Student not found" } }, { status: 404 });
    }
    const profile = await StudentProfile.findOne({ userId: id }).lean();
    return Response.json({ data: { user, profile } });
  } catch (e) {
    return Response.json({ error: { code: "INTERNAL" } }, { status: 500 });
  }
} 