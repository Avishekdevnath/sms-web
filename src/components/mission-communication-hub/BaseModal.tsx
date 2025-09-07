"use client";

import { useEffect, useRef, useState } from "react";
import { X, MoreVertical, Pencil, Trash2 } from "lucide-react";

export default function BaseModal({ open, title, onClose, children, showMenu = false, onEdit, onDelete, maxWidth = "max-w-lg" }: { open: boolean; title?: string; onClose: () => void; children: React.ReactNode; showMenu?: boolean; onEdit?: () => void; onDelete?: () => void; maxWidth?: string; }) {
  if (!open) return null;
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
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className={`bg-white w-full ${maxWidth} max-h-[90vh] rounded shadow-xl flex flex-col overflow-hidden`}>
          {title !== undefined && (
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <div className="font-semibold">{title}</div>
              <div className="flex items-center gap-1" ref={menuRef}>
                {showMenu && (
                  <>
                    <button
                      type="button"
                      className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
                      onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
                      aria-label="More options"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    {menuOpen && (
                      <div className="absolute right-12 mt-10 w-36 bg-white border border-gray-200 rounded shadow-md z-10">
                        {onEdit && (
                          <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50" onClick={() => { setMenuOpen(false); onEdit(); }}>
                            <Pencil className="w-4 h-4" /> Edit
                          </button>
                        )}
                        {onDelete && (
                          <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50" onClick={() => { setMenuOpen(false); onDelete(); }}>
                            <Trash2 className="w-4 h-4" /> Delete
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}
                <button onClick={onClose} className="p-1.5 rounded hover:bg-gray-100 text-gray-600" aria-label="Close">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
          <div className="p-4 overflow-auto flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
}


