"use client";

import { useMemo, useState } from "react";
import PostList from "@/components/mission-communication-hub/PostList";

export default function HelpGuidelinePage() {
  const posts = useMemo(() => ([
    { _id: "demo-g-1", title: "How to push to Git branch safely", category: "guideline", status: "pending", createdAt: new Date().toISOString() },
    { _id: "demo-g-2", title: "Investigating: Redux Toolkit query cache issue", category: "guideline", status: "investigating", createdAt: new Date(Date.now() - 3600_000).toISOString() },
    { _id: "demo-g-3", title: "Resolved: ESLint import order rules", category: "guideline", status: "resolved", createdAt: new Date(Date.now() - 7200_000).toISOString() },
  ]), []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Helpzone • Guideline</h2>
        <button type="button" className="px-3 py-1.5 text-sm rounded border border-gray-300 hover:bg-gray-50" onClick={() => setOpenPostId("demo-g-1")}>New Post</button>
      </div>
      <PostList
        posts={posts.map(p => ({ _id: p._id, title: p.title, category: p.category, status: p.status, createdAt: p.createdAt }))}
        makeLink={(p) => `/mission-communication-hub/helpzone/guideline/${p._id}`}
      />
    </div>
  );
}


