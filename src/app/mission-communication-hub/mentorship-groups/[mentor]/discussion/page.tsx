"use client";

import { useState } from "react";
import MessageList, { ChatMessage } from "@/components/mission-communication-hub/MessageList";
import MessageComposer from "@/components/mission-communication-hub/MessageComposer";

export default function MentorDiscussion({ params }: { params: { mentor: string } }) {
  const title = `${params.mentor} • Discussion`;
  const [messages, setMessages] = useState<ChatMessage[]>([
    { _id: "m1", senderName: params.mentor, body: "Welcome to the group discussion!", createdAt: "2025-01-01T10:00:00.000Z", reactionCounts: { ok: 0, like: 0, love: 0, wow: 0, sad: 0 }, myReaction: null },
    { _id: "m2", senderName: "You", body: "# Updates\n- Standup at 10\n- Demo at 4", createdAt: "2025-01-01T10:05:00.000Z", mine: true, reactionCounts: { ok: 0, like: 0, love: 0, wow: 0, sad: 0 }, myReaction: null },
  ]);
  const [attached, setAttached] = useState<{ name: string; url?: string } | null>(null);
  const [replyingTo, setReplyingTo] = useState<{ id: string; snippet: string } | null>(null);

  const onSend = (text: string) => {
    let body = text;
    if (attached?.url) body += `\nAttached: ${attached.url}`;
    if (replyingTo?.snippet) body = `> ${replyingTo.snippet}\n\n` + body;
    const msg: ChatMessage = { _id: `tmp-${Date.now()}`, senderName: "You", body, createdAt: new Date().toISOString(), mine: true, reactionCounts: { ok: 0, like: 0, love: 0, wow: 0, sad: 0 }, myReaction: null };
    setMessages((prev) => [...prev, msg]);
    setAttached(null);
    setReplyingTo(null);
  };
  const onAttachImage = async (file: File) => {
    const url = `https://example.com/${encodeURIComponent(file.name)}`;
    setAttached({ name: file.name, url });
  };

  return (
    <div className="flex flex-col h-full min-h-0 gap-4">
      <div className="flex flex-col flex-1 min-h-0 border rounded p-4 bg-white">
        <div className="text-sm font-medium mb-3">{title}</div>
        <div className="flex-1 min-h-0 overflow-y-auto mb-3">
          <MessageList
            messages={messages}
            onReact={(id, r) => {
              setMessages(prev => prev.map(m => {
                if (m._id !== id) return m;
                const counts = { ok: 0, like: 0, love: 0, wow: 0, sad: 0, ...(m.reactionCounts || {}) } as any;
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
          onSend={onSend}
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


