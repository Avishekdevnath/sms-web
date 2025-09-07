import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { MentorshipGroupV2, MissionV2 } from "@/models/v2";
import { GroupTransferLog } from "@/models";
import { getAuthUserFromRequest } from "@/lib/rbac";
import { Types } from "mongoose";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    if (!me) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    if (!["admin", "sre", "manager"].includes(me.role)) {
      return Response.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const sourceGroupId = new Types.ObjectId(params.id);
    const body = await req.json();
    const { studentIds, toGroupId, reason } = body || {};
    if (!Array.isArray(studentIds) || studentIds.length === 0 || !toGroupId) {
      return Response.json({ success: false, error: "studentIds[] and toGroupId required" }, { status: 400 });
    }

    const [sourceGroup, destGroup] = await Promise.all([
      MentorshipGroupV2.findById(sourceGroupId),
      MentorshipGroupV2.findById(new Types.ObjectId(toGroupId)),
    ]);
    if (!sourceGroup) return Response.json({ success: false, error: "Source group not found" }, { status: 404 });
    if (!destGroup) return Response.json({ success: false, error: "Destination group not found" }, { status: 404 });
    if (!sourceGroup.missionId.equals(destGroup.missionId)) {
      return Response.json({ success: false, error: "Groups must be in the same mission" }, { status: 400 });
    }

    // Transfer students
    const studentObjectIds = studentIds.map((id: string) => new Types.ObjectId(id));
    for (const sid of studentObjectIds) {
      await sourceGroup.removeStudent(sid);
      await destGroup.addStudent(sid);
      await GroupTransferLog.create({
        missionId: destGroup.missionId,
        fromGroupId: sourceGroup._id,
        toGroupId: destGroup._id,
        studentId: sid,
        actorId: me._id,
        reason: reason || undefined,
      } as any);
    }

    // Update mission fast arrays are maintained at group-level only for counts; if needed, could be per-student arrays
    const mission = await MissionV2.findById(destGroup.missionId);
    if (mission) await mission.save();

    return Response.json({ success: true, data: { from: sourceGroupId, to: destGroup._id, transferred: studentIds.length } });
  } catch (e: any) {
    return Response.json({ success: false, error: e?.message || "Failed to transfer students" }, { status: 500 });
  }
}


