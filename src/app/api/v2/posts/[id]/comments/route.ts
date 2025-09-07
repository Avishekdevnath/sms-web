import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Comment, Post } from "@/models";
import { getAuthUserFromRequest } from "@/lib/rbac";
// realtime publish removed
import { Types } from "mongoose";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get('limit') || 20), 100);
    const cursor = searchParams.get('cursor');
    const parentIdParam = searchParams.get('parentId');
    const filter: any = { postId: params.id };
    if (parentIdParam === null || parentIdParam === undefined) {
      // no filter
    } else if (parentIdParam === 'null') {
      filter.parentId = null;
    } else {
      filter.parentId = parentIdParam;
    }
    if (cursor) filter._id = { $lt: new Types.ObjectId(cursor) } as any;
    const docs = await Comment.find(filter).sort({ _id: -1 }).limit(limit).lean();
    const nextCursor = docs.length === limit ? String(docs[docs.length - 1]._id) : null;
    return Response.json({ success: true, data: docs.reverse(), nextCursor });
  } catch (e: any) {
    return Response.json({ success: false, error: e?.message || 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    if (!me) return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const post = await Post.findById(params.id).lean();
    if (!post) return Response.json({ success: false, error: 'Post not found' }, { status: 404 });

    const body = await req.json();
    const parentId = body.parentId ? new Types.ObjectId(body.parentId) : null;
    const doc = await Comment.create({ postId: params.id, parentId, authorId: me._id, body: body.body, attachments: body.attachments || [] });

    // Realtime publish removed

    return Response.json({ success: true, data: doc });
  } catch (e: any) {
    return Response.json({ success: false, error: e?.message || 'Failed' }, { status: 500 });
  }
}


