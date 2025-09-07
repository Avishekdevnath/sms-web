"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSelectedMission } from "@/hooks/useSelectedMission";

export default function NewGuidelinePostPage() {
  const router = useRouter();
  const { getSelectedMissionId, hasSelectedMission } = useSelectedMission();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const missionId = getSelectedMissionId();

  async function submit() {
    if (!missionId || !title.trim() || !body.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/v2/posts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ missionId, category: 'guideline', title, body })
      });
      const data = await res.json();
      if (res.ok && data?.data?._id) {
        router.push(`/mission-communication-hub/helpzone/guideline/${data.data._id}`);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!hasSelectedMission) {
    return <div className="text-sm text-gray-500">Select a mission from the sidebar to create a post.</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">New Guideline Post</h2>
      <div className="space-y-2">
        <label className="block text-sm font-medium">Title</label>
        <input className="w-full border rounded p-2 text-sm" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium">Body</label>
        <textarea className="w-full border rounded p-2 text-sm" rows={10} value={body} onChange={(e) => setBody(e.target.value)} />
      </div>
      <div className="flex items-center gap-2">
        <button onClick={submit} disabled={submitting || !title.trim() || !body.trim()} className="px-3 py-1.5 text-sm rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50">{submitting ? 'Publishing…' : 'Publish'}</button>
      </div>
    </div>
  );
}


