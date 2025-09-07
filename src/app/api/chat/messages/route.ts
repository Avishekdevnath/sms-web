import { NextRequest } from "next/server";
import { Types } from "mongoose";
import type { Model } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { Channel, Message } from "@/models";
import type { IMessage, IChannel } from "@/models";
import { getAuthUserFromRequest } from "@/lib/rbac";
import { ServerlessRateLimiter } from "@/utils/rateLimiting";

// GET /api/chat/messages?channel=<channelId>&limit=&cursor=
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get("channel");
    if (!channelId) return Response.json({ success: false, error: "channel required" }, { status: 400 });

    const limit = Math.min(Number(searchParams.get("limit") || 30), 100);
    const cursor = searchParams.get("cursor");

    const filter: any = { channelId };
    if (cursor) filter._id = { $lt: new Types.ObjectId(cursor) } as any;

    const MessageModel = Message as unknown as Model<IMessage>;

    const docs = await MessageModel.find(filter).sort({ _id: -1 }).limit(limit).lean();
    const nextCursor = docs.length === limit ? String(docs[docs.length - 1]._id) : null;
    return Response.json({ success: true, data: docs.reverse(), nextCursor });
  } catch (e: any) {
    return Response.json({ success: false, error: e?.message || "Failed to fetch messages" }, { status: 500 });
  }
}

// POST /api/chat/messages { channelId, body, attachments? }
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    if (!me) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const limiter = ServerlessRateLimiter.getInstance();
    const rl = limiter.checkLimit(`chatmsg:${me._id}`, { windowMs: 10_000, maxRequests: 10 });
    if (!rl.allowed) return Response.json({ success: false, error: rl.error || "Rate limit" }, { status: 429 });

    const body = await req.json();
    const { channelId, body: text, attachments } = body || {};
    if (!channelId || !text || typeof text !== "string") {
      return Response.json({ success: false, error: "channelId and body are required" }, { status: 400 });
    }

    const ChannelModel = Channel as unknown as Model<IChannel>;
    const channel = await ChannelModel.findById(channelId).lean();
    if (!channel) return Response.json({ success: false, error: "Channel not found" }, { status: 404 });
    if (channel.type === "mentor-messaging" && me.role === "student") {
      return Response.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const msg = await MessageModel.create({
      channelId,
      senderId: me._id,
      body: text,
      attachments: Array.isArray(attachments) ? attachments : [],
    });

    await ChannelModel.findByIdAndUpdate(channelId, { $set: { lastMessageAt: new Date() } });

    return Response.json({ success: true, data: msg });
  } catch (e: any) {
    return Response.json({ success: false, error: e?.message || "Failed to send message" }, { status: 500 });
  }
}


