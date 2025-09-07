import { NextRequest } from "next/server";
import { typingBus } from "@/lib/sse/typingBus";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const channelKey = url.searchParams.get('channel') || 'general';

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const enc = new TextEncoder();
      const send = (ev: any) => {
        try {
          controller.enqueue(enc.encode(`event: typing\n`));
          controller.enqueue(enc.encode(`data: ${JSON.stringify(ev)}\n\n`));
          controller.enqueue(enc.encode(`data: ${JSON.stringify(ev)}\n\n`));
        } catch {}
      };
      const unsubscribe = typingBus.subscribe(channelKey, send);
      const ping = setInterval(() => { try { controller.enqueue(enc.encode(`: ping\n\n`)); } catch {} }, 15000);
      (req as any).signal?.addEventListener?.('abort', () => { clearInterval(ping); try { unsubscribe(); controller.close(); } catch {} });
    }
  });

  return new Response(stream, { status: 200, headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-cache, no-transform', connection: 'keep-alive' } });
}





