"use client";

import { useEffect, useRef } from "react";
import ContentViewer from "./ContentViewer";
import UrlHighlighter from "./UrlHighlighter";
import MessageReactions, { FBReaction } from "./MessageReactions";
import MarkdownViewer from "./MarkdownViewer";

export type ChatMessage = {
  _id: string;
  senderName: string;
  body: string;
  createdAt: string; // ISO string to avoid hydration mismatch
  mine?: boolean;
  // Reactions
  myReaction?: FBReaction | null;
  reactionCounts?: Record<FBReaction, number>;
  // Reply thread
  replyToId?: string;
  replyToSnippet?: string;
};

export default function MessageList({ messages, onReact, onReply, showAvatars = true, showEmptyState = true }: { messages: ChatMessage[]; onReact?: (id: string, r: FBReaction | null) => void; onReply?: (id: string) => void; showAvatars?: boolean; showEmptyState?: boolean; }) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Scroll to bottom on mount and when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "auto" });
  }, []);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <div className="flex flex-col gap-3">
      {messages.map((m) => (
        <div key={m._id} className={`flex items-start gap-2 ${m.mine ? 'justify-end' : 'justify-start'}`}>
          {!m.mine && showAvatars && (
            <div className="h-8 w-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-xs select-none">
              {(m.senderName || '?').split(' ').map(s=>s.charAt(0).toUpperCase()).slice(0,2).join('')}
            </div>
          )}
          <div className={`group max-w-[80%] rounded-2xl border p-3 ${m.mine ? 'bg-gradient-to-r from-neutral-900 to-black text-white border-black' : 'bg-gradient-to-r from-amber-50 to-amber-100 text-gray-900 border-amber-200'}`}>
            <div className={`text-xs mb-1 flex items-center justify-between ${m.mine ? 'text-white/80' : 'text-gray-500'}`}>
              <span>{m.senderName} • {new Date(m.createdAt).toISOString().slice(11,16)}</span>
              {onReply && (
                <button type="button" onClick={() => onReply(m._id)} className={`ml-2 text-xs underline ${m.mine ? 'text-white/80 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>Reply</button>
              )}
            </div>
            {m.replyToSnippet && (
              <div className={`mb-2 border-l-2 pl-2 ${m.mine ? 'border-white/40 text-white/80' : 'border-gray-300 text-gray-600'}`}>
                <div className="text-[11px] opacity-70 mb-0.5">Replying to</div>
                <div className="line-clamp-2">{m.replyToSnippet}</div>
              </div>
            )}
            <div className={`${m.mine ? 'text-white' : 'text-gray-900'}`}>
              {m.mine ? (
                <MarkdownViewer text={m.body} />
              ) : (
                <MarkdownViewer text={m.body} />
              )}
            </div>
            <div className="mt-2 flex items-center justify-start">
              <MessageReactions
                value={m.myReaction ?? null}
                counts={m.reactionCounts ?? { ok: 0, like: 0, love: 0, sad: 0, wow: 0 }}
                onChange={(r) => onReact?.(m._id, r)}
              />
            </div>
          </div>
          {m.mine && showAvatars && (
            <div className="h-8 w-8 rounded-full bg-black text-white flex items-center justify-center text-xs select-none">
              {(m.senderName || '?').split(' ').map(s=>s.charAt(0).toUpperCase()).slice(0,2).join('')}
            </div>
          )}
        </div>
      ))}
      {showEmptyState && messages.length === 0 && (
        <div className="text-sm text-gray-500">No messages yet. Start the conversation.</div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}


