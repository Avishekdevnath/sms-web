## Messaging, Announcements, and Group Channels — Combined Execution Plan

This document consolidates the plan and reflects final decisions. New models use simple names (no "v2" suffix). APIs live under `/api/v2/*`.

---

## Overview
- Mission‑wide and group‑scoped communications with:
  - Chat messaging (mentor messaging, group discussion)
  - Structured posts (announcements, resources, guideline, coding) with comments, reactions, and moderation
- Strict RBAC by role and membership; group visibility enforced
- Full‑page screens under Mission Hub and Group layouts (no modals)

Realtime approach
- SSE for streaming lists (chat, announcements) with lightweight polling fallback where needed

---

## Data Model (Mongo) — simple names

### Channel (chat)
- _id
- missionId: ObjectId(MissionV2)
- groupId?: ObjectId(MentorshipGroupV2)
- type: 'mentor-messaging' | 'group-discussion'
- visibility: 'non-student' | 'group'
- allowedRoles: string[] // derived from type by default
- lastMessageAt: Date
- createdBy: ObjectId(User)
- createdAt, updatedAt
Indexes: (missionId, groupId, type), (lastMessageAt desc)

### Message
- _id, channelId, senderId
- body: markdown string
- attachments: [{ url, name, type, size }] // images only (Cloudinary)
- mentions: [userId]
- reactions: [{ reaction: 'ok'|'love'|'cry'|'haha'|'bulb', userId, createdAt }]
- threadId?: ObjectId(Message) // optional threads
- readReceipts: [{ userId, readAt }]
- createdAt, editedAt, deletedAt?
Indexes: (channelId, createdAt), (threadId)

### Post (structured stream)
- _id
- missionId: ObjectId(MissionV2)
- groupId?: ObjectId(MentorshipGroupV2)
- category: 'announcement' | 'resource' | 'guideline' | 'coding'
- title, body (markdown)
- attachments: [{ url, name, type, size }] // images only (Cloudinary)
- tags: string[]
- status: 'pending' | 'approved' | 'resolved' | 'rejected'  // default pending (student-authored guideline/coding); mentors/non-student moderators finalize
- visibility: 'mission' | 'group'
- announcementType?: 'general' | 'session' | 'live-session' | 'important' // when category='announcement'
- pinned?: boolean
- createdBy, createdAt, updatedAt
Indexes: (missionId, groupId, category, createdAt), (status), (createdBy)

### Comment
- _id, postId, authorId
- body, attachments[], reactions[]
- createdAt, editedAt, deletedAt?
Indexes: (postId, createdAt)

### Optional Reaction collection
- { targetType: 'message'|'comment'|'post', targetId, reaction: 'ok'|'love'|'cry'|'haha'|'bulb', userId, createdAt }

### ModerationLog (centralized)
- _id
- targetType: 'post' | 'comment'
- targetId: ObjectId
- action: 'status.change' | 'post.pin' | 'post.unpin'
- data: any // e.g., { from, to, reason? }
- actorId: ObjectId(User)
- createdAt: Date
Indexes: (targetId, createdAt)

---

## RBAC & Visibility (final)

Roles: admin, manager, sre, mentor, student

- Mentor Messaging (mission): view/post non‑student only (students cannot view)
- Announcements (mission): create non‑student; read all; students can comment and react; email notifications enabled
- Resources (mission): create non‑student (staff + mentors); read all
- Guideline/Coding (mission): students create; mentors/non‑student moderators reply and change status; default status pending; author participates but cannot finalize without privilege
- Group Announcements: mentors/staff post; group members read/comment/react
- Group Discussion: group members + non‑student moderators post/reply; strict group access (no cross‑group viewing even via direct URL)

---

## Channel Groups & Access Topology

Admin groups
- resources (admins and mentor resource sharing)
  - Type: Post category = resource
  - Scope: mission‑wide
  - Visibility: non‑student (admins + mentors)
  - Access: staff/mentors can create; students cannot view
- messaging (admins and mentor messaging)
  - Type: Chat channel = mentor‑messaging
  - Scope: mission‑wide
  - Visibility: non‑student (admins + mentors)
  - Access: staff/mentors can read/post; students cannot view

Mission groups
- announcement channel for all
  - Type: Post category = announcement (subtypes: general, session, live‑session, important)
  - Visibility: mission; Read: all; Create: non‑student; Students can comment/react
- guideline session for all
  - Type: Post category = guideline
  - Visibility: mission; Create: students; Moderate: mentors/staff
- resources for all
  - Type: Post category = resource
  - Visibility: mission; Create: non‑student; Read: all

Helpzone
- guideline zone
  - Type: Post category = guideline (focused help)
  - Visibility: mission; Create: students; Moderate: mentors/staff
- coding zone
  - Type: Post category = coding
  - Visibility: mission; Create: students; Moderate: mentors/staff

Mentorship groups (dynamically scalable per mentor)
- For each mentorship group:
  - announcement channel
    - Type: Post category = announcement
    - Visibility: group
    - Access: mentors/staff post; group students read/comment/react; non‑students (staff/mentors) can access
  - discussion channel
    - Type: Chat channel = group‑discussion
    - Visibility: group
    - Access: group students + mentors/staff can read/post; others cannot access

Examples
- mentor avishek
  - announcement channel (group announcement)
  - discussion channel (group discussion)
- mentor shifat
  - announcement channel (group announcement)
  - discussion channel (group discussion)
- mentor adil
  - announcement channel (group announcement)
  - discussion channel (group discussion)

Notes
- Only students of the specific mentorship group and all non‑students (staff/mentors) can access that mentorship group’s channels.
- Within a mentorship group: students can read/react/comment on announcements; in discussion channels, students can send messages like Discord‑style chat.

### Dynamic group scaling & auto‑channel creation
- Mentorship groups are dynamically scalable. When a new group is created, the system must automatically create:
  - A group Announcement channel (Post: category=announcement, visibility=group)
  - A group Discussion channel (Chat: type=group‑discussion, visibility=group)
- Auto‑created channels should set `allowedRoles` and `visibility` per group rules and initialize `lastMessageAt` to `null`.

### Student transfers & recovery zone
- Students can be transferred between mentorship groups. Requirements:
  - Preserve historical records: membership history and prior messages/announcements remain in their original groups; no data loss.
  - Access after transfer: student loses access to the previous group’s private discussion channels; moderation/staff retain full audit visibility.
  - Recovery Zone: SRE can move irregular students to a dedicated recovery group. Recovery group follows the same group rules (group announcement + discussion channels).
  - Reversion: Upon meeting defined requirements, SRE/Admin can transfer students back to their mentorship groups.
  - Auditability: record transfers with timestamp, fromGroupId → toGroupId, actorId, reason.
  - Counters & fast arrays must update (group student counts, mission aggregates).

### Implementation Hooks (where to implement in code)
1) Auto‑create channels on group creation
- Hook: `POST /api/v2/mentorship-groups` after group saved
- File: `src/app/api/v2/mentorship-groups/route.ts`
- Action:
  - Create Channel: `{ missionId, groupId, type: 'group-discussion', visibility: 'group', allowedRoles: ['admin','manager','sre','mentor','student'], createdBy }`
  - For group announcements, prefer Posts over chat channels: UI will show group‑scoped posts with `category=announcement` (no chat channel needed).
  - Persist and return alongside group or allow lazy fetch via `/api/v2/channels?groupId=`

2) Student transfer between groups (including Recovery Zone)
- Endpoints to add:
  - `POST /api/v2/mentorship-groups/:id/transfer-students` { studentIds[], toGroupId, reason }
  - `POST /api/v2/mentorship-groups/:id/move-to-recovery` { studentIds[], reason }
  - `POST /api/v2/mentorship-groups/:id/revert-from-recovery` { studentIds[], toGroupId?, reason }
- Actions:
  - Remove from source group, add to destination group; update counts and mission fast arrays
  - Write transfer audit `{ studentId, fromGroupId, toGroupId, actorId, reason, at }`
  - Access: after transfer, revoke prior group discussion access for student; staff retain read‑only audit visibility

- Data retention:
  - Do not migrate old messages/comments across groups. Historical content remains in original groups; visibility limited to staff/mentors per RBAC.

3) Recovery Zone group preset
- When first needed, auto‑create a dedicated group per mission: name `Recovery Zone` (groupType: mentorship, status: active)
- Ensure its announcement (Post: category=announcement, visibility=group) and discussion (Channel: group‑discussion) are available

4) Cursor and typing consistency
- Ensure `_id` cursors use `ObjectId` conversion across: `/api/v2/channels/:id/messages`, `/api/v2/posts`
- Continue using rate limiting and RBAC guards (`getAuthUserFromRequest`)


## APIs (v2)

### Channels & Messages
- GET    /api/v2/channels?missionId[&groupId]&type=
- POST   /api/v2/channels
- GET    /api/v2/channels/:id/messages?cursor=&limit=&threadId=
- POST   /api/v2/channels/:id/messages
- POST   /api/v2/messages/:id/reactions          { reaction }
- DELETE /api/v2/messages/:id/reactions?reaction=
- POST   /api/v2/messages/:id/read               // read receipts (batch ids)

### Posts, Comments, Reactions
- GET    /api/v2/posts?missionId[&groupId]&category=&status=&q=&cursor=&limit=&pinned=true
- POST   /api/v2/posts                           // includes announcement/resource/guideline/coding
- GET    /api/v2/posts/:id
- PATCH  /api/v2/posts/:id                       // edit, pin
- PATCH  /api/v2/posts/:id/status                // approve/resolve/reject
- GET    /api/v2/posts/:id/comments?cursor=&limit=
- POST   /api/v2/posts/:id/comments
- POST   /api/v2/posts/:id/reactions             { reaction }
- DELETE /api/v2/posts/:id/reactions?reaction=
- POST   /api/v2/link-preview                    { url }

### Notifications
- POST   /api/v2/notifications                   // fan-out for announcements, mentions, status-changes
Email: Send for mission and group announcements to respective student audiences, in addition to in‑app notifications.
Announcements replies:
- Students and moderators can both comment. Moderator replies are highlighted with role badges.

---

## Manual Integration (SSE + Polling)

Chat (Channels/Messages)
- Create/List: `/api/v2/channels`
- Send: `POST /api/v2/channels/:id/messages` (send Cloudinary image URLs if any)
- Receive: poll `GET /api/v2/channels/:id/messages?limit=&cursor=` every 2–4s or wire an SSE stream endpoint if needed

Announcements (Posts/Comments)
- Publish: `POST /api/v2/posts` with `category=announcement`
- Read: `GET /api/v2/posts?missionId=&category=announcement`
- Comment: `POST /api/v2/posts/:id/comments`
- Moderate: `PUT /api/v2/posts/:id` with `{ status }` (writes `ModerationLog`)

### Project-specific routing clarifications
- No versioned routes for realtime modules. Use unversioned, project-native paths:
  - Chat
    - `GET /api/chat/messages?channel=`
    - `POST /api/chat/messages`
    - `GET /api/chat/stream?channel=`
    - `POST /api/chat/typing`
    - `GET /api/chat/typing/stream?channel=`
    - Page: `/chat`
  - Announcements
    - `GET/POST /api/announcements`
    - `GET /api/announcements/stream?channel=`
    - `GET/POST /api/comments?announcementId=`
    - Page: `/announcements`
- Unsubscribe endpoint for email fan‑out will be added later (not in this phase).

## UI/UX (Mission Hub & Groups)

Mission level
- Mentor Messaging: channel header, virtualized message list, composer (emoji, image upload), reactions, read receipts, typing
- Announcements: type filters (general/session/live‑session/important), pinned first, detail view with comments and reactions
- Resources: link cards with OG preview, tags, quick copy; images allowed (Cloudinary, no auto transforms)
- Guideline: list with status chips and filters (status, mine), detail with threaded comments, status control for staff
- Coding: like Guideline with code blocks and auto language highlight; dark theme preferred

Group level
- Group Announcements: list + detail; mentors/staff post; members comment/react
- Group Discussion: chat UI similar to mentor messaging

Common
- Unread counters, mark‑all‑read, search, tag filters, date range
- No placeholder misuse in select controls; use labels
- Attachments: images only; Cloudinary upload with preview before posting

---

## Performance & Limits
- Cursor pagination everywhere; lazy‑load older items
- Lean queries and field projections; avoid over‑the‑wire bloat
- Subscribe only to visible scopes; avoid unnecessary polling
- Debounce typing; collapse duplicate reactions client‑side

---

## Rate Limiting & Safety
- Quotas: e.g., ≤10 messages / 10s per user per channel; ≤30 reactions / min
- Attachment size/type caps; optional safety checks later

---

## Analytics & Admin
- Metrics: messages/day, response time (guideline/coding), announcement reach (views/read receipts)
- Exports: announcements/resources CSV
- Admin toggles: allow comments on announcements (on), who can create resources (staff+mentors), reaction set (fixed)

---

## Testing Strategy
- Unit: RBAC guards, validators, status transitions
- Integration: post → notify → read; visibility constraints (group/membership)
- Performance: high‑volume message appends and fan‑out; pagination

---

## Rollout Plan
1) Mission Announcements (+reactions/comments) with email + in‑app notifications
2) Mentor Messaging (chat) with presence/typing, reactions, read receipts
3) Group Discussion + Group Announcements
4) Resources (link preview service + uploads)
5) Guideline + Coding (statuses, moderation)
6) Read‑receipts batching, idle‑mode, and analytics

---

## Detailed Implementation Checklist (SSE + REST)

### 0) Foundations & Alignment
- [ ] Validate ENV: `MONGODB_URI`, `APP_BASE_URL`, `EMAIL_PROVIDER`, `EMAIL_FROM`, SMTP creds, `EMAIL_UNSUBSCRIBE_SECRET`, Cloudinary keys
- [ ] RBAC utilities expose helpers: `requireNonStudent`, `requireGroupMember(missionId, groupId?)`
- [ ] Seed/dev data scripts for Missions, Groups, few Users (student/non‑student)
- [ ] Sidebar entries under Mission Hub (Messaging, Announcements, Resources, Guideline, Coding) and Group (Discussion, Announcements)

### 1) Data Models (Mongoose)
- [ ] Channel: fields (missionId, groupId?, type, visibility, allowedRoles, lastMessageAt, createdBy) with indexes `(missionId,groupId,type)` and `(lastMessageAt desc)`
- [ ] Message: fields (channelId, senderId, body, attachments, mentions, reactions, threadId?, readReceipts?, editedAt?, deletedAt?) with indexes `(channelId,createdAt)` and `(threadId)`
- [ ] Post: fields (missionId, groupId?, category, announcementType?, title, body, attachments, tags, status, pinned, visibility, createdBy) with indexes `(missionId,groupId,category,createdAt)` and `(status)`
- [ ] Comment: fields (postId, authorId, body, attachments, reactions, createdAt, editedAt?) with index `(postId,createdAt)`
- [ ] ModerationLog: fields per spec with index `(targetId,createdAt)`
- [ ] Template: fields per spec with indexes `(key,scope,version desc)` and `(isDefault)`

### 2) Realtime (SSE) & Polling
- [ ] Chat SSE stream endpoint skeleton (if needed) or rely on message polling
- [ ] Announcements SSE stream endpoint to push newly created posts of `category=announcement`
- [ ] Typing SSE stream + POST typing endpoint (channelKey based)
- [ ] Keep‑alive pings (`: ping`) and abort handlers on `req.signal`

### 3) APIs (v2) — Channels & Messages
- [ ] `GET /api/v2/channels`: filter by missionId/groupId/type; sort by `lastMessageAt`
- [ ] `POST /api/v2/channels`: non‑student only; validate type/visibility; set `createdBy`
- [ ] `GET /api/v2/channels/:id/messages`: cursor pagination via `_id`, `limit` cap 100, optional `threadId`
- [ ] `POST /api/v2/channels/:id/messages`: rate limit per user, RBAC (students blocked on mentor‑messaging), attachments must be Cloudinary URLs
- [ ] Error responses: `{ success:false, error }` with proper status codes

### 4) APIs (v2) — Posts & Comments
- [ ] `GET/POST /api/v2/posts`: filter by missionId/groupId/category/status; default sort `_id desc`; set status `pending` for guideline/coding, `approved` for announcements/resources
- [ ] `GET/PATCH/DELETE /api/v2/posts/:id`: field‑level edit; pin/unpin; safe body length limits
- [ ] `PUT /api/v2/posts/:id`: status change; write `ModerationLog { from,to,reason }`
- [ ] `GET/POST /api/v2/posts/:id/comments`: pagination; attach author; ensure non‑students + author can interact per RBAC
- [ ] (Optional) `POST/DELETE /api/v2/posts/:id/reactions`: fixed set `ok|love|cry|haha|bulb`
- [ ] `GET /api/v2/moderation-logs?targetType=&targetId=&cursor=&limit=`

### 5) Email & Notifications
- [ ] Template keys: `announcement.general|session|live-session|important`
- [ ] Template resolver (scope order: group → mission → global → default)
- [ ] Fan‑out: when announcement created/updated → email students in mission/group (respect opt‑out)
- [ ] Unsubscribe endpoint (signed with `EMAIL_UNSUBSCRIBE_SECRET`), update preferences store
- [ ] In‑app notifications create/list/mark‑read primitives

### 6) Mission Hub UI (Full Pages)
- [ ] Mentor Messaging: channel picker, message list (virtualized), composer (markdown + emoji), reactions, (optional) typing via SSE, show BD time
- [ ] Announcements: list with chips (general/session/live/important), create form (non‑student), detail page with comments; moderator replies with role badges
- [ ] Resources: list cards (OG preview), create (non‑student), copy links; filter by course tag (mission‑wide visibility)
- [ ] Guideline: list with status filters; create by students; detail thread; staff moderation controls
- [ ] Coding: same as guideline + code blocks, auto language highlight (dark theme)

### 7) Group Pages
- [ ] Discussion: group channel; enforce membership check server‑side and client‑side guards
- [ ] Announcements: mentors/staff create; members can comment/react

### 8) Safety & Compliance
- [ ] Global and per‑user rate limits (messages/posts/comments/reactions)
- [ ] Markdown sanitization — block raw HTML; allow links/code/inline formatting
- [ ] Attachments: images only; verify URL is Cloudinary
- [ ] Size limits on payloads (body/attachments) and request validation

### 9) Analytics & Counters
- [ ] Unread counters (by channel/category) and mark‑all‑read endpoint
- [ ] Metrics dashboards: message volume/day, guideline response times, announcement reach

### 10) Testing
- [ ] Unit tests: RBAC guards, validators, status transitions, template resolver
- [ ] Integration: create → list → comment → status change → ModerationLog; announcement create → email fan‑out (mock provider)
- [ ] Performance: pagination under load; SSE stream keep‑alive; message burst with rate limits

### 11) Rollout
- [ ] R1: Announcements + templates + email fan‑out
- [ ] R2: Mentor Messaging (polling and/or SSE typing)
- [ ] R3: Group Discussion + Group Announcements
- [ ] R4: Resources
- [ ] R5: Guideline + Coding
- [ ] R6: Unread counters + analytics

---

## Open Points (final clarifications)
- Maximum image size for uploads (MB) and allowed MIME types (e.g., jpg/png/webp)?
  answer: no limit; upload directly to Cloudinary (no f_auto/q_auto transforms)
- Any need to restrict announcements comments to reactions‑only for specific announcement types?
  answer: not needed; add moderator reply feature (highlighted with role badges) alongside student comments
- Should we enable per‑course scoping inside a mission for Resources (tags already cover most needs)?
  answer: keep mission‑wide visibility; use course tags for filtering only

---

## Environment Variables (to be set manually)

Core
- APP_BASE_URL
- APP_NAME
- MONGODB_URI

 

Cloudinary (images only)
- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET
- CLOUDINARY_UPLOAD_PRESET     # if using unsigned uploads

Email provider (choose one; keep others empty)
- EMAIL_FROM
- EMAIL_PROVIDER=sendgrid|resend|smtp
- SENDGRID_API_KEY             # if EMAIL_PROVIDER=sendgrid
- RESEND_API_KEY               # if EMAIL_PROVIDER=resend
- SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS  # if EMAIL_PROVIDER=smtp

Notifications
- NOTIFICATION_EMAIL_ENABLED=true

Security/limits (optional)
- SECURITY_RATE_LIMIT_GLOBAL=1000:60   # requests per window
- SECURITY_RATE_LIMIT_PER_USER=60:60

---

## Email Template Management

Model: Template
- _id, key (e.g., announcement.general, announcement.session, announcement.live, announcement.important)
- scope: 'mission' | 'group' | 'global'
- subject, body (markdown)
- variables: string[]
- version: number, isDefault: boolean
- createdBy, createdAt, updatedAt

APIs
- GET/POST /api/v2/templates?scope=&key=
- GET/PATCH /api/v2/templates/:id (edit, set default)
- POST /api/v2/templates/:id/preview { sampleData }

UI
- Template list with search/filter (scope, key)
- Editor with live preview (markdown)
- Version history and set‑default control

Resolver
- When sending emails, resolve: (mission/group key) → mission → global → fallback default

Text Formatting (Discord‑like)
- Markdown: bold/italic/underline/strike, code blocks with language auto‑detect, inline code, quotes, lists, links
- Emoji shortcodes: :ok:, :love:, :cry:, :haha:, :bulb:
- Mentions: @user (render badge, notify) and #group (link)
- Auto‑link URLs; sanitize output; no raw HTML



