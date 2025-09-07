"use client";

import { useEffect, useRef, useState } from "react";
import BaseModal from "./BaseModal";
import MarkdownViewer from "./MarkdownViewer";
import CloudinaryUpload from "@/components/CloudinaryUpload";

type AnnouncementType = "general" | "session" | "live-session" | "important";

export default function AnnouncementFormModal({
  open,
  onClose,
  onSubmit,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (a: { title: string; body: string; type: AnnouncementType }) => void;
  initial?: { title: string; body: string; type: AnnouncementType } | null;
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<AnnouncementType>("general");
  const [body, setBody] = useState("");
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [images, setImages] = useState<string[]>([]);

  function wrapSelection(before: string, after: string = before) {
    const el = bodyRef.current;
    if (!el) return;
    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const value = body;
    const selected = value.slice(start, end) || "text";
    const next = value.slice(0, start) + before + selected + after + value.slice(end);
    setBody(next);
    queueMicrotask(() => {
      const pos = start + before.length + selected.length + after.length;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  }

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setTitle(initial.title || "");
      setType(initial.type || "general");
      setBody(initial.body || "");
    } else {
      setTitle("");
      setType("general");
      setBody("");
    }
  }, [open, initial]);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 320) + "px";
  }, [body]);

  return (
    <BaseModal open={open} title={initial ? "Edit Announcement" : "New Announcement"} onClose={onClose} maxWidth="max-w-3xl">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim() || !body.trim()) return;
          onSubmit({ title: title.trim(), body, type });
        }}
      >
        <div>
          <label className="block text-sm text-gray-700 mb-1">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
            placeholder="Enter announcement title"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as AnnouncementType)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
          >
            <option value="general">General</option>
            <option value="session">Session</option>
            <option value="live-session">Live Session</option>
            <option value="important">Important</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Body (supports markdown)</label>
          <div className="flex flex-wrap items-center gap-1 mb-2">
            <button type="button" onClick={() => wrapSelection("**", "**")} className="px-2 py-1 text-xs border rounded">B</button>
            <button type="button" onClick={() => wrapSelection("*", "*")} className="px-2 py-1 text-xs border rounded italic">i</button>
            <button type="button" onClick={() => wrapSelection("__", "__")} className="px-2 py-1 text-xs border rounded underline">U</button>
            <button type="button" onClick={() => wrapSelection("~~", "~~")} className="px-2 py-1 text-xs border rounded line-through">S</button>
            <button type="button" onClick={() => wrapSelection("`", "`")} className="px-2 py-1 text-xs border rounded">`code`</button>
            <button type="button" onClick={() => wrapSelection("\n- ", "")} className="px-2 py-1 text-xs border rounded">• list</button>
            <button type="button" onClick={() => wrapSelection("\n1. ", "")} className="px-2 py-1 text-xs border rounded">1. list</button>
            <button type="button" onClick={() => wrapSelection("> ", "")} className="px-2 py-1 text-xs border rounded">quote</button>
            <button type="button" onClick={() => setBody(b => b + "\n| col1 | col2 |\n| --- | --- |\n| v1 | v2 |\n")} className="px-2 py-1 text-xs border rounded">table</button>
            <button type="button" onClick={() => wrapSelection("![alt](", ")")} className="px-2 py-1 text-xs border rounded">img</button>
            <button type="button" onClick={() => wrapSelection("||", "||")} className="px-2 py-1 text-xs border rounded">spoiler</button>
            <button type="button" onClick={() => wrapSelection("@", "")} className="px-2 py-1 text-xs border rounded">@</button>
            <button type="button" onClick={() => setShowPreview(v => !v)} className="ml-auto px-2 py-1 text-xs border rounded">{showPreview ? 'Hide' : 'Show'} preview</button>
          </div>
          <textarea
            ref={bodyRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (!(e.ctrlKey || e.metaKey)) return;
              const key = e.key.toLowerCase();
              if (key === 'b') {
                e.preventDefault();
                wrapSelection('**', '**');
              } else if (key === 'i') {
                e.preventDefault();
                wrapSelection('*', '*');
              } else if (key === 'u') {
                e.preventDefault();
                wrapSelection('__', '__');
              } else if (key === '`' || key === 'e') { // ctrl+` or ctrl+e for inline code
                e.preventDefault();
                wrapSelection('`', '`');
              } else if (key === 'k') {
                e.preventDefault();
                const el = bodyRef.current;
                const start = el?.selectionStart || 0;
                const end = el?.selectionEnd || 0;
                const selected = body.slice(start, end) || 'link';
                const next = body.slice(0, start) + `[${selected}](https://)` + body.slice(end);
                setBody(next);
                queueMicrotask(() => {
                  if (!el) return;
                  const cursor = start + selected.length + 4; // place inside https
                  el.focus();
                  el.setSelectionRange(cursor, cursor);
                });
              }
            }}
            placeholder={"Use # for heading, `code`, and - for bullets"}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black focus:border-black leading-6 resize-none overflow-y-auto min-h-[240px]"
          />
          <div className="mt-2">
            <div className="text-sm text-gray-700 mb-1">Images</div>
            <div className="grid grid-cols-5 gap-2">
              {images.map((src, i) => (
                <img key={i} src={src} alt="upload" className="h-16 w-full object-cover rounded border" />
              ))}
              <div className="col-span-5">
                <CloudinaryUpload
                  className="w-full"
                  compact
                  onUploadSuccess={(url: string) => {
                    setImages(prev => [...prev, url]);
                    const el = bodyRef.current;
                    const start = el?.selectionStart || body.length;
                    const end = el?.selectionEnd || body.length;
                    const next = body.slice(0, start) + `\n![image](${url})\n` + body.slice(end);
                    setBody(next);
                    queueMicrotask(() => el?.focus());
                  }}
                  onUploadError={(err) => console.error(err)}
                />
              </div>
            </div>
          </div>
          <div className="mt-1 text-xs text-gray-500">Enter to add new line; supports basic markdown like headings, code and lists.</div>
        </div>
        {showPreview && (
          <div>
            <div className="text-sm text-gray-700 mb-1">Preview</div>
            <div className="p-3 border rounded bg-white max-h-[260px] overflow-auto">
              <MarkdownViewer text={body} />
            </div>
          </div>
        )}
        <div className="flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
          <button type="submit" className="px-3 py-2 text-sm bg-black text-white rounded">Publish</button>
        </div>
      </form>
    </BaseModal>
  );
}


