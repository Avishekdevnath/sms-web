"use client";

import { Bell, ChevronDown, LogOut, MessageCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

function formatSegment(seg: string) {
  return seg
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

export default function CommunicationHubHeader({ user }: { user: any }) {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("mission-communication-hub");
  const trail = idx >= 0 ? parts.slice(idx + 1) : [];
  const pretty = trail.map(formatSegment).join(" • ");
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (open && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        window.location.href = "/login";
      }
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6">
      <div className="flex items-center space-x-3">
        <MessageCircle className="w-6 h-6 text-black" />
        <div>
          <h1 className="text-lg font-semibold text-black">Mission Communication Hub</h1>
          {pretty && (
            <div className="text-xs text-gray-500 -mt-0.5">{pretty}</div>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <button className="p-2 rounded-lg text-gray-600 hover:text-black hover:bg-gray-100 transition-colors">
          <Bell className="w-5 h-5" />
        </button>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center space-x-2 px-3 py-2 rounded-md border border-gray-200 hover:bg-gray-50 text-sm text-gray-700"
          >
            <div className="text-left leading-tight">
              <div className="font-medium text-gray-900">{user?.name}</div>
              <div className="text-xs text-gray-500 capitalize">{user?.role}</div>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>
          {open && (
            <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-md shadow-lg z-10">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}


