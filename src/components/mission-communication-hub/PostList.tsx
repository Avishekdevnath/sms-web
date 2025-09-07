"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

type PostItem = {
  _id: string;
  title: string;
  category: "announcement" | "resource" | "guideline" | "coding";
  status?: "pending" | "investigating" | "resolved" | "approved" | "rejected";
  createdAt?: string;
  author?: string;
};

export default function PostList({ posts, onEdit, onDelete, canEditDelete, makeLink, onOpenPost }: { posts: PostItem[]; onEdit?: (p: PostItem) => void; onDelete?: (p: PostItem) => void; canEditDelete?: (p: PostItem) => boolean; makeLink?: (p: PostItem) => string; onOpenPost?: (p: PostItem) => void; }) {
  const { user } = useAuth();
  const allow = useMemo(() => (p: PostItem) => {
    if (canEditDelete) return canEditDelete(p);
    if (!user) return false;
    const role = (user.role || '').toLowerCase();
    const isStudent = role === 'student';
    const isAdmin = role === 'admin' || role === 'superadmin';
    const isAuthor = (user.name || '').toLowerCase() === (p.author || '').toLowerCase();
    return !isStudent && (isAdmin || isAuthor);
  }, [user, canEditDelete]);

  const [openMenuFor, setOpenMenuFor] = useState<string | null>(null);
  const demoItems: PostItem[] = [
    { _id: 'demo-1', title: 'Demo: Git workflow for students', category: 'guideline', status: 'pending', createdAt: new Date().toISOString() },
    { _id: 'demo-2', title: 'Demo: Investigating API 500 on submit', category: 'guideline', status: 'investigating', createdAt: new Date(Date.now() - 3600_000).toISOString() },
    { _id: 'demo-3', title: 'Demo: Resolved ESLint configuration', category: 'guideline', status: 'resolved', createdAt: new Date(Date.now() - 7200_000).toISOString() },
  ];
  const displayPosts = posts && posts.length > 0 ? posts : demoItems;

  return (
    <div className="space-y-2">
      {displayPosts.map(p => (
        <div key={p._id} className="p-3 border rounded relative">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">
                {onOpenPost ? (
                  <button type="button" className="hover:underline" onClick={() => onOpenPost(p)}>{p.title}</button>
                ) : makeLink ? (
                  <Link href={makeLink(p)} className="hover:underline">{p.title}</Link>
                ) : (
                  <span>{p.title}</span>
                )}
              </div>
              <div className="text-xs text-gray-500">{p.category}{p.status ? ` • ${p.status}` : ''}</div>
            </div>
            <div className="flex items-center gap-2">
              {p.createdAt && (
                <div className="text-xs text-gray-500">{new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Dhaka', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date(p.createdAt))}</div>
              )}
              {allow(p) && (
                <div className="relative">
                  <button type="button" onClick={() => setOpenMenuFor(m => m === p._id ? null : p._id)} className="h-7 w-7 rounded hover:bg-gray-100 flex items-center justify-center text-gray-600 border border-gray-200" aria-label="More">⋮</button>
                  {openMenuFor === p._id && (
                    <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded shadow-md z-10">
                      <button type="button" onClick={() => { setOpenMenuFor(null); onEdit && onEdit(p); }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">Edit</button>
                      <button type="button" onClick={() => { setOpenMenuFor(null); onDelete && onDelete(p); }} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50">Delete</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
      {/* Never show empty state in demo mode */}
    </div>
  );
}


