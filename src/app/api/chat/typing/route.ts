import { NextRequest } from "next/server";
import { typingBus } from "@/lib/sse/typingBus";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { channelKey = 'general', user = 'user', typing = false } = body || {};
  typingBus.emit({ channelKey, user, typing, ts: Date.now() });
  return Response.json({ ok: true });
}





