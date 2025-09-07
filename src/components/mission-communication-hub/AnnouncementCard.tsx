"use client";

import MarkdownViewer from "./MarkdownViewer";
import { useState } from "react";
import { FBReaction } from "./FBReactions";
import FBReactionRow from "./FBReactionRow";

export default function AnnouncementCard({
  author,
  createdAt,
  content,
  type,
  myReaction,
  counts,
  onChangeReaction,
  onMarkRead,
  read,
  canEditDelete,
  onEdit,
  onDelete,
}: {
  author: string;
  createdAt: string; // ISO
  content: string;
  type?: "general" | "session" | "live-session" | "important";
  myReaction: FBReaction | null;
  counts: Record<FBReaction, number>;
  onChangeReaction: (r: FBReaction | null) => void;
  onMarkRead?: () => void;
  read?: boolean;
  canEditDelete?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const initials = author
    .split(" ")
    .map((s) => s.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");

  return (
    <div className="relative rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow ring-1 ring-black/5">
      {/* Accent bar */}
      <div className="absolute left-0 top-0 h-full w-1 bg-black rounded-l-xl" />

      <div className="p-4 pl-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-black text-white flex items-center justify-center text-sm font-semibold">
              {initials}
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">{author}</div>
              <div className="text-xs text-gray-500">
                {new Intl.DateTimeFormat('en-US', {
                  timeZone: 'Asia/Dhaka',
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                }).format(new Date(createdAt))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 relative">
            <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 border border-gray-200">
              {type ? type.replace(/-/g, " ") : "announcement"}
            </span>
            {canEditDelete ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen(v => !v)}
                  className="h-7 w-7 rounded hover:bg-gray-100 flex items-center justify-center text-gray-600 border border-gray-200"
                  aria-label="More"
                >
                  ⋮
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded shadow-md z-10">
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); onEdit && onEdit(); }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); onDelete && onDelete(); }}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>

        {/* Body with see more */}
        <div className="text-sm leading-6">
          {expanded || (content.split(/\s+/).filter(Boolean).length <= 200) ? (
            <MarkdownViewer text={content} />
          ) : (
            <>
              <MarkdownViewer text={content.split(/\s+/).slice(0, 200).join(" ") + "…"} />
              <button type="button" className="text-xs underline" onClick={() => setExpanded(true)}>See more</button>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={onMarkRead}
            disabled={!!read}
            className={`px-3 py-1.5 text-sm rounded-lg border ${read ? 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
          >
            {read ? 'Read' : 'Mark as read'}
          </button>
          <FBReactionRow value={myReaction} counts={counts} onChange={onChangeReaction} />
        </div>
      </div>
    </div>
  );
}


