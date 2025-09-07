"use client";

import { useMemo, useState } from "react";
import ChannelList from "@/components/mission-communication-hub/ChannelList";
import MessageList, { ChatMessage } from "@/components/mission-communication-hub/MessageList";
import MessageComposer from "@/components/mission-communication-hub/MessageComposer";

export default function AdminMessagingPage() {
  const channels = [
    { _id: "am1", name: "Admin ↔ Mentor Messaging", type: "mentor-messaging" as const },
  ];
  const [activeChannelId, setActiveChannelId] = useState<string>(channels[0]._id);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { _id: "m1", senderName: "Admin", body: "Welcome! Please share updates.", createdAt: "2025-01-01T10:00:00.000Z", reactionCounts: { ok: 0, like: 1, love: 0, sad: 0, wow: 0 }, myReaction: null },
    { _id: "m2", senderName: "Mentor", body: "Here is the weekly plan: https://example.com/plan", createdAt: "2025-01-01T10:05:00.000Z", reactionCounts: { ok: 0, like: 0, love: 0, sad: 0, wow: 0 }, myReaction: null },
  ]);
  const [attached, setAttached] = useState<{ name: string; url?: string } | null>(null);
  const [replyingTo, setReplyingTo] = useState<{ id: string; snippet: string } | null>(null);

  const onSelectChannel = (id: string) => setActiveChannelId(id);
  const onSend = (text: string) => {
    let body = text;
    if (attached?.url) body += `\nAttached: ${attached.url}`;
    const msg: ChatMessage = { _id: `tmp-${Date.now()}`, senderName: "You", body, createdAt: new Date().toISOString(), mine: true, reactionCounts: { ok: 0, like: 0, love: 0, sad: 0, wow: 0 }, myReaction: null };
    setMessages((prev) => [...prev, msg]);
    setAttached(null);
  };
  const onAttachImage = async (file: File) => {
    // Placeholder: in real impl, upload to Cloudinary and set URL
    const url = `https://example.com/${encodeURIComponent(file.name)}`;
    setAttached({ name: file.name, url });
  };

  return (
    <div className="flex flex-col h-full min-h-0 gap-4">

      {/* Conversation block */}
      <div className="flex flex-col flex-1 min-h-0 border rounded p-4 bg-white">
        <div className="text-sm font-medium mb-3">{channels.find(c => c._id === activeChannelId)?.name}</div>
        <div className="flex-1 min-h-0 overflow-y-auto mb-3">
          <MessageList
            messages={messages}
            onReact={(id, r) => {
              setMessages((prev) => prev.map(m => {
                if (m._id !== id) return m;
                const counts = { ok: 0, like: 0, love: 0, sad: 0, wow: 0, ...(m.reactionCounts || {}) } as any;
                if (m.myReaction) counts[m.myReaction] = Math.max(0, counts[m.myReaction] - 1);
                if (r) counts[r] = (counts[r] || 0) + 1;
                return { ...m, myReaction: r, reactionCounts: counts };
              }));
            }}
            onReply={(id) => {
              const msg = messages.find(m => m._id === id);
              if (!msg) return;
              const snippet = msg.body.length > 160 ? msg.body.slice(0, 157) + '…' : msg.body;
              setReplyingTo({ id, snippet });
            }}
          />
        </div>
        <MessageComposer
          onSend={(text) => {
            let prefix = '';
            if (replyingTo?.snippet) prefix = `> ${replyingTo.snippet}\n\n`;
            onSend(prefix + text);
            setReplyingTo(null);
          }}
          onAttachImage={onAttachImage}
          attachedFileName={attached?.name}
          onClearAttachment={() => setAttached(null)}
          replySnippet={replyingTo?.snippet || null}
          onCancelReply={() => setReplyingTo(null)}
        />
      </div>
    </div>
  );
}


