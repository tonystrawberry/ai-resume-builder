# Research: Job Application Tracker

**Feature**: `003-job-applications`  
**Date**: 2026-07-20

## Decision 1: Use a dedicated `JobApplication` data model with optional foreign keys

- **Decision**: Add a first-class `JobApplication` entity owned by `User`, including required `title`, optional metadata fields, status enum, and optional references to `MasterResumeProfile` and a future cover-letter id.
- **Rationale**: Tracking behavior (status progression, delete lifecycle, sort by recency) is application-centric and does not fit inside existing resume profile JSON structures without creating update and query complexity.
- **Alternatives considered**:
  - Store applications inside `MasterResumeProfile.data` JSON: rejected because one user can have multiple resumes and applications should not be tightly coupled to any single resume profile.
  - Reuse `SharedResumeLink` as proxy application entries: rejected because sharing/export lifecycle differs from job-tracking lifecycle.

## Decision 2: Keep cover-letter support as placeholder linkage only

- **Decision**: Include `coverLetterId` as an optional nullable field and expose UI/API behavior that gracefully handles "coming soon" until cover-letter resources exist.
- **Rationale**: User explicitly requested optional cover-letter support but deferred full cover-letter resource definition. Placeholder linkage keeps forward compatibility without inflating v1 scope.
- **Alternatives considered**:
  - Omit cover-letter field entirely: rejected because it would require breaking API or migration churn when cover-letter feature lands.
  - Implement full cover-letter CRUD now: rejected as out of scope and likely to delay core application-list delivery.

## Decision 3: Model status as constrained enum, manually editable

- **Decision**: Use fixed statuses: `interested`, `applied`, `interviewing`, `offer`, `rejected`, `withdrawn`, with default `interested`.
- **Rationale**: Provides immediate tracking value and supports list scanning success criteria while remaining simple for v1.
- **Alternatives considered**:
  - Free-text status: rejected due to inconsistent analytics and UI filtering potential.
  - Highly granular ATS-style stages: rejected to avoid unnecessary complexity for first release.

## Decision 4: Follow existing App Router patterns for API + page composition

- **Decision**: Implement REST-style authenticated routes under `/api/applications` and `/api/applications/[applicationId]`; build UI with server page + client component pattern used by `resumes`.
- **Rationale**: Consistency with existing codebase lowers implementation risk, test burden, and onboarding cost.
- **Alternatives considered**:
  - Server Actions only: rejected because existing CRUD patterns in app rely on route handlers.
  - Separate admin/service layer: rejected as premature for current repository size and scope.

## Decision 5: Enforce per-user authorization at query boundary

- **Decision**: Every read/write/delete operation filters by both `id` and `userId` derived from authenticated session.
- **Rationale**: FR-010 and SC-004 require strict ownership isolation and non-disclosure.
- **Alternatives considered**:
  - UI-only authorization checks: rejected because server-side route protection is mandatory.
  - Global middleware ownership checks: rejected because ownership is resource-specific and best enforced in each query.
