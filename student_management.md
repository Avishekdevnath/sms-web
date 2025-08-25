# Build Feature: Student Enrollment & Management (Admin/Manager/Dev/SRE)

You are an AI pair programmer. Implement a **feature module** (not a full project) that plugs into an existing Node/Next codebase using **Mongoose** with the provided models. The feature covers: upload → validate → review → approve → enroll → confirm/invite → activate → manage → trash/restore. Keep boundaries clean so it can be mounted under existing routing.

**Target stack (assume existing app):** Next.js/React frontend with API routes (or Express router) + TypeScript + Mongoose. UI: **Tailwind + shadcn/ui**. No icons for primary actions; single-word, rounded buttons.

**Media**: Use **Cloudinary** for image storage (profile pictures, batch images if any).

## UX principles

* Buttons are **single words**, **rounded**, **not square blocks**, text-first, no icons in primary actions.
* Copy is short and clear. No buzzwords.
* Manager, Admin, Dev, SRE have consistent UX and role-based capabilities.
* Inputs have inline validation and helpful messages.
* Fast keyboard navigation and accessible components (ARIA, focus states, semantic HTML).

## Roles & permissions

Use existing `User.role` enum values: `admin | developer | manager | sre | mentor | student`.

* **Admin**: full access.
* **Manager**: enrollments, invites, profile activation, suspend/ban/unban.
* **Developer**: read-only lists, can validate uploads, export.
* **SRE**: read-only plus audit/health.
* **Mentor**: read-only active students.

Create a small guard helper `can(user, action)` with actions:
`student.read, student.create, student.enroll, student.invite, student.activate, student.update, student.suspend, student.ban, student.delete, student.restore, student.export, audit.read`.

## Global navigation

* **Overview** (dashboard & statistics)
* **Students** (menu)

  * **Add**
  * **Confirm**
  * **All**
  * **Trash**
  * **Database** (advanced view + exports)

## State model (mapped to existing fields)

No new Student model. Use `User` + `StudentProfile`:

* **PENDING\_UPLOAD**: staging rows exist in a temporary collection, not yet users.
* **VALIDATED**: staging rows pass validators.
* **APPROVED**: flagged for enrollment.
* **ENROLLED**: `User` created with `role: "student"`, `mustChangePassword: true`, `isActive: true`, `profileCompleted: false`.
* **INVITED**: `User.invitedAt` set; email sent.
* **ACTIVE**: `User.profileCompleted = true` and required `StudentProfile` fields present; set `completedAt`.
* **SUSPENDED/BANNED**: set `User.isActive = false` (store reason in audit); optional `bannedAt` field in a lightweight sidecar collection.
* **DELETED**: soft delete via `User.deletedAt` and `deletedBy`.

Record transitions in an `AuditLog` collection.

## Overview page

**Route**: `/overview`

* Tiles: Total Students, Active, Pending Confirmation, Suspended, Banned, Deleted.
* Charts: Enrollments by batch, Activation rate, Weekly sign-ins.
* Quick actions (single-word buttons): `Add`, `Validate`, `Enroll`, `Confirm`, `Invite`.

## Students → Add flow

**Route**: `/students/add`

### 1) Upload/Type

* Two tabs: `Type` and `Upload`.
* **Type**: textarea accepts one email per line; required **Batch** dropdown (must select or create batch).
* **Upload**: CSV/TSV with a single column `email`. Show sample format and size limit. Required **Batch** dropdown.
* Action buttons: `Validate` (primary), `Clear` (secondary).

Validation rules:

* Email regex syntax, lowercase normalization, trim.
* Deduplicate within the submission and against existing users/students.
* Show a results table with columns: Email, In Submission?, In System?, Error.
* If any invalid, disable `Approve` and show count.

### 2) Review & Approve

* After `Validate`, show summary: total, valid, duplicates, invalid.
* Manager/Admin can press `Approve` to move to `APPROVED` for this batch.

### 3) Enroll

* Button: `Enroll`. For each approved email:

  * Create `user` (if not exists), generate `student_id` (e.g., `S-YYYYMM-####`), optional `user_id` is the auth id.
  * Set `temp_password` (stored hashed), `password_set_at = null`.
  * Create `student_profile` with status `ENROLLED`.
* Show enroll results table. Errors are retryable per row.

## Students → Confirm page

**Route**: `/students/confirm`

* Lists accounts with statuses `APPROVED` or `ENROLLED` that are **not ACTIVE**.
* Columns: Email, Student ID, Batch, Status, Last Invite At, Attempts.
* Row actions: `Invite`, `Activate`, `Undo`.
* Bulk actions: `Invite`, `Activate`.

**Invite** sends templated email with temporary password login link; token expires (e.g., 72h). Store `invite_token`, `invite_expires_at`.

**Activate** options:

* **Self-activation**: user logs in with temp password, must complete profile fields: `firstName`, `lastName`, `username`, `phone`, `profilePicture`. Then status → `ACTIVE`.
* **Admin activation**: Admin/Manager can fill missing fields and press `Activate` to mark `ACTIVE`.

**Profile picture upload (Cloudinary)** during activation:

* Frontend uses a signed upload (unsigned optional) to Cloudinary.
* Store `secure_url` and `public_id` on `User.profilePicture` (URL) and keep `public_id` alongside (either in the same field via structured string or a new optional field).
  **Route**: `/students`
* Shows all **ACTIVE** students by default.
* Controls: search input (`email`, `name`, `student_id`), `Filter` (Batch, Status, Date ranges), `Sort` (Name, Date, Batch, Status), `Export`.
* Row actions: `Suspend`, `Ban`, `Unban`, `Edit`.
* Bulk actions: `Suspend`, `Ban`, `Unban`, `Export`.

## Students → Trash page

**Route**: `/students/trash`

* Shows soft-deleted students.
* Row actions: `Restore`, `Delete` (hard delete).
* Bulk actions: `Restore`, `Delete`.
* Safeguards: confirm modals. Deleting removes PII except required audit keys.

## Database page (advanced)

**Route**: `/students/database`

* Read-only table for SRE/Dev: joins across users/students/batches.
* `Export` CSV/Parquet, with column selection.

## Components to implement

* `BatchSelect` (uses `EnrollmentBatch`): create/select batch; shows counts.
* `UploadDropzone` with CSV parser (single `email` column); preview table.
* `ValidationResultsTable` for staging rows.
* `StudentsTable` built on server-side pagination of `User` + `StudentProfile` join.
* `ImageUploader` for Cloudinary (drag & drop + paste), supports crop/preview, enforces max size and types; returns `{ url, publicId, width, height }`.
* Confirm dialogs: invite, delete, restore, activate.
* `RoleGuard` to hide/disable unauthorized actions.

### UI pages/routes (mountable)

* `/overview` (dashboard & stats)
* `/students/add` (Type/Upload → Validate → Approve → Enroll)
* `/students/confirm` (Invite/Activate pending)
* `/students` (All active + search/filter/sort/bulk)
* `/students/trash` (soft-deleted)
* `/students/database` (advanced read-only join; export)

## Validation & constraints

* Email regex + normalization (lowercase, trim); forbid duplicates within submission and against `User.email`.
* Batch selection **required** before validation/enroll.
* Temp passwords: 12+ chars, complexity; store **only hash**; set `mustChangePassword: true`.
* Activation requires **StudentProfile** fields: `firstName`, `lastName`, `username`, `phone`, and **Cloudinary** `profilePicture` (store `secure_url`; keep `public_id` for lifecycle ops). Set `User.profileCompleted = true` and `StudentProfile.completedAt`.
* Admin activation path allowed if fields present; else block.
* On soft delete, keep profile image. On hard delete, call Cloudinary `destroy` with saved `public_id`.
* Soft delete must not erase `AuditLog` records.

## Search, filter, sort

* Full-text search over `email`, `studentId`, `firstName`, `lastName`.
* Filters: `batch`, `status`, `createdAt` range.
* Sort by any column; default `createdAt desc`.
* Export respects current filters.

## Audit & observability

* Every state change writes to `AuditLog` with before/after.
* Include actor id and role in logs.
* Add lightweight health page `/health/students` returning counts by status.
* Log Cloudinary errors with request id; surface non-fatal toasts for retries.

## Error & empty states

* Friendly empty states with next steps.
* Row-level retry for transient failures (email send, user create).
* Confirm modals before destructive actions.

## Accessibility & performance

* Keyboard accessible tables and dialogs.
* Server-side pagination and filtering.
* Debounced search.
* Image uploads: client-side resize (optional) before Cloudinary to reduce payload; accept `image/jpeg`, `image/png`, `image/webp`; limit 2MB (configurable).

## Button text (single words)

* `Upload`, `Validate`, `Review`, `Approve`, `Enroll`, `Confirm`, `Invite`, `Activate`, `Search`, `Filter`, `Export`, `Suspend`, `Ban`, `Unban`, `Edit`, `Delete`, `Restore`, `Clear`.

## Acceptance criteria

1. I can upload a CSV with only `email`, pick a batch, click `Validate`, and see invalids/dupes.
2. I can `Approve` valid staging rows and then `Enroll` to create `User` + `StudentProfile` with generated `userId` and temp password.
3. I can see non-active students in **Confirm** and send `Invite` emails; `invitedAt` updates.
4. A student can log in with a temp password, is forced to change it, completes profile fields, and becomes `ACTIVE`.
5. Admin/Manager can manually fill required profile fields and `Activate`.
6. **All** shows active students with search/filter/sort/export and bulk `Suspend/Ban/Unban`.
7. **Trash** supports soft delete, bulk delete, restore, and confirmation modals.
8. All transitions write an `AuditLog` with actor, before/after snapshots, and timestamps.
9. Buttons are single-word, rounded, text-first; no icons on primaries; copy is concise.

## Nice-to-haves (if time allows)

* Rate limits on invite sends.
* Batch-level dashboards and quick filters.
* Import progress notifier with background job queue for large files.
* Cloudinary eager transformations for thumbnails; placeholder blurhash.

---

**Deliverables**

* Routes, components, and API handlers per above.
* **Mongoose** schemas for `EnrollmentBatch`, `StagingEmail`, `AuditLog` (lightweight) and any minimal field additions.
* Cloudinary integration: env config, server upload-signature route, client uploader, and hard-delete cleanup.
* Seed script to create roles, a sample batch, and fake students.
* Basic unit tests for validators and API endpoints (including upload signature route).
* README describing setup and flows, including Cloudinary env and usage.

### Cloudinary integration details

* **Env**: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
* **Server**: `/api/media/sign` returns `{ timestamp, signature, apiKey, cloudName, folder }` using `cloudinary.v2.utils.api_sign_request`.
* **Client**: use the signature with `fetch('https://api.cloudinary.com/v1_1/{cloudName}/auto/upload', { method: 'POST', body: FormData(...) })`.
* **Security**: do not expose API secret; restrict folder (e.g., `sims/students/{batchId}`) and set upload presets if preferred.
* **Lifecycle**: on hard delete, call `cloudinary.v2.uploader.destroy(publicId)`; keep soft-deleted images by default.
* **CDN**: store `secure_url` for display; generate sized variants (e.g., 128x128 thumb) via Cloudinary transformations at render time.
