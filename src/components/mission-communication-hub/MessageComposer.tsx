"use client";

import { useEffect, useRef, useState } from "react";

export default function MessageComposer({ onSend, onAttachImage, attachedFileName, onClearAttachment, replySnippet, onCancelReply }: { onSend: (text: string) => void; onAttachImage?: (file: File) => void; attachedFileName?: string; onClearAttachment?: () => void; replySnippet?: string | null; onCancelReply?: () => void }) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-grow textarea up to ~10 lines, then scroll. Growth should push content up (not overlap composer),
  // so we rely on the surrounding container's flex-1 to adjust above.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const max = 240; // ~10 lines at 24px line-height
    el.style.height = Math.min(el.scrollHeight, max) + "px";
  }, [text]);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim() && !attachedFileName) return;
        onSend(text);
        setText("");
      }}
      className="flex flex-col gap-2 border-t pt-3"
    >
      {replySnippet && (
        <div className="p-2 border border-gray-300 rounded bg-gray-50 w-full">
          <div className="text-xs text-gray-600 whitespace-pre-wrap">{replySnippet}</div>
          <div className="mt-1 text-right">
            <button type="button" className="text-xs underline" onClick={onCancelReply}>cancel</button>
          </div>
        </div>
      )}
      <div className="flex items-end gap-2">
        <label className="px-3 py-2 text-sm border border-gray-300 rounded cursor-pointer hover:bg-gray-50">
          Attach
          <input type="file" accept="image/*" className="hidden" onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              onAttachImage?.(f);
            }
          }} />
        </label>
        {attachedFileName && (
          <span className="text-xs text-gray-600 flex items-center gap-2">
            {attachedFileName}
            <button type="button" className="underline" onClick={onClearAttachment}>remove</button>
          </span>
        )}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (text.trim() || attachedFileName) {
                onSend(text);
                setText("");
              }
            } else if (e.key === 'Escape') {
              e.preventDefault();
              onCancelReply?.();
            }
          }}
          placeholder="Write a message..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black focus:border-black leading-6 resize-none overflow-y-auto max-h-[240px] min-h-[80px]"
        />
        <button className="px-3 py-2 text-sm bg-black text-white rounded">Send</button>
      </div>
    </form>
  );
}


