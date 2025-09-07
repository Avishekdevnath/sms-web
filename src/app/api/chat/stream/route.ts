import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Message } from "@/models";

export async function GET(req: NextRequest) {
  await connectToDatabase();
  const url = new URL(req.url);
  const channelId = url.searchParams.get('channel');
  if (!channelId) return new Response('channel required', { status: 400 });

  let lastId: string | null = null;
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (event: string, payload: unknown) => {
        try {
          controller.enqueue(enc.encode(`event: ${event}\n`));
          controller.enqueue(enc.encode(`data: ${JSON.stringify(payload)}\n\n`));
        } catch {}
      };

      const initial = await Message.find({ channelId }).sort({ createdAt: -1 }).limit(50).lean();
      initial.reverse().forEach((m) => send('message', m));
      lastId = initial.length ? String(initial[initial.length - 1]._id) : null;

      let closed = false;
      const timer = setInterval(async () => {
        if (closed) return;
        try {
          const query = lastId ? { channelId, _id: { $gt: lastId } as any } : { channelId };
          const newer = await Message.find(query).sort({ _id: 1 }).lean();
          for (const m of newer) {
            if (closed) break;
            send('message', m);
            lastId = String(m._id);
          }
          if (!closed) controller.enqueue(enc.encode(`: ping\n\n`));
        } catch {}
      }, 1500);

      (req as any).signal?.addEventListener?.('abort', () => { closed = true; clearInterval(timer); try { controller.close(); } catch {} });
    }
  });

  return new Response(stream, { status: 200, headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-cache, no-transform', connection: 'keep-alive' } });
}





