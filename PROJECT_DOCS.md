# Mentorship SMS — Project Documentation

## Overview
A mentorship-focused Student Management System (SMS) built with Next.js (App Router) and MongoDB. Core MVP includes authentication, dashboards per role, health/docs, batches/semesters, courses per semester, and course-based assignments.

## Tech Stack
- Next.js 15 (App Router, API routes, Tailwind)
- MongoDB (Mongoose)
- Auth: JWT (HTTP-only cookie for web; Bearer for mobile)

## Environments
Create `sms-web/.env.local`:
```
MONGODB_URI=<your mongodb atlas uri>
JWT_SECRET=<your random secret>
```
Restart dev after changes.

## Run locally
```
cd sms-web
npm run dev
```
- App: http://localhost:3000
- Docs viewer: http://localhost:3000/docs (OpenAPI JSON at /api/docs)
- Health: http://localhost:3000/api/health

## Seeding
Run these (POST) in order:
- `/api/seed` → creates default users
- `/api/seed/batches` → creates Batch 006/007 and their 3 semesters
- `/api/seed/courses` → creates 2 demo courses per semester for Batch 006/007

Temporary accounts:
- developer: dev@example.com / password123
- admin: admin@example.com / password123
- manager: manager@example.com / password123
- sre: sre@example.com / password123
- mentor: mentor@example.com / password123
- student: student@example.com / password123

## UI map
- `/` Home (role-aware CTA)
- `/login` Sign in (sets JWT cookie)
- `/dashboard` Main dashboard (header + sidebar)
- `/dashboard/profile` Profile (shows JWT user info)
- Role dashboards:
  - `/dashboard/developer`, `/dashboard/admin`, `/dashboard/manager`, `/dashboard/sre`, `/dashboard/mentor`, `/dashboard/student`

## Data Model (current)
- Users: { email, password(hash), role, name, timestamps }
- Batches: { title, code(unique) }
- Semesters: { batchId, number(1..3), title, dates }
- Courses: { title, code(unique), semesterId }
- StudentCourse: { studentId, courseId, mentorId? } (unique: studentId+courseId)
- Assignments: { studentId, courseId, title, submitted, points, fileUrl, timestamps }

## API Reference (current)
- Health
  - GET `/api/health` → { status, db }
- Auth
  - POST `/api/auth/login` { email, password } → sets cookie `token`
  - POST `/api/auth/register` { email, password, name, role } → 201
- Seeding (POST only)
  - `/api/seed`, `/api/seed/batches`, `/api/seed/courses`
- Docs
  - GET `/api/docs` → OpenAPI JSON
- Courses
  - GET `/api/courses` (optional `?semesterId=`)
  - POST `/api/courses` { title, code, semesterId }
  - PATCH `/api/courses?id=` { partial }
  - DELETE `/api/courses?id=`
- Assignments (course-based)
  - GET `/api/assignments` (`?courseId=`, `?studentId=`)
  - POST `/api/assignments` { studentId, courseId, title, submitted?, points?, fileUrl? }
  - PATCH `/api/assignments?id=` { submitted?, points?, fileUrl? }

Note: Use Bearer token for mobile; web uses cookie.

## Postman quick start
1) Env: baseUrl = http://localhost:3000
2) Seed: POST {{baseUrl}}/api/seed → POST /api/seed/batches → POST /api/seed/courses
3) Login: POST {{baseUrl}}/api/auth/login with dev@example.com/password123
   - Ensure Postman stores cookie `token` for localhost
4) List courses: GET {{baseUrl}}/api/courses
5) Create assignment: POST {{baseUrl}}/api/assignments { studentId, courseId, title }
6) Submit assignment: PATCH {{baseUrl}}/api/assignments?id={{assignmentId}} { submitted: true, points: 10 }
Common: 405 on seed endpoints → you used GET; switch to POST.

## Troubleshooting
- Duplicate index warning on `Batch.code`: removed schema-level duplicate; restart dev.
- 404 /dashboard/<role>: ensure you’re signed in; routes are mapped under `/dashboard/*`.
- 500 profile layout: transient during hot reload; refreshing resolves.

## Roadmap (recommended)
- RBAC: central permission matrix (read/create/update/delete per resource); server-side guards on all APIs; UI show/hide by permission.
- CRUD UI: Batches, Semesters (auto 1–3), Courses; user management; student-course linking.
- Attendance UI/APIs: submit/view/manage; SRE low-performer query.
- Notices: create (batch/semester/course scoped), acknowledgments.
- Logs & auditing; soft delete for critical entities.
- Testing: unit (models, services), API tests for permission matrix, minimal E2E.
- RN readiness: token refresh; CORS tuned for mobile.

## Notes
- Auth: Developer currently has full access in UI.
- Keep cookies (web) or Bearer tokens (mobile) secure; never expose secrets in client code. 

## Modularity & Structure
Keep feature modules cohesive and thin:

### Folder layout (partial)
```
src/
  app/
    (auth)/
    (dashboard)/
    dashboard/            # concrete URL routes using dashboard layout
      layout.tsx          # shell (header + sidebar)
      page.tsx            # home content (no shell here)
      admin/ ...          # role pages
    api/
      auth/*              # auth APIs
      health/route.ts
      docs/route.ts       # OpenAPI JSON
      seed/*              # seed endpoints
      courses/route.ts
      assignments/route.ts
  lib/                    # cross-cutting libs (auth, db, rbac)
  models/                 # Mongoose models (one file per schema)
  components/             # Reusable UI components (future)
```

### Models
- One file per model in `src/models`.
- Keep schema and indexes together.
- Avoid duplicating indexes: prefer field-level `unique: true`; only use `Schema.index()` when needed.

### API routes
- One resource per file under `src/app/api/<resource>/route.ts`.
- Validate input with Zod; return `{ data }` or `{ error }` consistently.
- Centralize RBAC checks in helpers (future: `lib/permissions.ts`).

### UI components
- Use small, composable components in `src/components` (e.g., `DataTable`, `PageHeader`, `FormRow`).
- Keep pages dumb: fetch and compose; push complex logic to libs/hooks.

## UI Guidelines (Consistent Colors)
- Primary color: blue-600 (#2563eb), foreground white
- Background: white (#ffffff), text: gray-900 (#111827)
- Border: gray-200 (#e5e7eb), Muted: gray-500 (#6b7280)
- Use provided utility classes from `globals.css`: `.btn`, `.btn-primary`, `.card`, `.input`, `.table`, `.app-header`, `.app-sidebar`, `.app-navlink`.
- Buttons: primary actions use `.btn.btn-primary`; secondary use `.btn`.
- Cards for panels; tables for lists; inputs for forms.

## Component stubs to start (add in `src/components`)
- `PageHeader.tsx`: title + optional actions
- `DataTable.tsx`: headers + rows (generic)
- `FormRow.tsx`: label + field + error message

Example usage:
```tsx
// src/components/PageHeader.tsx
export default function PageHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}
```

## RBAC (recommended next)
- Define permission constants per resource (read/create/update/delete/grade/manage).
- Map roles → permissions and enforce in all APIs.
- Hide UI actions based on `hasPermission`. 

## SRE Email Import — Assignment Submissions (Admin → SRE)

### Goal
Let staff import a list of student emails (from an external site) to mark submissions for a specific assignment tied to a specific course offering (course + batch + semester). The system will only update students that already exist in SMS and will not create new users.

### Roles & Permissions
- Phase 1: admin only
- Phase 2: admin + sre

### Identification of Target
- UI flow selects: Batch → Semester → Course Offering → Assignment
- API operates primarily with `assignmentId` (assignment belongs to a course offering which is tied to a batch+semester)

### Input
- Email list (plain text area or CSV upload v1: one email per line)
- System deduplicates emails (case-insensitive) before processing

### Behavior
- For each unique email:
  - Find `User` with `role = 'student'` and matching `email`
  - If found, upsert a `StudentAssignmentSubmission` for `{ assignmentId, studentId }` with `submittedAt = now` if not already present
  - If already submitted, count as `alreadySubmitted`
  - If no matching user, count as `notFound`
- No user creation, no invite
- Idempotent by unique index on `{ assignmentId, studentId }`

### API (proposed)
- POST `/api/submissions/import-emails`
  - Body:
    ```json
    {
      "assignmentId": "<ObjectId>",
      "emails": ["a@x.com", "b@x.com", "c@x.com"],
      "dryRun": false
    }
    ```
  - Auth: Phase 1 → admin; Phase 2 → admin|sre
  - Response:
    ```json
    {
      "ok": true,
      "summary": {
        "total": 10,
        "unique": 9,
        "created": 7,
        "alreadySubmitted": 1,
        "notFound": 1
      },
      "notFoundEmails": ["missing@x.com"]
    }
    ```
  - Notes:
    - `dryRun=true` returns the summary without writing
    - Emails are trimmed and compared case-insensitively

### UI (admin → later SRE)
- Page: `Dashboard → Management → Offerings → Assignments → Import Emails`
  - Textarea for emails (one per line)
  - Checkbox `Dry run`
  - Submit → shows summary
  - If OK, uncheck Dry run and Import

### Validation & Errors
- 400: missing `assignmentId` or empty `emails`
- 401/403: unauthorized role
- 404: assignment not found
- 200/409: import succeeds but returns counts for already-submitted/not-found

### Audit & Observability (later)
- Log imports with actor, assignmentId, counts
- Optional: store raw uploaded list (hash) for audit 

## Missions & Tasks (Planning)

Purpose
- Structure student progress under a Mission with time-bounded tasks. Mentors are responsible for subsets of students and drive engagement via announcements and messaging. Students earn points for completing mission tasks; points roll up into a batch-wise leaderboard.

Scope & Concepts
- Mission: Time-bounded program unit, scoped to batch and semester. Contains a task set and deadlines.
- Tasks: Repeated or one-off activities (daily attendance, course assignments, weekly meeting attendance, reacting to announcements, custom tasks).
- Mentorship: Mentors are assigned to subsets of students for a mission and oversee progress.
- Communications: Announcements (mentor → students) and 1:1 messaging (student ↔ mentor) within the mission.
- Points & Leaderboard: Task completions award points; batch-wide leaderboard visible to all students in the batch.

Data Model (planned)
- Mission
  - _id
  - batchId (ObjectId)
  - semesterId (ObjectId)
  - title (string)
  - description? (string)
  - startAt? (Date)
  - endAt? (Date)  // mission deadline
  - isActive (boolean, default true)
  - createdBy (UserId)
  - indexes: { batchId, semesterId, isActive }
- MissionTask
  - _id
  - missionId (ObjectId)
  - title (string)
  - type: "daily_attendance" | "course_assignment" | "weekly_meeting" | "announcement_reaction" | "custom"
  - points (number, default per type; override allowed)
  - required? (boolean, default false)
  - cadence?: "daily" | "weekly" | "once" | "per_announcement" | null
  - dueAt?: Date (for once/off-cycle tasks)
  - metadata?: object (e.g., courseOfferingId for assignment linkage)
  - indexes: { missionId, type }
- MentorAssignment
  - _id
  - missionId (ObjectId)
  - mentorId (UserId)
  - studentIds: UserId[] (array of assigned students)
  - indexes: { missionId, mentorId }
- MissionAnnouncement
  - _id
  - missionId (ObjectId)
  - mentorId (UserId)
  - title (string)
  - body (string)
  - createdAt (Date)
  - indexes: { missionId, createdAt }
- MissionAnnouncementReaction
  - _id
  - announcementId (ObjectId)
  - userId (UserId)
  - reactedAt (Date)
  - unique: { announcementId, userId }
- MissionMessage
  - _id
  - missionId (ObjectId)
  - threadKey: string // `${mentorId}:${studentId}`
  - senderId (UserId)
  - recipientId (UserId)
  - body (string)
  - createdAt (Date)
  - indexes: { missionId, threadKey, createdAt }
- MissionCompletion (event log for points)
  - _id
  - missionId (ObjectId)
  - taskId (ObjectId)
  - userId (UserId)
  - occurredAt (Date)
  - pointsAwarded (number)
  - source: "attendance" | "assignment" | "meeting" | "announcement_reaction" | "manual" | "custom"
  - unique (optional per cadence): e.g. one daily attendance per day per user per mission
  - indexes: { missionId, userId, occurredAt }

Notes
- We will integrate with existing Attendance and Assignments by recording MissionCompletion entries when students submit attendance/assignments under the mission’s scope.
- Weekly meetings: either manual mark by mentor or meeting events with attendance captured that emit MissionCompletions.

RBAC (planned)
- Admin/Developer: full manage on missions, tasks, mentor assignments, announcements, messaging moderation.
- Manager: manage missions for their batches; view reports.
- Mentor: manage announcements, view/grade tasks in their cohort, message with assigned students, mark weekly meeting attendance, view cohort leaderboard.
- Student: view mission, submit attendance, complete tasks (assignments link), react to announcements, message mentor, view batch leaderboard.

Points & Leaderboard
- Default points per type (suggested start):
  - daily_attendance: 1 point/day
  - course_assignment: 5–20 points per assignment (config per task)
  - weekly_meeting: 3 points per meeting
  - announcement_reaction: 1 point per announcement
  - custom: admin/mentor-defined
- Leaderboard rollup: sum MissionCompletion.pointsAwarded per user within batch scope; ties broken by earliest completion timestamp.
- Visibility: All students in the batch can view the batch leaderboard on dashboard.

API Outline (planned)
- Missions
  - GET /api/missions?batchId&semesterId
  - POST /api/missions { batchId, semesterId, title, startAt?, endAt? }
  - PATCH /api/missions?id=… { title?, startAt?, endAt?, isActive? }
  - DELETE /api/missions?id=… (cascades tasks/assignments only if safe; otherwise soft delete)
- Mission Tasks
  - GET /api/missions/tasks?missionId
  - POST /api/missions/tasks { missionId, title, type, points?, cadence?, dueAt?, metadata? }
  - PATCH /api/missions/tasks?id=… { … }
  - DELETE /api/missions/tasks?id=…
- Mentor Assignment
  - GET /api/missions/mentors?missionId
  - POST /api/missions/mentors { missionId, mentorId, studentIds[] }
  - PATCH /api/missions/mentors?id=… { studentIds[] }
  - DELETE /api/missions/mentors?id=…
- Announcements
  - GET /api/missions/announcements?missionId
  - POST /api/missions/announcements { missionId, title, body }
  - POST /api/missions/announcements/react { announcementId }
- Messaging
  - GET /api/missions/messages?missionId&threadKey
  - POST /api/missions/messages { missionId, recipientId, body }
- Completions (points)
  - GET /api/missions/completions?missionId&userId
  - POST /api/missions/completions { missionId, taskId, userId, pointsAwarded, source, occurredAt? } (admin/mentor/manual)
- Leaderboard
  - GET /api/missions/leaderboard?batchId (optionally missionId)

UI Outline (planned)
- Admin/Manager:
  - Missions CRUD per batch+semester
  - Tasks CRUD per mission; default task templates
  - Mentor assignment UI; mission analytics
- Mentor:
  - Mission dashboard: announcements, meetings, cohort progress, messaging
  - Mark weekly meeting attendance; see points rollups
- Student:
  - Mission dashboard: task list with states, submit attendance, assignment links, react to announcements, message mentor
  - Batch leaderboard page on dashboard

Phasing
- Phase 1 (MVP mission): Admin creates missions+tasks; mentor posts announcements; student reacts and submits attendance; points accumulate; batch leaderboard visible.
- Phase 2: Messaging, meetings attendance, mentor assignment tooling, analytics. 

## High Priority — Student Management, Approvals, Dedupe, and Mission Activation

Objectives
- Enable full student CRUD with system-wide activate/suspend
- Enforce batch-wise approval workflow (pending → approved) per batch
- Allow admin/manager to detect and remove duplicates within the same batch
- Allow SRE to activate/deactivate students per mission (mission-scoped pacing control)

Roles & Permissions
- Admin/Manager: student CRUD; approve/deny batch membership; remove duplicates from a batch; system-wide activate/suspend
- SRE: mission-scoped activate/deactivate participants only (no global CRUD)
- Mentor: read-only list of approved students in their cohort; no activation controls
- Student: view own status

Data Model (planned)
- User (existing)
  - isActive (boolean) → system-wide active/suspended
- StudentProfile (existing)
  - keep as demographic container
- StudentBatchMembership (new)
  - _id
  - studentId (UserId)
  - batchId (BatchId)
  - status: "pending" | "approved" | "removed"
  - joinedAt?: Date
  - leftAt?: Date
  - unique: { studentId, batchId }
  - indexes: { batchId, status }
- MissionParticipant (new)
  - _id
  - missionId (MissionId)
  - studentId (UserId)
  - status: "active" | "inactive" | "suspended"
  - reason?: string
  - updatedBy: UserId
  - updatedAt: Date
  - unique: { missionId, studentId }
  - indexes: { missionId, status }

API Outline (planned)
- Students (admin/manager)
  - GET /api/students?batchId&status (lists students with membership status for the batch)
  - POST /api/students { email, name, password?, batchId } → creates user (role=student) and membership (pending)
  - PATCH /api/students?id=… { name?, email? (if allowed), isActive? } (system-wide)
  - DELETE /api/students?id=… (soft: set isActive=false and/or remove memberships)
- Approvals (batch-wise; admin/manager)
  - POST /api/students/approve { studentId, batchId } → membership.status=approved, joinedAt=now
  - POST /api/students/deny { studentId, batchId } → membership.status=removed, leftAt=now (does not delete user)
  - GET /api/students/pending?batchId → all pending memberships
- Dedupe (admin/manager)
  - GET /api/students/duplicates?batchId → groups by email with count>1 (approved+pending)
  - POST /api/students/duplicates/resolve { batchId, email, keepStudentId, action: "remove"|"merge" }
    - remove: set membership.status=removed for others in same batch
    - merge (later): migrate dependent records to keepStudentId then remove others from batch
- Mission participants (SRE, admin/manager)
  - GET /api/missions/participants?missionId
  - POST /api/missions/participants { missionId, studentId, status, reason? } (SRE can toggle only)

UI Flow (planned)
- Admin/Manager
  - Students page: Create student (goes to Pending for selected batch)
  - Pending tab per batch: bulk approve/deny
  - Dedupe tab: show duplicates by email in batch; resolve (remove/merge)
  - Student detail: system-wide Activate/Suspend (User.isActive)
- SRE
  - Mission participants page: list students in mission with status chips; toggle Active/Inactive/Suspended; add reason
- Student
  - Profile shows per-batch status and mission statuses

Validation & Rules
- A user can belong to multiple batches but only once per batch (enforced by unique membership)
- Approving sets membership.approved and timestamps; denial does not delete the user
- Dedupe acts only within the same batch scope; email comparison case-insensitive
- SRE cannot change system-wide isActive; only mission-scoped status

Audit (recommended)
- Record approval/denial actions (actor, membershipId, timestamps)
- Record dedupe decisions (actor, email, batchId, keepStudentId, affectedIds)
- Record mission participant toggles (actor, missionId, studentId, old→new status, reason)

Phasing
- Phase 1 (Now): CRUD, batch-wise approvals, pending list, system-wide activate/suspend, SRE mission toggles
- Phase 2: Dedupe UI and merge tooling; detailed audit pages; bulk CSV approvals 

### Enrollment via Batch Email Upload (High Priority)

Overview
- Admin/Manager/SRE upload a batch-scoped email list to pre-provision student accounts. Accounts start as pending; upon approval, a temporary password is issued and the student must complete profile on first login.

Roles
- Admin/Manager: upload emails for any batch, approve/deny
- SRE: upload emails for assigned batches, approve/deny

Input
- Batch-scoped list: CSV or textarea (one email per line)
- Optional: per-row firstName, lastName (if present)
- System deduplicates emails (case-insensitive) per batch before processing

Behavior
- For each unique email:
  - If no user exists → create `User` (role=student, isActive=true), generate `userId` (ST###), set a temporary password (random strong), and create `StudentBatchMembership` with status=pending
  - If user exists → ensure `StudentBatchMembership` upserted with status=pending
- No invitations to non-email formats; invalid emails are skipped with errors in summary

Approval
- Approve: membership.status=approved, joinedAt=now; trigger email with temporary password and login link
- Deny: membership.status=removed, leftAt=now; user remains, but not in this batch

API (planned)
- POST `/api/students/enroll-emails` { batchId, emails[], dryRun? }
  - Returns { summary: { total, unique, createdUsers, addedMemberships, invalidEmails } }
- GET `/api/students/pending?batchId`
- POST `/api/students/approve` { studentId, batchId }
- POST `/api/students/deny` { studentId, batchId }

UI (admin/manager/sre)
- Students → Upload Emails: textarea/CSV upload, Dry run, Import
- Pending tab: list + bulk approve/deny
- Dedupe tab remains available

Email
- On approval, send temporary password and link to login + profile completion
- Use transactional provider (future)

Security
- Temp passwords expire after first login (forced change) or in 72 hours, whichever comes first (planned)
- Rate-limit uploads by role, size limits (e.g., 1k emails per upload)

### First Login — Profile Completion (High Priority)

Requirement
- After first login with temporary password, student must complete mandatory profile fields and set a new password before accessing dashboard.

Required fields
- Full name: firstName, lastName
- Username (unique, immutable after set)
- New password + confirm password (meets policy)
- Phone number
- Profile picture (exact 500x500 px; validate dimensions)

Optional fields
- Middle name, display name, alt email, address, DOB, etc.

Behavior
- Force redirect to `/onboarding` until completion
- Validate image dimension client- and server-side; store to object storage (future) or accept URL MVP
- On success, mark `profileCompleted=true` in profile; rotate temp password → new hash; require re-login

Validation
- Username: unique, 3–20 chars, alphanumeric + underscore
- Phone: E.164 format validation (MVP basic regex)
- Password: min 8 chars with complexity (MVP min length)

API (planned)
- GET `/api/me/profile` → returns profile + completion flag
- POST `/api/me/onboarding` { firstName, lastName, username, phone, avatarUrl/base64, newPassword, confirmPassword }

UI
- Onboarding page with a single form; image cropper (later). Disable skip.

Audit
- Track onboarding completion timestamp and IP/device (later) 