"use client";

import { useEffect, useRef, useState } from "react";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";

type Resource = { _id: string; title: string; tags?: string[]; createdAt?: string };

export default function ResourceCard({ resource, onView, onEdit, onDelete }: { resource: Resource; onView: (r: Resource) => void; onEdit: (r: Resource) => void; onDelete?: (r: Resource) => void; }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  return (
    <div
      className="relative p-4 border rounded bg-white cursor-pointer hover:bg-gray-50"
      onClick={() => onView(resource)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onView(resource); }}
    >
      {/* Kebab menu */}
      <div className="absolute top-2 right-2" ref={menuRef}>
        <button
          type="button"
          className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
          onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
          aria-label="More options"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-200 rounded shadow-md z-10">
            <button
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
              onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit(resource); }}
            >
              <Pencil className="w-4 h-4" /> Edit
            </button>
            {onDelete && (
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(resource); }}
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            )}
          </div>
        )}
      </div>

      <div className="font-medium mb-1 pr-8">{resource.title}</div>
      <div className="text-xs text-gray-500 mb-2">{resource.createdAt ? new Date(resource.createdAt).toISOString() : ''}</div>
      <div className="flex gap-2 flex-wrap">
        {(resource.tags || []).map(t => (
          <span key={t} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded border border-gray-200">{t}</span>
        ))}
      </div>
    </div>
  );
}


