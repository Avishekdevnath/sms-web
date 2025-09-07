"use client";

import { useState } from "react";
import MessageList, { ChatMessage } from "@/components/mission-communication-hub/MessageList";
import MessageComposer from "@/components/mission-communication-hub/MessageComposer";

export default function ChannelsPage() {
  const title = "Mentor Messaging";
  const [messages, setMessages] = useState<ChatMessage[]>([
    { _id: "m1", senderName: "System", body: "Demo channel.", createdAt: "2025-01-01T10:00:00.000Z" },
  ]);
  const [attached, setAttached] = useState<{ name: string; url?: string } | null>(null);

  const onSend = (text: string) => {
    let body = text;
    if (attached?.url) body += `\nAttached: ${attached.url}`;
    const msg: ChatMessage = { _id: `tmp-${Date.now()}`, senderName: "You", body, createdAt: new Date().toISOString(), mine: true };
    setMessages((prev) => [...prev, msg]);
    setAttached(null);
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
          <MessageList messages={messages} />
        </div>
        <MessageComposer
          onSend={onSend}
          onAttachImage={onAttachImage}
          attachedFileName={attached?.name}
          onClearAttachment={() => setAttached(null)}
        />
      </div>
    </div>
  );
}


