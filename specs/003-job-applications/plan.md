# Implementation Plan: Job Application Tracker

**Branch**: `003-job-applications` | **Date**: 2026-07-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-job-applications/spec.md`

## Summary

Add an authenticated application-tracking area where users can create, view, edit, and delete job applications, optionally linking each application to an existing resume and reserving an optional cover-letter association for a future feature. The implementation extends the existing full-stack Next.js app with a new `JobApplication` domain model, secured CRUD API routes, and an applications UI flow consistent with the current resumes workspace pattern.

## Technical Context

**Language/Version**: TypeScript 5.x (strict), Node.js 20+

**Primary Dependencies**: Next.js App Router, React, Prisma ORM, Auth.js session auth, Zod for server-side validation

**Storage**: PostgreSQL via Prisma (`prisma/schema.prisma`)

**Testing**: Vitest for unit/integration coverage and route-level behavior checks; existing app smoke checks for end-to-end flows

**Target Platform**: Web application deployed on Vercel-compatible Node runtime

**Project Type**: Full-stack web app (single Next.js repository)

**Performance Goals**: Application list initial load under 2 seconds for typical users (<100 records); create/edit/delete interactions complete within one request-response cycle and update list state immediately

**Constraints**: Per-user data isolation is mandatory; no cross-user access leakage; cover letter is link-only placeholder (no authoring); stay consistent with existing `resumes` UX patterns

**Scale/Scope**: Initial release supports personal tracking workloads (0-500 applications per user), one optional linked resume per application, zero or one optional cover letter reference

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The constitution file remains an unfilled template, so there are no enforceable project-specific gates yet. This plan enforces practical gates from the existing codebase and spec quality standards.

| Gate | Status | Notes |
|------|--------|-------|
| Spec coverage (P1-P3, FR-001..FR-017) | PASS | Plan artifacts map to all required behaviors |
| Security and ownership boundaries | PASS | CRUD routes scoped by session user id |
| Simplicity / minimal scope | PASS | Single new domain model + focused UI; future features deferred |
| Constitution-defined mandatory principles | N/A | No ratified principles found in constitution template |

**Post-design re-check**: PASS. Phase 1 artifacts keep implementation in a single app boundary, avoid premature abstractions, and explicitly preserve future cover-letter extensibility.

## Project Structure

### Documentation (this feature)

```text
specs/003-job-applications/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── api.md
└── tasks.md             # Created by /speckit-tasks
```

### Source Code (repository root)

```text
app/
├── (app)/
│   ├── applications/
│   │   ├── page.tsx
│   │   └── applications-client.tsx
│   └── layout.tsx
├── api/
│   └── applications/
│       ├── route.ts
│       └── [applicationId]/route.ts
└── ...

components/
├── ui/
└── ...

lib/
├── db.ts
├── auth.ts
└── ...

prisma/
└── schema.prisma
```

**Structure Decision**: Keep a single-project App Router structure and mirror the existing `resumes` area patterns to reduce cognitive overhead. Place application CRUD routes under `app/api/applications`, UI under `app/(app)/applications`, and persist through Prisma with migration updates in `prisma/`.

## Complexity Tracking

No constitution violations require justification at this stage.
