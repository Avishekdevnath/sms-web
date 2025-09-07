import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Channel } from "@/models";
import { getAuthUserFromRequest } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const missionId = searchParams.get("missionId");
    const groupId = searchParams.get("groupId");
    const type = searchParams.get("type");

    const filter: any = {};
    if (missionId) filter.missionId = missionId;
    if (groupId) filter.groupId = groupId;
    if (type) filter.type = type;

    const channels = await Channel.find(filter).sort({ lastMessageAt: -1 }).lean();
    return Response.json({ success: true, data: channels });
  } catch (e: any) {
    return Response.json({ success: false, error: e?.message || "Failed to fetch channels" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    if (!me) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    if (me.role === "student") return Response.json({ success: false, error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const input = {
      missionId: body.missionId,
      groupId: body.groupId || undefined,
      type: body.type,
      visibility: body.visibility,
      allowedRoles: body.allowedRoles || [],
      createdBy: me._id,
    };
    const doc = await Channel.create(input as any);
    return Response.json({ success: true, data: doc });
  } catch (e: any) {
    return Response.json({ success: false, error: e?.message || "Failed to create channel" }, { status: 500 });
  }
}


