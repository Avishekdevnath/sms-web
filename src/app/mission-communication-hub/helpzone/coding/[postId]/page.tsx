"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import MarkdownViewer from "@/components/mission-communication-hub/MarkdownViewer";

export default function CodingPostDetailPage() {
  const params = useParams();
  const postId = String(params?.postId || "");

  const [post, setPost] = useState<any>({
    _id: postId,
    title: "Demo post: Fixing a Next.js fetch caching bug",
    body: demoBody,
    status: "pending",
    createdAt: new Date().toISOString(),
  });
  const [comments, setComments] = useState<any[]>(demoComments(postId));
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);

  function submitComment(parentId?: string | null) {
    if (!newComment.trim()) return;
    setComments(prev => ([{ _id: `c-${Date.now()}`, postId, parentId: parentId || null, authorId: 'me', body: newComment, createdAt: new Date().toISOString() }, ...prev]));
    setNewComment("");
    setReplyTo(null);
  }

  function changeStatus(status: 'pending'|'investigating'|'resolved'|'approved'|'rejected') {
    setPost((p: any) => ({ ...p, status }));
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/mission-communication-hub/helpzone/coding"
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4 text-gray-600" />
          Back to coding
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded p-4">
        <div className="flex items-start justify-between">
          <div className="prose max-w-none">
            <h2 className="text-xl font-semibold">{post.title}</h2>
            <div className="mt-2"><MarkdownViewer text={post.body} /></div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={post.status} size="sm" />
            <div className="relative">
              <select
                className="border rounded text-sm px-2 py-1"
                value={post.status}
                onChange={(e) => changeStatus(e.target.value as any)}
              >
                <option value="pending">Pending</option>
                <option value="investigating">Investigating</option>
                <option value="resolved">Resolved</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Comments</h3>

        <div className="bg-white border rounded p-3">
          <textarea
            className="w-full border rounded p-2 text-sm"
            rows={3}
            placeholder="Write a comment…"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <div className="mt-2 flex items-center gap-2">
            {replyTo && <div className="text-xs text-gray-500">Replying… <button onClick={() => setReplyTo(null)} className="underline">Cancel</button></div>}
            <button onClick={() => submitComment(replyTo)} className="px-3 py-1.5 text-sm rounded border border-gray-300 hover:bg-gray-50">Post Comment</button>
          </div>
        </div>

        <CommentFeed comments={comments} onReply={(id) => setReplyTo(id)} />
      </div>
    </div>
  );
}

function CommentItem({ comment, onReply, postId, comments }: { comment: any; onReply: (id: string) => void; postId: string; comments: any[] }) {
  const replies = comments.filter(c => c.parentId === comment._id);
  return (
    <div className="bg-white border rounded p-3">
      <div className="text-sm"><MarkdownViewer text={comment.body} /></div>
      <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
        <button onClick={() => onReply(comment._id)} className="underline">Reply</button>
      </div>
      {replies.length > 0 && (
        <div className="mt-2 pl-4 border-l space-y-2">
          {replies.map(r => (
            <div key={r._id} className="text-sm"><MarkdownViewer text={r.body} /></div>
          ))}
        </div>
      )}
    </div>
  );
}

function CommentFeed({ comments, onReply }: { comments: any[]; onReply: (id: string) => void }) {
  const byId = new Map<string, any>(comments.map(c => [c._id, c]));
  const sorted = [...comments].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  return (
    <div className="space-y-2">
      {sorted.map(c => {
        const parent = c.parentId ? byId.get(c.parentId) : null;
        return (
          <div key={c._id} className="bg-white border rounded p-3">
            {parent && (
              <div className="mb-2 text-xs text-gray-500 border-l-2 border-gray-300 pl-2">
                Replying to: <span className="italic">{truncateInline(parent.body)}</span>
              </div>
            )}
            <div className="text-sm"><MarkdownViewer text={c.body} /></div>
            <div className="mt-2">
              <button onClick={() => onReply(c._id)} className="text-xs underline text-gray-600">Reply</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function truncateInline(src: string) {
  const oneLine = src.replace(/\s+/g, ' ').trim();
  return oneLine.length > 80 ? oneLine.slice(0, 77) + '…' : oneLine;
}

const demoBody = `This is a coding post with code and images.

Use Markdown like **bold**, *italic*, and code blocks:

\n\n\`\`\`
export async function getData(id) {
  const res = await fetch('/api/demo?id=' + id, { cache: 'no-store' });
  if (!res.ok) throw new Error('Request failed');
  return res.json();
}
\`\`\`

Images:
![ui](https://placehold.co/600x300)
`;

function demoComments(postId: string) {
  return [
    { _id: 'c1', postId, parentId: null, authorId: 'u1', body: 'First comment with `inline` code', createdAt: new Date().toISOString() },
    { _id: 'c2', postId, parentId: null, authorId: 'u2', body: 'Another comment', createdAt: new Date().toISOString() },
    { _id: 'r1', postId, parentId: 'c1', authorId: 'u3', body: 'Reply to first comment', createdAt: new Date().toISOString() },
  ];
}


