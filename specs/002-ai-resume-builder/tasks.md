---
description: "Task list for AI Resume Builder implementation"
---

# Tasks: AI Resume Builder

**Input**: Design documents from `/specs/002-ai-resume-builder/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Not included as a separate TDD phase — the feature spec does not explicitly require test-first tasks. Add Vitest/Playwright coverage during Polish if desired.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Paths follow `plan.md` (Next.js App Router at repository root): `app/`, `components/`, `lib/`, `prisma/`, `templates/`, `tests/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Scaffold the Next.js app and shared tooling

- [x] T001 Initialize Next.js 14+ App Router TypeScript project at repository root with Tailwind (`package.json`, `tsconfig.json` strict, `next.config.ts`, `app/layout.tsx`, `app/globals.css`)
- [x] T002 Install core dependencies in `package.json`: `next-auth@beta`, `@auth/prisma-adapter`, `prisma`, `@prisma/client`, `zod`, `ai`, `@ai-sdk/react`, `@ai-sdk/openai`, `@react-pdf/renderer`
- [x] T003 [P] Configure ESLint/Prettier and TypeScript strict options in `tsconfig.json` / `.eslintrc` (or `eslint.config.mjs`)
- [x] T004 [P] Initialize shadcn/ui and add base primitives under `components/ui/`
- [x] T005 [P] Create `.env.example` with `DATABASE_URL`, `AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, `OPENAI_API_KEY`, `LINKEDIN_CONNECTOR_API_KEY` per `quickstart.md`
- [x] T006 Create directory scaffolding per plan: `app/(marketing)/`, `app/(app)/`, `app/api/`, `components/{auth,chat,import,preview,export}/`, `lib/{resume,etl,ai,pdf}/`, `templates/{classic,modern}/`, `tests/{unit,integration,e2e}/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Auth, database, master schema, and empty profile APIs required by every story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T007 Define Prisma schema for Auth.js models (`User`, `Account`, `Session`, `VerificationToken`) plus domain models (`ConnectedSource`, `SourceSnapshot`, `MasterResumeProfile`, `ChatConversation`, `LocalePresentation`, `ExportArtifact`) in `prisma/schema.prisma` per `data-model.md`
- [x] T008 Run initial migration and generate client (`prisma/migrations/`, `lib/db.ts` Prisma singleton)
- [x] T009 [P] Implement Zod `MasterResume` schema mirroring `contracts/master-resume.schema.json` in `lib/resume/schema.ts`
- [x] T010 [P] Implement shared API error helpers (`{ error: { code, message, details? } }`) in `lib/api-error.ts`
- [x] T011 Configure Auth.js v5 with GitHub provider + Prisma adapter in `lib/auth.ts`
- [x] T012 Wire Auth.js route handlers in `app/api/auth/[...nextauth]/route.ts`
- [x] T013 Add session-gated route protection for `app/(app)/*` via `middleware.ts` (or Auth.js `authorized` callback)
- [x] T014 Implement `GET`/`POST` `/api/profile` for fetch/create empty master profile in `app/api/profile/route.ts` (contracts/api.md)
- [x] T015 [P] Implement empty-profile factory + completeness stub returning critical gaps in `lib/resume/empty-profile.ts`
- [x] T016 Build authenticated app shell layout with nav links in `app/(app)/layout.tsx`
- [x] T017 Build marketing landing with GitHub sign-in CTA in `app/(marketing)/page.tsx` and `components/auth/sign-in-button.tsx`

**Checkpoint**: User can sign in with GitHub and create/fetch an empty master profile — story work can begin

---

## Phase 3: User Story 1 - Import Career Data from Social Profiles (Priority: P1) 🎯 MVP

**Goal**: Connect GitHub and/or LinkedIn, run ETL into a structured master resume profile with merge + incompleteness markers

**Independent Test**: Sign in → connect/import GitHub (or fixture) and/or LinkedIn → master profile has ≥2 populated sections; sparse imports still create a profile with gaps

### Implementation for User Story 1

- [x] T018 [P] [US1] Implement GitHub fetch client using Auth.js `Account` access token in `lib/etl/github.ts`
- [x] T019 [P] [US1] Implement `LinkedInConnector` interface + Proxycurl (or fixture) adapter in `lib/etl/linkedin.ts`
- [x] T020 [P] [US1] Add import fixtures for local/dev without live APIs in `lib/etl/fixtures/github.json` and `lib/etl/fixtures/linkedin.json`
- [x] T021 [US1] Implement LLM extraction `generateObject` → `MasterResume` in `lib/etl/extract.ts`
- [x] T022 [US1] Implement deterministic multi-source merge rules in `lib/resume/merge.ts` (LinkedIn employment preference, GitHub projects/skills, never overwrite `provenance: user`)
- [x] T023 [US1] Implement gap detection / completeness scoring in `lib/resume/completeness.ts`
- [x] T024 [US1] Persist `ConnectedSource` + append-only `SourceSnapshot` helpers in `lib/etl/persist.ts`
- [x] T025 [US1] Implement `POST /api/import/github` in `app/api/import/github/route.ts` (fetch → snapshot → extract → merge → update profile)
- [x] T026 [US1] Implement `POST /api/import/linkedin` in `app/api/import/linkedin/route.ts` accepting `{ profileUrl }`
- [x] T027 [US1] Implement `GET /api/sources` in `app/api/sources/route.ts`
- [x] T028 [US1] Build onboarding page to start import or chat-only path in `app/(app)/onboarding/page.tsx`
- [x] T029 [P] [US1] Build import UI controls (GitHub import button, LinkedIn URL form, status/warnings) in `components/import/import-panel.tsx`
- [x] T030 [US1] Show post-import profile summary + incomplete-section prompts linking to workspace in `components/import/import-result.tsx`

**Checkpoint**: US1 independently delivers import → populated/sparse master profile without requiring chat, preview, or export

---

## Phase 4: User Story 2 - Enrich Resume Through Stateful Chat (Priority: P1)

**Goal**: Stateful chat asks gap questions; user-confirmed answers update master JSON; history persists across sessions

**Independent Test**: Seed/import sparse profile → chat → confirm ≥1 achievement/metric → profile updates with `provenance: user` → refresh restores messages + profile

### Implementation for User Story 2

- [x] T031 [P] [US2] Configure AI model provider helpers in `lib/ai/models.ts`
- [x] T032 [US2] Implement enrichment system prompt, gap injection, and proposed-patch tools in `lib/ai/enrich-chat.ts`
- [x] T033 [US2] Implement `POST /api/chat` streaming UI message endpoint with persistence on stream end in `app/api/chat/route.ts`
- [x] T034 [US2] Implement `GET /api/chat` to load `ChatConversation.messages` for the user’s profile in `app/api/chat/route.ts` (or `app/api/chat/[id]/route.ts` if split)
- [x] T035 [US2] Implement `PATCH /api/profile` with optimistic `version` + `confirmAiSuggestions` gate in `app/api/profile/route.ts` (FR-010)
- [x] T036 [US2] Ensure one `ChatConversation` per `MasterResumeProfile` create/load helper in `lib/ai/conversation.ts`
- [x] T037 [US2] Build workspace page with chat + live completeness panel in `app/(app)/workspace/page.tsx`
- [x] T038 [P] [US2] Build chat UI with `useChat` (persisted id + initialMessages) in `components/chat/enrichment-chat.tsx`
- [x] T039 [P] [US2] Build confirm/reject UI for proposed resume patches in `components/chat/patch-confirm.tsx`
- [x] T040 [US2] Wire skip/decline handling so assistant advances to next gap without blocking in `lib/ai/enrich-chat.ts` + chat UI

**Checkpoint**: US2 works with a fixture/seeded profile even if LinkedIn import is unavailable; chat + confirmed patches persist

---

## Phase 5: User Story 3 - Preview Resume on Exportable Templates (Priority: P2)

**Goal**: Render master profile into selectable visual templates with live preview after chat/import updates

**Independent Test**: With a filled (or fixture) profile, open preview, switch `classic` ↔ `modern`, confirm content reflects latest master data

### Implementation for User Story 3

- [x] T041 [P] [US3] Implement template registry (`classic`, `modern`) in `lib/resume/templates.ts`
- [x] T042 [P] [US3] Build classic on-screen preview component in `templates/classic/preview.tsx`
- [x] T043 [P] [US3] Build modern on-screen preview component in `templates/modern/preview.tsx`
- [x] T044 [US3] Implement `PATCH /api/preview` for `selectedTemplateId` / `selectedLocale` in `app/api/preview/route.ts`
- [x] T045 [US3] Build preview page with template switcher in `app/(app)/preview/page.tsx`
- [x] T046 [P] [US3] Build template switcher + resume frame UI in `components/preview/template-switcher.tsx` and `components/preview/resume-frame.tsx`
- [x] T047 [US3] Ensure workspace/profile updates invalidate client preview cache so latest master data renders in `app/(app)/preview/page.tsx`

**Checkpoint**: US3 independently previews any valid master profile; does not require export or translation yet

---

## Phase 6: User Story 4 - Translate and Export the Resume (Priority: P2)

**Goal**: Locale presentation (cached) + downloadable PDF export with incomplete-section warnings

**Independent Test**: Select non-source locale → preview updates → export PDF downloads; re-export after locale change without re-import

### Implementation for User Story 4

- [x] T048 [US4] Implement LLM (or structured) translation of master text fields in `lib/ai/translate.ts`
- [x] T049 [US4] Implement `POST /api/translate` creating/updating `LocalePresentation` keyed by `(profileId, locale)` + `sourceVersion` in `app/api/translate/route.ts`
- [x] T050 [P] [US4] Implement React-PDF classic document in `templates/classic/document.tsx` and `lib/pdf/render.tsx`
- [x] T051 [P] [US4] Implement React-PDF modern document in `templates/modern/document.tsx`
- [x] T052 [US4] Implement `POST /api/export/pdf` returning `application/pdf` with incomplete-ack rules in `app/api/export/pdf/route.ts` (FR-020)
- [x] T053 [US4] Add locale selector + export controls on preview page in `components/export/export-controls.tsx` and `app/(app)/preview/page.tsx`
- [x] T054 [US4] Show incomplete-section warning modal before export in `components/export/incomplete-warning.tsx`

**Checkpoint**: US4 delivers translate + PDF from an existing profile/template selection

---

## Phase 7: User Story 5 - Sign In and Manage Connected Sources (Priority: P3)

**Goal**: Account workspace clarity + connect/disconnect sources with retention messaging (FR-017)

**Independent Test**: Sign in → see sources → disconnect a source → told profile retained → re-sign-in restores profile/chat/preferences

### Implementation for User Story 5

- [x] T055 [US5] Implement `DELETE /api/sources/{provider}` setting status `disconnected` without deleting master profile in `app/api/sources/[provider]/route.ts`
- [x] T056 [US5] Build settings page listing sources, last import, errors, and disconnect actions in `app/(app)/settings/page.tsx`
- [x] T057 [P] [US5] Build connected-source list + disconnect confirm dialog in `components/import/source-list.tsx`
- [x] T058 [US5] Add sign-out and account summary to app shell / settings in `components/auth/account-menu.tsx`
- [x] T059 [US5] Ensure returning-user redirect lands on workspace/onboarding based on profile presence in `app/(app)/layout.tsx` or `middleware.ts`

**Checkpoint**: US5 completes account/source management UX on top of existing auth + import

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Hardening and cross-story UX quality

- [x] T060 [P] Add user-facing retryable error toasts for import/chat/translate/export failures in `components/ui/` usage across app routes
- [x] T061 [P] Add loading skeletons for onboarding, workspace, and preview in respective `app/(app)/*/page.tsx` files
- [x] T062 Harden re-import conflict behavior (flag conflicts; do not overwrite user-confirmed fields) in `lib/resume/merge.ts`
- [x] T063 Ensure all API routes enforce session ownership checks (profile/chat/export) in `app/api/**/route.ts`
- [x] T064 [P] Document local run steps deltas (if any) in `specs/002-ai-resume-builder/quickstart.md`
- [x] T065 Run end-to-end smoke per `quickstart.md` §6 smoke verification checklist and fix gaps
- [x] T066 [P] Responsive pass for workspace + preview on mobile viewport widths in `app/(app)/workspace/page.tsx` and `app/(app)/preview/page.tsx`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS** all user stories
- **US1 (Phase 3)**: Depends on Foundational — MVP import path
- **US2 (Phase 4)**: Depends on Foundational; works with empty/fixture profile (does not require live LinkedIn). Benefits from US1 data but independently testable with seeds
- **US3 (Phase 5)**: Depends on Foundational + a readable master profile (from US1, US2, or seed)
- **US4 (Phase 6)**: Depends on US3 templates for meaningful export; translation can start after profile exists
- **US5 (Phase 7)**: Depends on Foundational + US1 source records for disconnect UX; auth itself already in Phase 2
- **Polish (Phase 8)**: After desired stories complete

### User Story Dependencies

- **US1 (P1)**: After Foundational — no dependency on other stories
- **US2 (P1)**: After Foundational — independently testable with seeded sparse profile
- **US3 (P2)**: After Foundational — needs profile data (seed OK)
- **US4 (P2)**: Best after US3 (shared template mapping); PDF docs can parallel template preview components
- **US5 (P3)**: After Foundational; disconnect UX best after US1 creates `ConnectedSource` rows

### Within Each User Story

- Libraries/helpers before route handlers
- Route handlers before UI pages
- Story complete before treating next priority as done

### Parallel Opportunities

- Phase 1: T003, T004, T005 in parallel after T001–T002
- Phase 2: T009 || T010; UI shell T016 || T017 after auth routes exist
- US1: T018 || T019 || T020; later T029 || T030 after APIs
- US2: T031 early; T038 || T039 after chat APIs
- US3: T041 || T042 || T043
- US4: T050 || T051 after translate basics
- US5: T057 || T058

---

## Parallel Example: User Story 1

```bash
# After Foundational completes, launch ETL adapters in parallel:
Task: "Implement GitHub fetch client in lib/etl/github.ts"
Task: "Implement LinkedInConnector adapter in lib/etl/linkedin.ts"
Task: "Add import fixtures in lib/etl/fixtures/*.json"

# After extract/merge/completeness exist, APIs then UI:
Task: "POST /api/import/github in app/api/import/github/route.ts"
Task: "POST /api/import/linkedin in app/api/import/linkedin/route.ts"
Task: "GET /api/sources in app/api/sources/route.ts"
```

## Parallel Example: User Story 2

```bash
Task: "Configure AI models in lib/ai/models.ts"
# Then chat persistence + confirm UI in parallel after enrich-chat exists:
Task: "Build enrichment-chat.tsx with useChat"
Task: "Build patch-confirm.tsx for proposed patches"
```

## Parallel Example: User Story 3

```bash
Task: "Template registry in lib/resume/templates.ts"
Task: "Classic preview in templates/classic/preview.tsx"
Task: "Modern preview in templates/modern/preview.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: US1 (GitHub fixture import acceptable for demo)
4. **STOP and VALIDATE** against US1 independent test
5. Demo import → structured profile

### Recommended P1 Slice (US1 + US2)

After MVP validation, immediately add US2 — conversational enrichment is the core product differentiator (both are P1 in spec).

### Incremental Delivery

1. Setup + Foundational → signed-in empty profile
2. US1 → import MVP demo
3. US2 → enrichment demo
4. US3 → visual confidence
5. US4 → translate + PDF outcome
6. US5 → source management polish
7. Phase 8 hardening

### Parallel Team Strategy

1. Team completes Setup + Foundational together
2. Then:
   - Dev A: US1 import ETL
   - Dev B: US2 chat (fixture profile)
   - Dev C: US3 templates (fixture profile)
3. Integrate; US4 follows US3; US5 follows US1 sources

---

## Notes

- [P] = different files, no incomplete-task dependencies
- [USn] maps to spec user stories for traceability
- Prefer fixture-backed import/chat in CI and local dev without connector keys
- Commit after each task or logical group
- Stop at checkpoints to validate story independence
- Avoid auto-applying AI suggestions to master JSON without confirmation (FR-010)
