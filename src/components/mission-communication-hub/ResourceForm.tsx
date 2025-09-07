"use client";

import { useState } from "react";

export type ResourceDraft = { title: string; content: string; tags: string[] };

export default function ResourceForm({ initial, onSubmit, onCancel }: { initial?: ResourceDraft; onSubmit: (draft: ResourceDraft) => void; onCancel: () => void; }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [content, setContent] = useState(initial?.content || "");
  const [tagInput, setTagInput] = useState((initial?.tags || []).join(", "));

  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); onSubmit({ title: title || "Untitled", content, tags: tagInput.split(",").map(s => s.trim()).filter(Boolean) }); }}>
      <div>
        <label className="text-sm text-gray-600">Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black focus:border-black" />
      </div>
      <div>
        <label className="text-sm text-gray-600">Content</label>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black focus:border-black" />
      </div>
      <div>
        <label className="text-sm text-gray-600">Tags (comma separated)</label>
        <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black focus:border-black" />
      </div>
      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
        <button className="px-3 py-2 text-sm bg-black text-white rounded">Save</button>
      </div>
    </form>
  );
}


