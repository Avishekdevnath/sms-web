"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import PostList from "@/components/mission-communication-hub/PostList";
import GuidelinePostModal from "@/components/mission-communication-hub/GuidelinePostModal";

export default function HelpCodingPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const [openPostId, setOpenPostId] = useState<string | null>(null);

  const posts = [
    { _id: "hc1", title: "Debugging async/await", category: "coding" as const, status: "pending" as const, createdAt: new Date().toISOString() },
    { _id: "hc2", title: "TypeScript: narrowing union types", category: "coding" as const, status: "resolved" as const, createdAt: new Date(Date.now() - 3600_000).toISOString() },
    { _id: "hc3", title: "Next.js: fetch caching pitfalls", category: "coding" as const, status: "investigating" as const, createdAt: new Date(Date.now() - 7200_000).toISOString() },
  ];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posts.filter(p => {
      const matchesQuery = q === "" || p.title.toLowerCase().includes(q);
      const matchesStatus = status === "" || p.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [posts, search, status]);
  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/mission-communication-hub"
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4 text-gray-600" />
          Back to hub
        </Link>
      </div>
      <div className="bg-white border border-gray-200 rounded p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Helpzone • Coding</h2>
            <p className="text-sm text-gray-600 mt-1">Ask coding questions, share fixes, and track resolutions.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-4 w-4 text-gray-500 absolute left-2 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search posts"
                className="pl-7 pr-3 py-1.5 text-sm border rounded w-56"
              />
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="text-sm border rounded px-2 py-1.5"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      <PostList
        posts={filtered}
        makeLink={(p) => `/mission-communication-hub/helpzone/coding/${p._id}`}
      />
    </div>
  );
}


