## Student Management System – Realtime Chat and Announcements Manual

### Overview
- **Chat (MongoDB + SSE)**: Two-way chat with timestamps (Bangladesh time) and typing indicator. UI at `/v3`. APIs under `/api/v3/*`.
- **Announcements (MongoDB + SSE)**: Publish announcements with live updates, optional comments, single‑indent replies, and reactions. UI at `/v4/announcements`. APIs under `/api/v4/*`.

These modules are self‑contained and use Server‑Sent Events (SSE) for realtime updates.

### Prerequisites
- Node.js 18+ and npm.
- A reachable MongoDB connection string in your environment: `MONGODB_URI`.
- Install deps and run dev server:
```bash
npm install
npm run dev
# or specify port
npm run dev -- -p 3010
```

### Environment
- Create `.env.local` with:
```bash
MONGODB_URI="<your mongodb uri>"
```
- Restart dev server after changing env files.

---

## Chat (MongoDB-backed)

### UI (two-pane demo)
1) Open `/v3` (e.g., `http://localhost:3010/v3`).
2) Set a `Channel` key (default `v3:general`).
3) Pane A uses `user-a`, Pane B uses `user-b` by default. Change IDs if you want.
4) Type in Pane A — Pane B header shows “user-a is typing…”, and vice versa.
5) Press Enter or click Send to post; both panes receive messages in realtime.
6) Timestamps show in Asia/Dhaka timezone.

### APIs
- List recent messages
```bash
curl "http://localhost:3010/api/v3/messages?channel=v3:general"
# => { messages: [ { _id, channelKey, sender, text, createdAt, ... }, ... ] }
```

- Send a message
```bash
curl -X POST "http://localhost:3010/api/v3/messages" \
  -H "content-type: application/json" \
  -d '{"channelKey":"v3:general","sender":"user-a","text":"Hello from user-a"}'
```

- Realtime stream (SSE)
```bash
curl -N -H "Accept: text/event-stream" \
  "http://localhost:3010/api/v3/stream?channel=v3:general"
# emits lines like:
# event: message
# data: {"_id":"...","sender":"user-a","text":"Hello","createdAt":"..."}
```

- Typing indicator
  - Update typing state
  ```bash
  curl -X POST "http://localhost:3010/api/v3/typing" \
    -H "content-type: application/json" \
    -d '{"channelKey":"v3:general","user":"user-a","typing":true}'
  ```
  - Subscribe to typing stream (SSE)
  ```bash
  curl -N -H "Accept: text/event-stream" \
    "http://localhost:3010/api/v3/typing/stream?channel=v3:general"
  # emits event: typing (and default message events) with payload { user, typing, ts }
  ```

### Data Model (v3)
- `Message`: `{ channelKey: string, sender: string, text: string, attachments?: string[], reactions?: { user, type }[], createdAt, updatedAt }`
- Additional v3 models available (channels, announcements, comments) are not used by the v3 UI, which focuses on chat messages.

### Code logic – server (Chat)
Minimal excerpts of the core handlers (see files in `src/app/api/v3/*` for full code):

```ts
// src/app/api/v3/messages/route.ts
export async function POST(req: NextRequest) {
  await connectMongo();
  const body = await req.json().catch(() => ({}));
  const { channelKey = 'v3:general', sender = 'user', text = '' } = body;
  const message = await MessageModel.create({ channelKey, sender, text });
  return new Response(JSON.stringify({ message }), { status: 200, headers: { 'content-type': 'application/json' } });
}
```

```ts
// src/app/api/v3/stream/route.ts
export async function GET(req: NextRequest) {
  await connectMongo();
  const url = new URL(req.url);
  const channelKey = url.searchParams.get('channel') || 'v3:general';
  let lastId: string | null = null;
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (event: string, payload: unknown) => {
        try {
          controller.enqueue(enc.encode(`event: ${event}\n`));
          controller.enqueue(enc.encode(`data: ${JSON.stringify(payload)}\n\n`));
        } catch {}
      };
      const initial = await MessageModel.find({ channelKey }).sort({ createdAt: -1 }).limit(50).lean();
      initial.reverse().forEach((m) => send('message', m));
      lastId = initial.length ? String(initial[initial.length - 1]._id) : null;
      let closed = false;
      const timer = setInterval(async () => {
        if (closed) return;
        try {
          const query = lastId ? { channelKey, _id: { $gt: lastId } as any } : { channelKey };
          const newer = await MessageModel.find(query).sort({ _id: 1 }).lean();
          for (const m of newer) {
            if (closed) break;
            send('message', m);
            lastId = String(m._id);
          }
          if (!closed) controller.enqueue(enc.encode(`: ping\n\n`));
        } catch {}
      }, 1500);
      (req as any).signal?.addEventListener?.('abort', () => { clearInterval(timer); try { controller.close(); } catch {} });
    },
  });
  return new Response(stream, { status: 200, headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-cache, no-transform', connection: 'keep-alive' } });
}
```

```ts
// src/app/api/v3/typing/route.ts
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { channelKey = 'v3:general', user = 'user', typing = false } = body;
  typingBus.emit({ channelKey, user, typing, ts: Date.now() });
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } });
}
```

```ts
// src/app/api/v3/typing/stream/route.ts
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const channelKey = url.searchParams.get('channel') || 'v3:general';
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const enc = new TextEncoder();
      const send = (ev: TypingEvent) => {
        try {
          controller.enqueue(enc.encode(`event: typing\n`));
          controller.enqueue(enc.encode(`data: ${JSON.stringify(ev)}\n\n`));
          controller.enqueue(enc.encode(`data: ${JSON.stringify(ev)}\n\n`)); // default event
        } catch {}
      };
      const unsubscribe = typingBus.subscribe(channelKey, send);
      const ping = setInterval(() => { try { controller.enqueue(enc.encode(`: ping\n\n`)); } catch {} }, 15000);
      (req as any).signal?.addEventListener?.('abort', () => { clearInterval(ping); try { unsubscribe(); controller.close(); } catch {} });
    }
  });
  return new Response(stream, { status: 200, headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-cache, no-transform', connection: 'keep-alive' } });
}
```

### Code logic – client (Chat)
Core hooks used by `/v3` page:

```tsx
// useSSE hook and typing subscription (src/app/v3/page.tsx excerpts)
function useSSE(channel: string) {
  const [messages, setMessages] = useState<any[]>([]);
  useEffect(() => {
    const es = new EventSource(`/api/v3/stream?channel=${encodeURIComponent(channel)}`);
    const onMsg = (e: MessageEvent) => {
      try { setMessages((prev) => [...prev, JSON.parse(e.data)].slice(-200)); } catch {}
    };
    es.addEventListener('message', onMsg);
    return () => { es.removeEventListener('message', onMsg); es.close(); };
  }, [channel]);
  return messages;
}

useEffect(() => {
  const es = new EventSource(`/api/v3/typing/stream?channel=${encodeURIComponent(channel)}`);
  const onTyping = (e: MessageEvent) => {
    try {
      const ev = JSON.parse(e.data) as { user: string; typing: boolean };
      setTyping((prev) => ({ ...prev, [ev.user]: ev.typing }));
    } catch {}
  };
  es.addEventListener('typing', onTyping);
  es.addEventListener('message', onTyping);
  return () => { es.removeEventListener('typing', onTyping); es.removeEventListener('message', onTyping); es.close(); };
}, [channel]);
```

```tsx
// Send helper and BD time formatting (src/app/v3/page.tsx excerpts)
async function send(sender: string, text: string, clear: (s: string) => void) {
  if (!text.trim()) return;
  await fetch('/api/v3/messages', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ channelKey: channel, sender, text }) });
  clear('');
  void fetch('/api/v3/typing', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ channelKey: channel, user: sender, typing: false }) });
}

function formatTime(input: any): string {
  try { const d = new Date(input); if (!isNaN(d.getTime())) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Dhaka' }); } catch {}
  return '';
}
```

### UI samples (v3) – debounced typing input
Add a small debounce so typing clears automatically after 2s of inactivity:

```tsx
// inside component
const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

function onChangeWithTypingA(e: React.ChangeEvent<HTMLInputElement>) {
  const value = e.target.value;
  setTextA(value);
  void fetch('/api/v3/typing', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ channelKey: channel, user: clientA, typing: true }) });
  if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
  typingTimerRef.current = setTimeout(() => {
    void fetch('/api/v3/typing', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ channelKey: channel, user: clientA, typing: false }) });
  }, 2000);
}

// usage in input
// <input value={textA} onChange={onChangeWithTypingA} onBlur={() => void fetch('/api/v3/typing', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ channelKey: channel, user: clientA, typing: false }) })} />
```

---

## Announcements (MongoDB-backed)

### UI
1) Open `/v4/announcements` (e.g., `http://localhost:3010/v4/announcements`).
2) Choose a `Channel` (default `v4:general`).
3) Enter `Title`, `Body`, and `Author`. Set the `Comments` field to the identifier you want to use when commenting/reacting, then Publish.
4) New announcements appear live via SSE, newest first (card list shows BD time). The comments count shown on each card is computed from the database and will be 0 when there are no comments.
5) Replies are displayed as a single‑indent flat thread under each top‑level comment. Nested reply toggles are removed; all descendants are shown in the same indented list.

### APIs
- List announcements (includes accurate `commentsCount`)
```bash
curl "http://localhost:3010/api/v4/announcements?channel=v4:general"
# => { announcements: [ { _id, channelKey, title, body, author, commentsCount, createdAt, ... }, ... ] }
```

- Publish announcement
```bash
curl -X POST "http://localhost:3010/api/v4/announcements" \
  -H "content-type: application/json" \
  -d '{"channelKey":"v4:general","title":"Exam Notice","body":"Exam on 10th","author":"admin"}'
```

- Realtime stream (SSE) – emits announcements with accurate `commentsCount`
```bash
curl -N -H "Accept: text/event-stream" \
  "http://localhost:3010/api/v4/stream?channel=v4:general"
# emits event: announcement with the created item
```

- Add a top‑level comment to an announcement
```bash
curl -X PUT "http://localhost:3010/api/v4/announcements" \
  -H "content-type: application/json" \
  -d '{"announcementId":"<id>","comment":{"author":"user-a","text":"Great!"}}'
```

- Reply to a comment (nested reply). Use `parentId` to link to the comment you are replying to
```bash
curl -X POST "http://localhost:3010/api/v4/comments" \
  -H "content-type: application/json" \
  -d '{"announcementId":"<id>","parentId":"<commentId>","author":"user-a","text":"Replying..."}'
```

- List comments for an announcement (optionally by parent)
```bash
curl "http://localhost:3010/api/v4/comments?announcementId=<id>"
# => { comments: [ { _id, announcementId, parentId: null, author, text, repliesCount, createdAt, ... }, ... ] }

# list replies for a specific parent comment
curl "http://localhost:3010/api/v4/comments?announcementId=<id>&parentId=<commentId>"
# => { comments: [ { _id, announcementId, parentId: <commentId>, author, text, repliesCount, createdAt, ... }, ... ] }
```

- React to an announcement or comment
```bash
curl -X POST "http://localhost:3010/api/v4/reactions" \
  -H "content-type: application/json" \
  -d '{"targetType":"announcement","id":"<id>","user":"user-a","type":"like"}'
```

### Data Model (v4)
- `Announcement`: `{ channelKey, title, body, author, reactions?: { user, type }[], commentsCount: number, createdAt, updatedAt }`
- `Comment`: `{ announcementId, parentId?: ObjectId | null, author, text, reactions?: { user, type }[], repliesCount: number, createdAt, updatedAt }`

### Code logic – server (Announcements)
Core handlers (see `src/app/api/v4/*`):

```ts
// src/app/api/v4/announcements/route.ts (POST)
export async function POST(req: NextRequest) {
  await connectMongo();
  const body = await req.json().catch(() => ({}));
  const { channelKey = 'v4:general', title = '', body: text = '', author = 'system' } = body;
  const a = await V4AnnouncementModel.create({ channelKey, title, body: text, author });
  return new Response(JSON.stringify({ announcement: a }), { status: 200, headers: { 'content-type': 'application/json' } });
}
```

```ts
// src/app/api/v4/stream/route.ts
export async function GET(req: NextRequest) {
  await connectMongo();
  const url = new URL(req.url);
  const channelKey = url.searchParams.get('channel') || 'v4:general';
  let lastAnnouncementId: string | null = null;
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (event: string, payload: unknown) => {
        try { controller.enqueue(enc.encode(`event: ${event}\n`)); controller.enqueue(enc.encode(`data: ${JSON.stringify(payload)}\n\n`)); } catch {}
      };
      // The stream populates `commentsCount` using an aggregation of top‑level comments
      const initial = await V4AnnouncementModel.find({ channelKey }).sort({ createdAt: -1 }).limit(50).lean();
      // ... aggregation omitted for brevity in docs ...
      initial.reverse().forEach((a) => send('announcement', a));
      lastAnnouncementId = initial.length ? String(initial[initial.length - 1]._id) : null;
      let closed = false;
      const timer = setInterval(async () => {
        if (closed) return;
        try {
          const newer = await V4AnnouncementModel.find(lastAnnouncementId ? { channelKey, _id: { $gt: lastAnnouncementId } as any } : { channelKey }).sort({ _id: 1 }).lean();
          // ... aggregation to attach accurate commentsCount ...
          for (const a of newer) { if (closed) break; send('announcement', a); lastAnnouncementId = String(a._id); }
          if (!closed) controller.enqueue(enc.encode(`: ping\n\n`));
        } catch {}
      }, 2000);
      (req as any).signal?.addEventListener?.('abort', () => { closed = true; clearInterval(timer); try { controller.close(); } catch {} });
    },
  });
  return new Response(stream, { status: 200, headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-cache, no-transform', connection: 'keep-alive' } });
}
```

```ts
// src/app/api/v4/comments/route.ts (GET list by announcementId)
export async function GET(req: NextRequest) {
  await connectMongo();
  const url = new URL(req.url);
  const announcementId = url.searchParams.get('announcementId');
  if (!announcementId) return new Response(JSON.stringify({ comments: [] }), { status: 200, headers: { 'content-type': 'application/json' } });
  const docs = await V4CommentModel.find({ announcementId }).sort({ createdAt: 1 }).limit(200).lean();
  return new Response(JSON.stringify({ comments: docs }), { status: 200, headers: { 'content-type': 'application/json' } });
}
```

```ts
// src/app/api/v4/reactions/route.ts (react to announcement/comment)
export async function POST(req: NextRequest) {
  await connectMongo();
  const body = await req.json().catch(() => ({}));
  const { targetType, id, user, type } = body as { targetType: 'announcement' | 'comment'; id: string; user: string; type: string };
  if (!targetType || !id || !user || !type) return new Response(JSON.stringify({ error: 'missing fields' }), { status: 400 });
  const update = { $addToSet: { reactions: { user, type } } };
  const model = targetType === 'announcement' ? V4AnnouncementModel : V4CommentModel;
  await model.findByIdAndUpdate(id, update);
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } });
}
```

### Code logic – client (Announcements)
Key parts from `/v4/announcements` page:

```tsx
// Subscribe to updates and publish (src/app/v4/announcements/page.tsx excerpts)
useEffect(() => {
  const es = new EventSource(`/api/v4/stream?channel=${encodeURIComponent(channel)}`);
  const onAnn = (e: MessageEvent) => {
    try { setList((prev) => [...prev, JSON.parse(e.data)].slice(-200)); } catch {}
  };
  es.addEventListener('announcement', onAnn);
  return () => { es.removeEventListener('announcement', onAnn); es.close(); };
}, [channel]);

async function publish() {
  if (!title.trim() || !body.trim()) return;
  await fetch('/api/v4/announcements', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ channelKey: channel, title, body, author }) });
  setTitle(''); setBody('');
}
```

### UI samples (v4) – comment and reaction actions
Client-side helpers to add a comment and react to an item:

```ts
async function addComment(announcementId: string, author: string, text: string) {
  await fetch('/api/v4/announcements', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ announcementId, comment: { author, text } })
  });
}

async function reactTo(targetType: 'announcement' | 'comment', id: string, user: string, type: string) {
  await fetch('/api/v4/reactions', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ targetType, id, user, type })
  });
}
```

---

## Notes & Troubleshooting
- **SSE connections**: If a tab sleeps or network drops, refresh the page to reconnect. The APIs send periodic `: ping` comments to keep connections alive.
- **“Controller is already closed”**: This can appear when a client disconnects; it’s handled internally. Just reload the UI if you stop receiving events.
- **MongoDB access**: Ensure your `MONGODB_URI` is correct and your IP/allowlist/network access permits connections.
- **Auth & security**: These demos do not implement authentication/authorization. Do not expose them to the internet without adding proper security.
- **Timezone**: UI timestamps use `Asia/Dhaka`.

---

## Quick Links
- Messaging UI: `/v3`
- Announcements UI: `/v4/announcements`
- Messages API: `/api/v3/messages`, SSE `/api/v3/stream`
- Typing API: `/api/v3/typing`, SSE `/api/v3/typing/stream`
- Announcements API: `/api/v4/announcements`, SSE `/api/v4/stream`
- Comments API: `/api/v4/comments`
- Reactions API: `/api/v4/reactions`




---

## RBAC & Visibility

Roles: `admin`, `manager`, `sre`, `mentor`, `student`.

- Mentor Messaging: non‑students only (students cannot view or post).
- Announcements (mission-wide): created by non‑students; all can read; students can comment and react; moderator replies highlighted with role badges.
- Resources: created by non‑students (staff + mentors); all can read; mission‑wide visibility (use course tags for filtering only).
- Guideline/Coding: students create; non‑student moderators (and the author) can reply; status changes controlled by mentors/non‑student moderators; default status `pending`.
- Group Discussion/Announcements: visible to group members and non‑student moderators only (strict, no cross‑group access by URL).

---

## Data Models & Collections (MongoDB)

These collections back the messaging and announcements features and align with the SSE endpoints above. Model names are simple (no "v2" suffix).

- Channel: `{ missionId, groupId?, type: 'mentor-messaging'|'group-discussion', visibility: 'non-student'|'group', allowedRoles: string[], lastMessageAt?, createdBy, createdAt, updatedAt }`
- Message: `{ channelId, senderId, body(markdown), attachments?: [{url,name,type,size}], mentions?: [userId], reactions?: [{reaction:'ok'|'love'|'cry'|'haha'|'bulb', userId, createdAt}], threadId?, readReceipts?: [{userId, readAt}], createdAt, editedAt?, deletedAt? }`
- Post: `{ missionId, groupId?, category:'announcement'|'resource'|'guideline'|'coding', announcementType?, title, body(markdown), attachments?: [{url,name,type,size}], tags?: string[], status:'pending'|'approved'|'resolved'|'rejected', pinned?:boolean, visibility:'mission'|'group', createdBy, createdAt, updatedAt }`
- Comment: `{ postId, authorId, body(markdown), attachments?, reactions?, createdAt, editedAt?, deletedAt? }`
- ModerationLog (centralized): `{ targetType:'post'|'comment', targetId, action:'status.change'|'post.pin'|'post.unpin', data, actorId, createdAt }` with indexes `(targetId, createdAt)`
- Template (email templates): `{ key, scope:'mission'|'group'|'global', subject, body(markdown), variables:string[], version, isDefault, createdBy, createdAt, updatedAt }`

Reactions set (fixed): `ok`, `love`, `cry`, `haha`, `bulb`.

Attachments policy: images only (Cloudinary URLs); no in‑app file uploads required.

---

## Email & Notifications

- Mission and group announcements trigger in‑app notifications and email fan‑out to relevant students.
- Email templates are resolved by key and scope (mission → group → global → default).
- Unsubscribe/opt‑out via signed token links; honor `EMAIL_UNSUBSCRIBE_SECRET`.

Template APIs
- `GET/POST /api/v2/templates?scope=&key=`
- `GET/PATCH /api/v2/templates/:id` (edit, set default)
- `POST /api/v2/templates/:id/preview` (optional)

Announcements/Posts APIs
- `GET/POST /api/v2/posts`
- `GET/PATCH/DELETE/PUT(status) /api/v2/posts/:id` (writes `ModerationLog` on status change)
- `GET/POST /api/v2/posts/:id/comments`

---

## Environment Variables (no Ably)

Core
- `MONGODB_URI`
- `APP_BASE_URL`

Cloudinary (images only)
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Email (SMTP example)
- `EMAIL_PROVIDER=smtp`
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_APP_PASSWORD`
- `EMAIL_FROM`, `EMAIL_FROM_NAME`
- `EMAIL_UNSUBSCRIBE_SECRET` (random hex string)

Feature toggles
- `NOTIFICATION_EMAIL_ENABLED=true`

---

## Implementation Checklist (SSE‑first)

Foundations
- [ ] RBAC guards for student/non‑student and group membership
- [ ] Sidebar entries under Mission Hub and Group

APIs
- [ ] Chat SSE: `/api/v3/stream`, `/api/v3/messages`, typing endpoints
- [ ] Announcements SSE: `/api/v4/stream`, `/api/v4/announcements`, `/api/v4/comments`, `/api/v4/reactions`
- [ ] Posts/Comments REST (mission/group scoped): `/api/v2/posts*` and `ModerationLog`
- [ ] Templates REST: `/api/v2/templates*`

UI
- [ ] `/v3` chat two‑pane demo (typing, BD timezone)
- [ ] `/v4/announcements` list + publish + comments + reactions
- [ ] Mission Hub pages: Mentor Messaging, Announcements, Resources, Guideline, Coding (markdown input with emoji shortcodes)
- [ ] Group pages: Discussion and Announcements

Safety & Perf
- [ ] Rate limits on message/post/comment/reaction
- [ ] Markdown sanitization; no raw HTML
- [ ] Cursor pagination; SSE keep‑alive pings

Testing
- [ ] Unit (RBAC, validators, status transitions)
- [ ] Integration (publish → SSE stream → email)
- [ ] Performance (pagination & fan‑out)

---

## Manual Integration Guide (no third‑party realtime)

This section shows the simplest way to wire the current REST/SSE endpoints into your pages without any external realtime vendor. It uses:
- REST for create/list
- SSE for streaming lists (where available) or lightweight polling as a fallback

### Manual Chat Integration (Channels/Messages)

1) Create or find a channel (mentor or group):
```ts
// list channels
await fetch(`/api/v2/channels?missionId=<mid>&type=mentor-messaging`);

// create channel (non‑student only)
await fetch('/api/v2/channels', {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ missionId: '<mid>', type: 'mentor-messaging', visibility: 'non-student' })
});
```

2) Post a message (client uploads images to Cloudinary first; send URLs only):
```ts
await fetch(`/api/v2/channels/<channelId>/messages`, {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ body: 'Hello', attachments: [{ url: 'https://res.cloudinary.com/<cloud>/image/upload/...jpg', name: 'img', type: 'image/jpeg' }] })
});
```

3) Read messages with cursor paging (poll every 2–4s if you need live feel):
```ts
const res = await fetch(`/api/v2/channels/<channelId>/messages?limit=30&cursor=${encodeURIComponent(lastId||'')}`);
const { data, nextCursor } = await res.json();
```

Tip: For strict mentor chat, students will be blocked by the API. Ensure role-aware UI controls.

### Manual Announcements Integration (Posts/Comments)

1) Publish announcement (non‑student):
```ts
await fetch('/api/v2/posts', {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ missionId: '<mid>', category: 'announcement', announcementType: 'general', title: 'Exam Notice', body: 'Exam on 10th' })
});
```

2) List announcements:
```ts
const res = await fetch(`/api/v2/posts?missionId=<mid>&category=announcement&limit=20`);
const { data, nextCursor } = await res.json();
```

3) Comment on an announcement:
```ts
await fetch(`/api/v2/posts/<postId>/comments`, {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ body: 'Great!', attachments: [] })
});
```

4) Change status with moderation log (mentors/non‑student moderators only):
```ts
await fetch(`/api/v2/posts/<postId>`, {
  method: 'PUT', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ status: 'approved', reason: 'Reviewed' })
});
```

### Lightweight Polling Helper
```ts
function usePolling<T>(url: string, ms = 3000) {
  const [data, setData] = useState<T | null>(null);
  useEffect(() => {
    let id: any; let cancelled = false;
    const tick = async () => {
      try { const r = await fetch(url, { cache: 'no-store' }); const j = await r.json(); if (!cancelled) setData(j); }
      catch {}
      if (!cancelled) id = setTimeout(tick, ms);
    };
    tick();
    return () => { cancelled = true; clearTimeout(id); };
  }, [url, ms]);
  return data;
}
```

Attach this to either `/api/v2/channels/<id>/messages` or `/api/v2/posts?...` until SSE pages are wired.