import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { MentorshipGroupV2, MissionV2 } from "@/models/v2";
import { GroupTransferLog } from "@/models";
import { getAuthUserFromRequest } from "@/lib/rbac";
import { Types } from "mongoose";

async function ensureRecoveryGroup(missionId: Types.ObjectId, actorId: Types.ObjectId) {
  const existing = await MentorshipGroupV2.findOne({ missionId, name: 'Recovery Zone' });
  if (existing) return existing;
  const group = new MentorshipGroupV2({
    name: 'Recovery Zone',
    description: 'Temporary group for irregular students',
    missionId,
    batchId: (await MissionV2.findById(missionId))?.batchId,
    groupType: 'mentorship',
    status: 'active',
    createdBy: actorId,
  } as any);
  await group.save();
  const mission = await MissionV2.findById(missionId);
  if (mission) await mission.addGroup(group._id);
  return group;
}

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
    const { studentIds, reason } = body || {};
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return Response.json({ success: false, error: "studentIds[] required" }, { status: 400 });
    }

    const sourceGroup = await MentorshipGroupV2.findById(sourceGroupId);
    if (!sourceGroup) return Response.json({ success: false, error: "Source group not found" }, { status: 404 });
    const recoveryGroup = await ensureRecoveryGroup(sourceGroup.missionId as Types.ObjectId, me._id as Types.ObjectId);

    const studentObjectIds = studentIds.map((id: string) => new Types.ObjectId(id));
    for (const sid of studentObjectIds) {
      await sourceGroup.removeStudent(sid);
      await recoveryGroup.addStudent(sid);
      await GroupTransferLog.create({
        missionId: recoveryGroup.missionId,
        fromGroupId: sourceGroup._id,
        toGroupId: recoveryGroup._id,
        studentId: sid,
        actorId: me._id,
        reason: reason || 'move-to-recovery',
      } as any);
    }

    const mission = await MissionV2.findById(recoveryGroup.missionId);
    if (mission) await mission.save();

    return Response.json({ success: true, data: { from: sourceGroupId, to: recoveryGroup._id, transferred: studentIds.length } });
  } catch (e: any) {
    return Response.json({ success: false, error: e?.message || "Failed to move to recovery" }, { status: 500 });
  }
}


