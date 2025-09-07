import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Channel, Message } from "@/models";
import type { IChannel, IMessage } from "@/models";
import type { Model } from "mongoose";
import { Types } from "mongoose";
import { getAuthUserFromRequest } from "@/lib/rbac";
import { ServerlessRateLimiter } from "@/utils/rateLimiting";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit") || 30), 100);
    const cursor = searchParams.get("cursor");
    const threadId = searchParams.get("threadId");

    const filter: any = { channelId: params.id };
    if (threadId) filter.threadId = threadId;
    if (cursor) filter._id = { $lt: new Types.ObjectId(cursor) } as any;
    const MessageModel = Message as unknown as Model<IMessage>;
    const docs = await MessageModel.find(filter)
      .sort({ _id: -1 })
      .limit(limit)
      .lean();
    const nextCursor = docs.length === limit ? String(docs[docs.length - 1]._id) : null;
    return Response.json({ success: true, data: docs.reverse(), nextCursor });
  } catch (e: any) {
    return Response.json({ success: false, error: e?.message || "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    if (!me) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });

    // Basic RBAC: if mentor-messaging channel, block students
    const ChannelModel = Channel as unknown as Model<IChannel>;
    const channel = await ChannelModel.findById(params.id).lean();
    if (!channel) return Response.json({ success: false, error: "Channel not found" }, { status: 404 });
    if (channel.type === "mentor-messaging" && me.role === "student") {
      return Response.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // Rate limit per user
    const limiter = ServerlessRateLimiter.getInstance();
    const rl = limiter.checkLimit(`msg:${me._id}`, { windowMs: 10_000, maxRequests: 10 });
    if (!rl.allowed) return Response.json({ success: false, error: rl.error }, { status: 429 });

    const body = await req.json();
    const msg = await MessageModel.create({
      channelId: params.id,
      senderId: me._id,
      body: body.body,
      // attachments: client uploads to Cloudinary; server just stores URLs
      attachments: body.attachments || [],
      mentions: body.mentions || [],
      threadId: body.threadId || undefined,
    });

    // Update channel lastMessageAt
    await ChannelModel.findByIdAndUpdate(params.id, { $set: { lastMessageAt: new Date() } });

    // Realtime publish removed

    return Response.json({ success: true, data: msg });
  } catch (e: any) {
    return Response.json({ success: false, error: e?.message || "Failed to send message" }, { status: 500 });
  }
}


