# Tasks: Job Application Tracker

**Input**: Design documents from `/specs/003-job-applications/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/api.md, quickstart.md

**Tests**: Not included as separate TDD phase — not explicitly requested.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Paths follow `plan.md` (Next.js App Router): `app/`, `components/`, `lib/`, `prisma/`.

---

## Phase 1: Setup

**Purpose**: Add the `JobApplication` model to the database and expose it to the application

- [X] T001 Add `ApplicationStatus` enum and `JobApplication` model to `prisma/schema.prisma` with fields per data-model.md (id, userId, title, description, companyName, jobUrl, status, appliedAt, linkedResumeId, coverLetterId, createdAt, updatedAt) and add `jobApplications JobApplication[]` relation to `User` model
- [X] T002 Add optional back-relation `jobApplications JobApplication[]` on `MasterResumeProfile` for linked resume reference with `onDelete: SetNull` on the foreign key
- [X] T003 Run `prisma migrate dev` to generate the migration and regenerate the Prisma client

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared validation, auth route protection, and navigation entry point required by all user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 [P] Create Zod validation schemas for application create and update payloads in `lib/applications/schema.ts` (title required non-empty ≤200 chars, description ≤5000, companyName ≤200, jobUrl ≤2000 URL-like, status enum, appliedAt ISO date, linkedResumeId optional string, coverLetterId optional string)
- [X] T005 [P] Add `/applications/:path*` to the auth middleware matcher array in `middleware.ts` and to the `authorized` callback path check in `lib/auth.config.ts`
- [X] T006 Add "Applications" nav link to the `links` array in `app/(app)/layout.tsx`

**Checkpoint**: Navigation shows Applications link; unauthenticated users are redirected; validation schemas ready for route handlers

---

## Phase 3: User Story 1 - View and Browse Applications (Priority: P1) 🎯 MVP

**Goal**: Signed-in user sees a list of their applications ordered by recency, with title, status, company name, and applied date visible

**Independent Test**: Sign in → open `/applications` → see seeded applications in order; empty state shown when no applications exist

### Implementation for User Story 1

- [X] T007 [US1] Implement `GET /api/applications` route handler in `app/api/applications/route.ts` — query `JobApplication` where `userId` matches session user, order by `updatedAt desc`, include linked resume title via relation, return JSON per contracts/api.md
- [X] T008 [US1] Create server page `app/(app)/applications/page.tsx` that fetches applications server-side and passes to client component
- [X] T009 [US1] Build `app/(app)/applications/applications-client.tsx` with list view showing title, status badge, company name, applied date, and updated-at for each application; show empty state with CTA when list is empty

**Checkpoint**: User can browse their applications list; empty state guides first-time users

---

## Phase 4: User Story 2 - Create a New Application (Priority: P1)

**Goal**: User creates an application with required title and optional fields; it appears immediately in the list

**Independent Test**: Click create → enter title only → save → application appears in list; validation rejects empty title

### Implementation for User Story 2

- [X] T010 [US2] Implement `POST /api/applications` route handler in `app/api/applications/route.ts` — validate body with Zod schema from T004, verify `linkedResumeId` ownership if provided, create record with default status `interested`, return created application
- [X] T011 [US2] Add create-application dialog/form to `app/(app)/applications/applications-client.tsx` with title (required), description, company name, job URL, applied date, status selector, and resume picker; submit to POST endpoint; refresh list on success
- [X] T012 [P] [US2] Implement resume picker component that fetches user's resumes from `GET /api/profile` (existing endpoint returns resumes list) for the linked resume selector within the create/edit form

**Checkpoint**: Users can create applications; validation prevents empty titles; linked resume ownership enforced

---

## Phase 5: User Story 3 - Edit and Update an Application (Priority: P1)

**Goal**: User opens an application, edits any field including status, and sees changes reflected in list

**Independent Test**: Open application → change status and company → save → list reflects updates

### Implementation for User Story 3

- [X] T013 [US3] Implement `GET /api/applications/[applicationId]` route handler in `app/api/applications/[applicationId]/route.ts` — fetch by id and userId, return full application detail or 404
- [X] T014 [US3] Implement `PATCH /api/applications/[applicationId]` route handler in `app/api/applications/[applicationId]/route.ts` — validate partial body with Zod, verify linkedResumeId ownership if changed, update record, return updated application
- [X] T015 [US3] Add edit mode to `app/(app)/applications/applications-client.tsx` — clicking an application opens inline edit form or detail panel with all fields editable; submit PATCH on save; update list state optimistically

**Checkpoint**: Full CRUD minus delete is functional; status changes visible in list without page reload

---

## Phase 6: User Story 4 - Link a Resume to an Application (Priority: P2)

**Goal**: User associates or removes a resume link from an application; linked resume title shown in detail and list

**Independent Test**: Edit application → select resume → save → resume title appears; remove link → title disappears; delete a linked resume → application shows unavailable indicator

### Implementation for User Story 4

- [X] T016 [US4] Enhance list item in `app/(app)/applications/applications-client.tsx` to show linked resume title when present and a small indicator when linked resume is unavailable (id set but join returns null)
- [X] T017 [US4] Add "Open resume" action link in application detail that navigates to `/workspace/{linkedResumeId}` when resume is available
- [X] T018 [US4] Handle graceful null display when `linkedResumeId` references a deleted resume — show "Resume unavailable" label in both list and detail

**Checkpoint**: Resume linking works end-to-end; deleted resume does not break application display

---

## Phase 7: User Story 5 - Reserve Cover Letter Association (Priority: P3)

**Goal**: Cover letter field exists on the model and UI surfaces a "coming soon" indicator without blocking save

**Independent Test**: View/edit application → cover letter section shows informational "coming soon" state; application saves normally

### Implementation for User Story 5

- [X] T019 [US5] Add "Cover letter" section to the edit form in `app/(app)/applications/applications-client.tsx` that displays "Coming soon" disabled state; field is not editable in v1 but shows `coverLetterState: "coming_soon"` from API response

**Checkpoint**: Cover letter placeholder is visible and non-blocking

---

## Phase 8: User Story 6 - Delete an Application (Priority: P2)

**Goal**: User deletes an application with confirmation; linked resume remains unaffected

**Independent Test**: Delete application with linked resume → application gone from list → resume still in library

### Implementation for User Story 6

- [X] T020 [US6] Implement `DELETE /api/applications/[applicationId]` route handler in `app/api/applications/[applicationId]/route.ts` — verify ownership, delete record, return success
- [X] T021 [US6] Add delete action with confirmation dialog (using existing `AlertDialog` component) in `app/(app)/applications/applications-client.tsx`; remove application from local state on success

**Checkpoint**: Delete works; resume library unaffected

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final UX and robustness improvements

- [X] T022 [P] Add "Open job posting" external link button in application detail that opens `jobUrl` in new tab (FR-014) in `app/(app)/applications/applications-client.tsx`
- [ ] T023 [P] Validate quick-start smoke test from `specs/003-job-applications/quickstart.md` end-to-end manually
- [X] T024 Add loading and error states for API calls in `app/(app)/applications/applications-client.tsx`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 migration completing
- **User Stories (Phase 3+)**: All depend on Phase 2 completion
  - US1 (list) is prerequisite for US2–US6 (need the page to exist)
  - US2 (create) and US3 (edit) can proceed in parallel after US1
  - US4 (link resume) extends US3
  - US5 (cover letter placeholder) can proceed after US3
  - US6 (delete) can proceed after US1
- **Polish (Phase 9)**: After all user stories

### User Story Dependencies

- **US1 (P1)**: After Foundational — no story dependencies
- **US2 (P1)**: After US1 (needs list page)
- **US3 (P1)**: After US2 (needs create to have records to edit)
- **US4 (P2)**: After US3 (extends edit)
- **US5 (P3)**: After US3 (extends edit form)
- **US6 (P2)**: After US1 (needs list page for delete action)

### Parallel Opportunities

- T004, T005, T006 can all run in parallel within Phase 2
- T012 (resume picker) can be built in parallel with T010/T011
- T016, T017, T018 in Phase 6 can run in parallel
- T022, T023, T024 in Phase 9 can run in parallel

---

## Parallel Example: Phase 2 (Foundational)

```bash
# All foundational tasks target different files:
Task: "Zod schemas in lib/applications/schema.ts"
Task: "Auth middleware in middleware.ts + lib/auth.config.ts"
Task: "Nav link in app/(app)/layout.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup (migration)
2. Complete Phase 2: Foundational (auth, nav, schemas)
3. Complete Phase 3: US1 (list view)
4. Complete Phase 4: US2 (create)
5. **STOP and VALIDATE**: User can create and browse applications

### Incremental Delivery

1. Setup + Foundational → schema ready, nav visible
2. US1 → list page working (empty state)
3. US2 → create flow working → MVP demo-able
4. US3 → edit/status updates → core tracking functional
5. US6 → delete → full CRUD
6. US4 → resume linking → product integration
7. US5 → cover letter placeholder → forward compatibility
8. Polish → edge states, external links, validation

---

## Notes

- [P] = different files, no incomplete-task dependencies
- [USn] maps to spec user stories for traceability
- Existing `resumes-client.tsx` patterns (Dialog, AlertDialog, fetch+setState) should be mirrored for consistency
- Cover letter field stored in DB but UI-disabled until cover letter resource ships
- Commit after each phase or logical task group
