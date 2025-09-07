"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import ResourceCard from "@/components/mission-communication-hub/ResourceCard";
import BaseModal from "@/components/mission-communication-hub/BaseModal";
import ContentViewer from "@/components/mission-communication-hub/ContentViewer";
import ResourceForm, { ResourceDraft } from "@/components/mission-communication-hub/ResourceForm";

type Resource = { _id: string; title: string; content?: string; tags?: string[]; createdAt?: string };

export default function MissionResourcesPage() {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const [resources, setResources] = useState<Resource[]>([
    { _id: "mr1", title: "Mission Overview", content: "High-level mission goals and success metrics.", tags: ["mission", "overview"], createdAt: "2025-01-05T10:00:00.000Z" },
    { _id: "mr2", title: "Student Handbook", content: "Guidelines for students participating in the mission.", tags: ["student", "policy"], createdAt: "2025-01-06T12:00:00.000Z" },
    { _id: "mr3", title: "Submission Template", content: "Use this template for weekly submissions.", tags: ["template", "submission"], createdAt: "2025-01-07T14:30:00.000Z" },
  ]);

  const tags = useMemo(() => {
    const t = new Set<string>();
    resources.forEach(r => (r.tags || []).forEach(tag => t.add(tag)));
    return Array.from(t.values());
  }, [resources]);

  const filtered = useMemo(() => {
    return resources.filter(r => {
      const matchesQ = query.trim().length === 0 || r.title.toLowerCase().includes(query.toLowerCase());
      const matchesTag = !activeTag || (r.tags || []).includes(activeTag);
      return matchesQ && matchesTag;
    });
  }, [resources, query, activeTag]);

  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<Resource | null>(null);

  const onView = (r: Resource) => { setSelected(r); setViewOpen(true); };
  const onEdit = (r: Resource) => { setSelected(r); setEditOpen(true); };
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Mission Groups • Resources</h2>
        <button onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-black rounded hover:bg-gray-800">
          <Plus className="w-4 h-4" /> New Resource
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            placeholder="Search resources..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTag(null)}
            className={`px-3 py-2 text-sm rounded border ${!activeTag ? 'bg-black text-white border-black' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
          >All</button>
          {tags.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`px-3 py-2 text-sm rounded border ${activeTag === tag ? 'bg-black text-white border-black' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >{tag}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((r) => (
          <ResourceCard key={r._id} resource={r} onView={onView} onEdit={onEdit} onDelete={(res) => alert(`Delete ${res.title} (demo)`)} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-sm text-gray-500">No resources found.</div>
      )}

      <BaseModal open={viewOpen} title="View Resource" onClose={() => setViewOpen(false)} showMenu onEdit={() => { setViewOpen(false); if (selected) setEditOpen(true); }} onDelete={() => { setViewOpen(false); alert('Delete (demo)'); }}>
        {selected && (
          <div className="space-y-2">
            <div className="font-medium">{selected.title}</div>
            <div className="text-xs text-gray-500">{selected.createdAt ? new Date(selected.createdAt).toISOString() : ''}</div>
            <div className="flex gap-2 flex-wrap">
              {(selected.tags || []).map(t => (
                <span key={t} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded border border-gray-200">{t}</span>
              ))}
            </div>
            <ContentViewer content={selected.content} />
          </div>
        )}
      </BaseModal>

      <BaseModal open={editOpen} title="Edit Resource" onClose={() => setEditOpen(false)}>
        {selected && (
          <ResourceForm
            initial={{ title: selected.title, content: selected.content || "", tags: selected.tags || [] }}
            onCancel={() => setEditOpen(false)}
            onSubmit={(draft: ResourceDraft) => {
              setResources(prev => prev.map(r => r._id === selected._id ? { ...r, title: draft.title, content: draft.content, tags: draft.tags } : r));
              setEditOpen(false);
            }}
          />
        )}
      </BaseModal>

      <BaseModal open={createOpen} title="New Resource" onClose={() => setCreateOpen(false)}>
        <ResourceForm
          onCancel={() => setCreateOpen(false)}
          onSubmit={(draft: ResourceDraft) => {
            const id = `tmp-${Date.now()}`;
            const created: Resource = { _id: id, title: draft.title, content: draft.content, tags: draft.tags, createdAt: new Date().toISOString() };
            setResources(prev => [created, ...prev]);
            setCreateOpen(false);
          }}
        />
      </BaseModal>
    </div>
  );
}
