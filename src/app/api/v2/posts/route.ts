import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Post } from "@/models";
import type { IPost } from "@/models";
import type { Model } from "mongoose";
import { Types } from "mongoose";
import { getAuthUserFromRequest } from "@/lib/rbac";
// realtime publish removed

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const missionId = searchParams.get("missionId");
    const groupId = searchParams.get("groupId");
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const q = searchParams.get("q");
    const limit = Math.min(Number(searchParams.get("limit") || 20), 100);
    const cursor = searchParams.get("cursor");

    const filter: any = {};
    if (missionId) filter.missionId = missionId;
    if (groupId) filter.groupId = groupId;
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (q) filter.title = { $regex: q, $options: 'i' };
    if (cursor) filter._id = { $lt: new Types.ObjectId(cursor) } as any;
    const PostModel = Post as unknown as Model<IPost>;
    const docs = await PostModel.find(filter).sort({ _id: -1 }).limit(limit).lean();
    const nextCursor = docs.length === limit ? String(docs[docs.length - 1]._id) : null;
    return Response.json({ success: true, data: docs, nextCursor });
  } catch (e: any) {
    return Response.json({ success: false, error: e?.message || "Failed to fetch posts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    if (!me) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    // RBAC: students cannot create announcements/resources; students can create guideline/coding
    if ((body.category === 'announcement' || body.category === 'resource') && me.role === 'student') {
      return Response.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const PostModel2 = Post as unknown as Model<IPost>;
    const doc = await PostModel2.create({
      missionId: body.missionId,
      groupId: body.groupId || undefined,
      category: body.category,
      announcementType: body.announcementType || undefined,
      title: body.title,
      body: body.body,
      attachments: body.attachments || [],
      tags: body.tags || [],
      status: body.category === 'guideline' || body.category === 'coding' ? 'pending' : 'approved',
      visibility: body.groupId ? 'group' : 'mission',
      createdBy: me._id,
    } as any);

    // Realtime publish removed

    return Response.json({ success: true, data: doc });
  } catch (e: any) {
    return Response.json({ success: false, error: e?.message || "Failed to create post" }, { status: 500 });
  }
}


