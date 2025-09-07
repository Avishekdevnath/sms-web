### Attendance & Progress Tracking – Implementation Plan (V2)

Goal: Enable daily attendance for every mission participant and align data with mentorship groups, powering student-level progress and group/mission analytics. Attendance counts only from when a student joined the mission (`MissionStudentV2.startedAt`).

---

## 1) Data Model Changes

- **New collection: `AttendanceLogV2`**
  - Fields:
    - `missionId` (ObjectId, required)
    - `studentId` (ObjectId, required)
    - `mentorshipGroupId` (ObjectId, optional; group at time of marking)
    - `date` (Date, required; midnight UTC or mission timezone-normalized)
    - `status` ('present' | 'absent' | 'excused')
    - `source` ('student' | 'mentor' | 'admin' | 'system')
    - `notes` (string, optional)
    - `markedBy` (ObjectId, optional; who marked)
    - `createdAt`, `updatedAt`
  - Indexes:
    - Unique: `{ missionId, studentId, date }`
    - Query: `{ missionId, mentorshipGroupId, date }`, `{ studentId, date }`
  - Constraints:
    - Reject logs with `date < MissionStudentV2.startedAt`
    - Reject if student not active on that day (optional rule; configurable)

- **Extend `MissionStudentV2` (no breaking changes)**
  - Keep existing fields: `startedAt`, `attendanceRate`, `lastAttendanceDate`, `isRegular`
  - Add computed/derived fields (updated asynchronously):
    - `attendance`: `{ eligibleDays: number, presents: number, absents: number, excused: number, streakPresentDays: number, lastComputedAt: Date }`
  - These are recalculated from `AttendanceLogV2` and `startedAt`.

- **No changes required to `MentorshipGroupV2`**, but analytics will aggregate attendance by `mentorshipGroupId` from logs.

---

## 2) Attendance Semantics

- **Eligibility window**: From `MissionStudentV2.startedAt` to today.
- **Attendance day**: A calendar day in the mission timezone. Default to `Asia/Dhaka` or mission-level timezone.
- **One log per day per student**: Enforced via unique index.
- **Transfers between groups**: The `mentorshipGroupId` on each log captures the group at the moment of marking, preserving history across transfers.
- **Attendance Rate**: `attendanceRate = floor((presents / eligibleDays) * 100)` ignoring days with no requirement (e.g., weekends if configured). `eligibleDays` is computed by schedule config (see Section 6).
- **Regularity**: `isRegular = attendanceRate >= 80` (configurable threshold).

---

## 3) API Endpoints (Next.js /api/v2)

- `POST /api/v2/attendance/mark`
  - Body: `{ missionStudentId | (missionId, studentId), date?, status, notes? }`
  - Rules: default `date = today`, clamp to mission timezone day; validate against `startedAt`; capture `mentorshipGroupId` at time of marking; upsert log; update derived counters async.
  - RBAC: student can mark self (present/absent), mentor/admin can mark for group/students.

- `POST /api/v2/attendance/bulk-mark`
  - Body: `{ missionId, mentorshipGroupId?, studentIds?, date?, status, notes? }`
  - Marks multiple students at once (mentor/admin only).

- `GET /api/v2/attendance/logs`
  - Query: `{ missionId, studentId?, mentorshipGroupId?, from?, to?, page?, limit? }`
  - Returns paginated logs.

- `GET /api/v2/attendance/summary/student`
  - Query: `{ missionId, studentId }`
  - Derived: `eligibleDays, presents, absents, excused, attendanceRate, streakPresentDays`.

- `GET /api/v2/attendance/summary/group`
  - Query: `{ missionId, mentorshipGroupId, from?, to? }`
  - Aggregates students’ attendance rates and daily presence counts.

- `GET /api/v2/attendance/summary/mission`
  - Query: `{ missionId, from?, to? }`
  - High-level daily presence curve and distribution of attendance rates.

---

## 4) UI/UX

- **Student – Daily Check-in widget**
  - Location: Mission Hub → Student view
  - Show today’s status; buttons: “Mark Present”, “Mark Absent”; optional notes
  - Prevent marking for dates before `startedAt`; lock past days if policy forbids backfill

- **Mentor – Group Bulk Mark**
  - Location: Mission Hub → Groups → Group detail
  - Table of students with quick toggles for today; bulk actions; filter by status

- **Admin – Attendance Dashboards**
  - Mission overview: heatmap/calendar, trend line, low-regularity list
  - Group overview: per-group presence rates, top/bottom groups, anomalies
  - Student profile: calendar view starting from `startedAt`, streaks

---

## 5) Derivation & Jobs

- On each mark (or nightly job):
  - Recompute student summary from `AttendanceLogV2` since `startedAt`
  - Update `MissionStudentV2.attendanceRate`, `lastAttendanceDate`, `isRegular`, and `attendance.*`
  - Update cached group and mission aggregates for the day

- Optional scheduled job (UTC 00:30 mission TZ):
  - Close previous day, compute eligibleDays based on schedule, backfill absences if missing (policy-based)

---

## 6) Scheduling & Eligibility Rules

- Config hierarchy: Mission-level default; override per group if needed
  - `workingDays`: e.g., `[0..6]` or Mon–Fri
  - `holidays`: ISO dates to exclude
  - `timezone`: e.g., `Asia/Dhaka`
  - `requiresDailyAttendance`: boolean (default true)
  - `graceWindowMinutes`: allow marking within this window after day end

- `eligibleDays` calculation:
  1) Iterate days from `startedAt` to `today`
  2) Exclude days not in `workingDays` and listed `holidays`
  3) Include only days where mission status was not `deactive/on-hold` (optional)

---

## 7) RBAC & Validation

- Students: mark own attendance for today (and within grace window)
- Mentors: mark for students in their mission/groups
- Admins: mark anywhere; perform bulk operations
- Validation pipeline:
  - Check membership in `MissionStudentV2`
  - Enforce `date >= startedAt`
  - Enforce unique per-day constraint
  - Capture `mentorshipGroupId` snapshot and `markedBy`

---

## 8) Analytics & Reporting

- Student: trend, streaks, monthly calendar, comparison to cohort
- Group: daily present count, average attendance rate, variance, outliers
- Mission: attendance distribution, trends, anomaly detection (sudden drops)
- Exports: CSV of logs and summaries by range

---

## 9) Migration & Backfill

- Create `AttendanceLogV2` collection
- No required changes to existing documents
- Backfill policy (optional):
  - For students with `startedAt` in the past, either leave historical days empty or auto-mark as `absent` per policy

---

## 10) Delivery Plan

- Phase A: Models & Endpoints
  - Add `AttendanceLogV2` model and indexes
  - Implement mark, bulk-mark, logs, and summaries endpoints
  - Unit tests for validation and summaries

- Phase B: UI
  - Student check-in widget; Mentor bulk marking; Admin dashboards
  - Empty states and error handling

- Phase C: Jobs & Analytics
  - Nightly derivation job; mission/group aggregates
  - Reports and CSV export

---

## 11) Open Questions / Config Options

- Should weekends be excluded by default? (Recommend: configurable at mission level)
- Allow backdating by student? (Recommend: student no, mentor/admin yes within 7 days)
- Excused logic: does excused count toward rate? (Recommend: exclude from denominator by default)

---

### Key Principle
All attendance is counted from when the student joined the mission: `MissionStudentV2.startedAt` is the lower bound for eligibility and summaries.


