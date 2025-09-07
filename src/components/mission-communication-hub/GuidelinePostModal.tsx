"use client";

import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/Modal";
import StatusBadge from "@/components/StatusBadge";
import MarkdownViewer from "@/components/mission-communication-hub/MarkdownViewer";
import { useAuth } from "@/context/AuthContext";

interface GuidelinePostModalProps {
  postId: string | null;
  onClose: () => void;
}

export default function GuidelinePostModal({ postId, onClose }: GuidelinePostModalProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(!!postId);
  const [post, setPost] = useState<any | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [text, setText] = useState("");

  useEffect(() => setOpen(!!postId), [postId]);

  const canModerate = useMemo(() => {
    const role = String(user?.role || '').toLowerCase();
    return ["admin", "superadmin", "sre", "mentor"].includes(role);
  }, [user]);

  useEffect(() => {
    if (!postId) return;
    // Static: load demo content only
    setPost({ _id: postId, title: "Demo Post", body: demoBody, status: "pending", createdAt: new Date().toISOString(), attachments: demoAttachments });
    setComments(demoComments(postId));
  }, [postId]);

  async function submit(parentId?: string | null) {
    if (!postId || !text.trim()) return;
    setComments(prev => [{ _id: `demo-${Date.now()}`, postId, parentId: parentId || null, authorId: 'me', body: text, createdAt: new Date().toISOString() }, ...prev]);
    setText("");
  }

  async function changeStatus(status: 'pending'|'investigating'|'resolved'|'approved'|'rejected') {
    if (!postId || !canModerate) return;
    if (post) setPost({ ...post, status });
  }

  return (
    <Modal isOpen={open} onClose={onClose} size="xl" title={post?.title || "Post"}>
      <div className="space-y-4">
        {/* Header actions */}
        <div className="flex items-center justify-between">
          <StatusBadge status={post?.status || 'pending'} size="sm" />
          {canModerate && (
            <select className="border rounded text-sm px-2 py-1" value={post?.status || 'pending'} onChange={(e) => changeStatus(e.target.value as any)}>
              <option value="pending">Pending</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          )}
        </div>

        {/* Body with markdown and images */}
        <div className="prose max-w-none">
          <MarkdownViewer text={post?.body} />
        </div>

        {/* Attachments preview */}
        {Array.isArray(post?.attachments) && post.attachments.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {post.attachments.map((a: any, i: number) => (
              <a key={i} href={a.url} target="_blank" rel="noreferrer" className="block">
                <img src={a.url} alt={a.name || `image-${i}`} className="w-full h-32 object-cover rounded" />
              </a>
            ))}
          </div>
        )}

        {/* New comment */}
        <div className="bg-gray-50 border rounded p-3">
          <textarea className="w-full border rounded p-2 text-sm" rows={4} placeholder="Write a comment... Use Markdown and ``` for code blocks." value={text} onChange={(e) => setText(e.target.value)} />
          <div className="mt-2 flex items-center gap-2">
            <button onClick={() => submit(null)} disabled={!text.trim()} className="px-3 py-1.5 text-sm rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50">Comment</button>
          </div>
        </div>

        {/* Comments */}
        <div className="space-y-3">
          {comments.map(c => (
            <CommentItem key={c._id} comment={c} />
          ))}
          {comments.length === 0 && <div className="text-sm text-gray-500">No comments yet.</div>}
        </div>
      </div>
    </Modal>
  );
}

function CommentItem({ comment }: { comment: any }) {
  const [replies, setReplies] = useState<any[] | null>(null);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadReplies() {
    if (replies !== null) { setReplies(null); return; }
    setLoading(true);
    setTimeout(() => {
      setReplies(demoReplies(comment.postId, comment._id));
      setLoading(false);
    }, 150);
  }

  async function submitReply() {
    if (!replyText.trim()) return;
    setLoading(true);
    setReplies(prev => ([{ _id: `demo-r-${Date.now()}`, postId: comment.postId, parentId: comment._id, body: replyText, createdAt: new Date().toISOString() }, ...(prev || [])]));
    setReplyText("");
    setLoading(false);
  }

  return (
    <div className="bg-white border rounded p-3">
      <div className="text-sm"><MarkdownViewer text={comment.body} /></div>
      <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
        <button onClick={loadReplies} className="underline">{replies === null ? 'View replies' : 'Hide replies'}</button>
      </div>
      {replies !== null && (
        <div className="mt-2 pl-4 border-l space-y-2">
          {loading ? <div className="text-xs text-gray-500">Loading...</div> : (
            replies.length === 0 ? <div className="text-xs text-gray-500">No replies</div> : (
              replies.map(r => (
                <div key={r._id} className="text-sm"><MarkdownViewer text={r.body} /></div>
              ))
            )
          )}
          <div className="bg-gray-50 border rounded p-2">
            <textarea className="w-full border rounded p-2 text-sm" rows={2} placeholder="Reply..." value={replyText} onChange={(e) => setReplyText(e.target.value)} />
            <div className="mt-2 flex items-center gap-2">
              <button onClick={submitReply} disabled={loading || !replyText.trim()} className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50">Reply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const demoBody = `Here is a sample post with images and code.

You can paste images as markdown:
![ui](https://placehold.co/600x300)
![chart](https://placehold.co/300x160)

Discord-like markdown works, including code blocks:
\`inline code\`, **bold**, *italic*, __underline__, ~~strike~~, > quote

\n\n\`\`\`
function greet(name) {
  console.log('Hello', name);
}
\`\`\`
`;

const demoAttachments = [
  { url: 'https://placehold.co/600x300', name: 'ui.png', type: 'image/png' },
  { url: 'https://placehold.co/300x160', name: 'chart.png', type: 'image/png' },
];

function demoComments(postId: string) {
  return [
    { _id: 'd-c1', postId, parentId: null, authorId: 'u1', body: 'First comment with `inline code`', createdAt: new Date().toISOString() },
    { _id: 'd-c2', postId, parentId: null, authorId: 'u2', body: 'Second comment\n\n```\nconst x = 1;\n```', createdAt: new Date().toISOString() },
  ];
}

function demoReplies(postId: string, parentId: string) {
  return [
    { _id: 'd-r1', postId, parentId, authorId: 'u3', body: 'Reply A', createdAt: new Date().toISOString() },
    { _id: 'd-r2', postId, parentId, authorId: 'u4', body: 'Reply B with image ![a](https://placehold.co/100x60)', createdAt: new Date().toISOString() },
  ];
}


