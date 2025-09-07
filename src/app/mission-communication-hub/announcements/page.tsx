"use client";

import { useState } from "react";
import AnnouncementCard from "@/components/mission-communication-hub/AnnouncementCard";
import AnnouncementFormModal from "@/components/mission-communication-hub/AnnouncementFormModal";
import MessageList, { ChatMessage } from "@/components/mission-communication-hub/MessageList";
import MessageComposer from "@/components/mission-communication-hub/MessageComposer";
import { FBReaction } from "@/components/mission-communication-hub/FBReactions";
import { useAuth } from "@/context/AuthContext";

export default function AnnouncementsPage() {
  const title = "Announcements";
  const { user } = useAuth();
  const [announcement] = useState({
    author: "Staff",
    createdAt: "2025-01-02T09:00:00.000Z",
    content: "# Kickoff Meeting\nJoin at 10:00.",
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [attached, setAttached] = useState<{ name: string; url?: string } | null>(null);
  const [myReaction, setMyReaction] = useState<FBReaction | null>(null);
  const [counts, setCounts] = useState<Record<FBReaction, number>>({ ok: 0, like: 0, love: 1, sad: 0, wow: 0 });

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
        <div className="text-sm font-medium mb-3 flex items-center justify-between">
          <span>{title}</span>
          <button onClick={() => setCreateOpen(true)} className="px-3 py-2 text-sm bg-black text-white rounded">New Announcement</button>
        </div>
        <div className="mb-3">
          <AnnouncementCard
            author={announcement.author}
            createdAt={announcement.createdAt}
            content={announcement.content}
            myReaction={myReaction}
            counts={counts}
            onChangeReaction={(next) => {
              setCounts((prev) => {
                const out: Record<FBReaction, number> = { ...prev };
                if (myReaction) out[myReaction] = Math.max(0, out[myReaction] - 1);
                if (next) out[next] = (out[next] ?? 0) + 1;
                return out;
              });
              setMyReaction(next);
            }}
            onMarkRead={() => {}}
            canEditDelete={!!user && ((user.role || '').toLowerCase() !== 'student')}
            onEdit={() => setCreateOpen(true)}
            onDelete={() => { /* demo single item: noop or clear */ }}
          />
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto mb-3">
          <MessageList messages={messages} showEmptyState={false} />
        </div>
        <MessageComposer
          onSend={onSend}
          onAttachImage={onAttachImage}
          attachedFileName={attached?.name}
          onClearAttachment={() => setAttached(null)}
        />
      </div>
      <AnnouncementFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={(a) => {
          setMessages(prev => [{ _id: `a-${Date.now()}`, senderName: 'Staff', body: `# ${a.title}\n\n${a.body}`, createdAt: new Date().toISOString() }, ...prev]);
          setCreateOpen(false);
        }}
      />
    </div>
  );
}


