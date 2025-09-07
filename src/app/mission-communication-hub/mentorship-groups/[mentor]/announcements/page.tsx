"use client";

import { useMemo, useState } from "react";
import AnnouncementCard from "@/components/mission-communication-hub/AnnouncementCard";
import AnnouncementFormModal from "@/components/mission-communication-hub/AnnouncementFormModal";
import { FBReaction } from "@/components/mission-communication-hub/FBReactions";
import { useAuth } from "@/context/AuthContext";

// For consistency with chat UI, we present announcements as a read + comment thread.
export default function MentorAnnouncements({ params }: { params: { mentor: string } }) {
  const title = `${params.mentor} • Announcements`;
  const { user } = useAuth();
  type AnnItem = { id: string; author: string; createdAt: string; content: string; type?: "general"|"session"|"live-session"|"important"; myReaction: FBReaction | null; counts: Record<FBReaction, number>; read?: boolean };
  const [announcements, setAnnouncements] = useState<AnnItem[]>([
    { id: "a1", author: params.mentor, createdAt: "2025-01-02T09:00:00.000Z", content: "# Group Announcement\nWelcome to the new sprint!", type: "general", myReaction: null, counts: { ok: 2, like: 0, love: 5, sad: 0, wow: 1 }, read: false }
  ]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AnnItem | null>(null);

  const canEditDelete = useMemo(() => (a: AnnItem) => {
    if (!user) return false;
    const role = (user.role || '').toLowerCase();
    const isStudent = role === 'student';
    const isAdminRole = role === 'admin' || role === 'superadmin';
    const isAuthor = (user.name || '').toLowerCase() === (a.author || '').toLowerCase();
    return !isStudent && (isAuthor || isAdminRole);
  }, [user]);


  return (
    <div className="flex flex-col h-full min-h-0 gap-4">
      <div className="flex flex-col flex-1 min-h-0 border rounded p-4 bg-white">
        <div className="text-sm font-medium mb-3 flex items-center justify-between">
          <span>{title}</span>
          <button onClick={() => setCreateOpen(true)} className="px-3 py-2 text-sm bg-black text-white rounded">New Announcement</button>
        </div>
        <div className="space-y-3 overflow-y-auto flex-1 min-h-0">
          {announcements.map((a) => (
            <AnnouncementCard
              key={a.id}
              author={a.author}
              createdAt={a.createdAt}
              content={a.content}
              type={a.type}
              myReaction={a.myReaction}
              counts={a.counts}
              onChangeReaction={(next) => {
                setAnnouncements((prev) => prev.map(it => it.id === a.id ? {
                  ...it,
                  counts: (() => { const c = { ...it.counts }; if (it.myReaction) c[it.myReaction] = Math.max(0, c[it.myReaction] - 1); if (next) c[next] = (c[next] || 0) + 1; return c; })(),
                  myReaction: next,
                } : it));
              }}
              onMarkRead={() => setAnnouncements(prev => prev.map(it => it.id === a.id ? { ...it, read: true } : it))}
              read={a.read}
              canEditDelete={canEditDelete(a)}
              onEdit={() => setEditTarget(a)}
              onDelete={() => setAnnouncements(prev => prev.filter(it => it.id !== a.id))}
            />
          ))}
        </div>
        <AnnouncementFormModal
          open={createOpen || !!editTarget}
          onClose={() => { setCreateOpen(false); setEditTarget(null); }}
          initial={editTarget ? {
            title: (editTarget.content.match(/^#\s+(.*)$/m)?.[1] || '').trim(),
            body: editTarget.content.replace(/^#\s+.*$/m, '').trim(),
            type: (editTarget.type || 'general'),
          } : null}
          onSubmit={(a) => {
            const now = new Date().toISOString();
            if (editTarget) {
              setAnnouncements(prev => prev.map(it => it.id === editTarget.id ? { ...it, content: `# ${a.title}\n\n${a.body}`, type: a.type } : it));
              setEditTarget(null);
              setCreateOpen(false);
              return;
            }
            setAnnouncements(prev => [...prev, { id: `a-${Date.now()}`, author: params.mentor, createdAt: now, content: `# ${a.title}\n\n${a.body}`, type: a.type, myReaction: null, counts: { ok: 0, like: 0, love: 0, sad: 0, wow: 0 } }]);
            setCreateOpen(false);
          }}
        />
      </div>
    </div>
  );
}


