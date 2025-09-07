import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Post, ModerationLog } from "@/models";
import { getAuthUserFromRequest } from "@/lib/rbac";
// realtime publish removed

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const doc = await Post.findById(params.id).lean();
    if (!doc) return Response.json({ success: false, error: 'Not found' }, { status: 404 });
    return Response.json({ success: true, data: doc });
  } catch (e: any) {
    return Response.json({ success: false, error: e?.message || 'Failed' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    if (!me) return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const updated = await Post.findByIdAndUpdate(params.id, body, { new: true }).lean();
    if (!updated) return Response.json({ success: false, error: 'Not found' }, { status: 404 });
    return Response.json({ success: true, data: updated });
  } catch (e: any) {
    return Response.json({ success: false, error: e?.message || 'Failed' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    await Post.findByIdAndDelete(params.id);
    return Response.json({ success: true });
  } catch (e: any) {
    return Response.json({ success: false, error: e?.message || 'Failed' }, { status: 500 });
  }
}

// Status change with moderation log
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    if (!me) return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const allowedRoles = ['admin', 'sre', 'mentor', 'superadmin'];
    if (!allowedRoles.includes(String(me.role).toLowerCase())) {
      return Response.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    const body = await req.json();
    if (!body.status) return Response.json({ success: false, error: 'status required' }, { status: 400 });

    const prev = await Post.findById(params.id);
    if (!prev) return Response.json({ success: false, error: 'Not found' }, { status: 404 });
    const updated = await Post.findByIdAndUpdate(params.id, { status: body.status }, { new: true });

    await ModerationLog.create({
      targetType: 'post',
      targetId: updated!._id,
      action: 'status.change',
      data: { from: prev.status, to: body.status, reason: body.reason },
      actorId: me._id,
    });

    // Realtime publish removed

    return Response.json({ success: true, data: updated });
  } catch (e: any) {
    return Response.json({ success: false, error: e?.message || 'Failed' }, { status: 500 });
  }
}


