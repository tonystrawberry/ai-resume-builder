# Research: AI Resume Builder

**Feature**: `002-ai-resume-builder` | **Date**: 2026-07-18

All Technical Context unknowns resolved below. Decisions feed `data-model.md`, `contracts/`, and `quickstart.md`.

---

## 1. Application architecture

**Decision**: Single Next.js App Router monolith with Route Handlers for APIs, Server Components for data-loaded pages, and Client Components for chat/preview interactivity.

**Rationale**: Matches mandated stack; minimizes deployment/ops surface; Auth.js, Prisma, and AI SDK are first-class on this model.

**Alternatives considered**:
- Separate Nest/FastAPI backend — rejected for v1 (extra latency, auth duplication, no constitution requiring service split)
- Edge-only runtime for all routes — rejected; Prisma + PDF generation need Node runtime for several paths

---

## 2. Authentication & GitHub data access

**Decision**: Auth.js v5 with GitHub provider + Prisma adapter. Sign-in uses GitHub OAuth; the same `Account` record stores `access_token` for GitHub API import. Session strategy: database sessions (or JWT if Edge middleware constraints force it — prefer DB sessions for simpler token refresh access).

**Rationale**: One OAuth consent covers identity + GitHub ETL; Prisma adapter aligns with required ORM; Auth.js Account model already stores provider tokens.

**Alternatives considered**:
- Separate GitHub App install for data — stronger for orgs, heavier for individual MVP
- Email/password auth + separate GitHub connect — more UX steps for v1 primary path

**Notes**: Request GitHub OAuth scopes sufficient for public profile + repos (e.g. `read:user`, `user:email`, and repo read as needed). Do not enable `allowDangerousEmailAccountLinking` unless a second trusted IdP is added later.

---

## 3. LinkedIn ingest via third-party connector

**Decision**: Introduce a `LinkedInConnector` interface in `lib/etl/linkedin.ts` with a single production adapter (default: Proxycurl or equivalent profile API). User explicitly pastes a LinkedIn profile URL (or authorizes the connector’s flow). Store raw response as `SourceSnapshot`, then run LLM extraction.

**Rationale**: Official LinkedIn APIs are restrictive for resume scraping; spec requires an authorized third-party connector; adapter pattern avoids locking the product to one vendor.

**Alternatives considered**:
- Unofficial browser scraping — rejected (ToS/compliance risk; out of scope per spec)
- Skip LinkedIn in v1 — rejected; FR-003 is in scope; adapter can be fixture-backed in local/dev

**Fallback**: Dev/test mode uses fixture JSON so import UX can be built without live connector credits.

---

## 4. Master resume schema & LLM extraction

**Decision**: Canonical `MasterResume` Zod schema in `lib/resume/schema.ts`. Import pipeline: source fetch → optional normalize → `generateObject` (Vercel AI SDK) into `MasterResume` → merge into DB JSON. Completeness scoring is deterministic (rules over LLM).

**Rationale**: Zod schema is shared by Prisma JSON validation, AI structured output, UI forms, and PDF mapping; `generateObject`/`useObject` align with stack constraints.

**Alternatives considered**:
- Pure rule-based mapping without LLM — brittle across noisy LinkedIn/GitHub payloads
- Free-form LLM JSON without schema — fails FR reliability and type safety

---

## 5. Multi-source merge rules

**Decision**: Deterministic merge in `lib/resume/merge.ts`:
- Employment chronology: prefer LinkedIn-derived experience
- Projects/skills signals: prefer GitHub-derived, union skills
- Identity: prefer non-empty user-confirmed > LinkedIn > GitHub
- User-confirmed fields (`provenance: "user"`) never overwritten by re-import without conflict flag

**Rationale**: Matches spec edge-case guidance; keeps merge testable without LLM nondeterminism.

**Alternatives considered**: LLM-only merge — harder to test; risk of silent data loss

---

## 6. Stateful enrichment chat

**Decision**: One `ChatConversation` per master profile. Client: `useChat` with persisted `id` + `initialMessages`. Server: streaming chat route with tools (or structured follow-up) that propose `MasterResume` patches; apply patches only after explicit user confirmation (tool result / UI confirm). Persist UIMessage arrays in PostgreSQL (JSON) after stream end.

**Rationale**: Matches AI SDK persistence guidance; satisfies FR-007–FR-011 and SC-003.

**Alternatives considered**:
- Stateless chat reconstructing from profile only — loses conversational nuance
- Auto-apply every model suggestion — violates FR-010

**Gap prioritization**: `completeness.ts` ranks missing metrics, empty bullets, missing contact; system prompt injects top gaps each turn.

---

## 7. Templates & translation

**Decision**: Template registry maps `templateId` → React preview component + React-PDF document. Locales: store master profile in source language (default EN); on locale change, call translate route to produce/cache a `LocalePresentation` JSON (same shape, translated strings) for preview/export. Do not mutate master profile on translate.

**Rationale**: Spec requires master as source of truth; caching locale presentation avoids re-translating every keystroke.

**Alternatives considered**:
- Full i18n message catalogs for resume content — cannot cover user-generated achievements
- Translate at export only — weaker preview UX for SC/FR-014

---

## 8. PDF export

**Decision**: `@react-pdf/renderer` with template documents sharing the same section mapping as on-screen preview. Export route authenticates user, loads profile + locale presentation + templateId, returns `application/pdf`.

**Rationale**: Works in Node Route Handlers; no headless browser on serverless; template parity with React.

**Alternatives considered**:
- Playwright/Puppeteer HTML→PDF — higher memory/cold-start cost on Vercel
- Client-only print-to-PDF — inconsistent layout/export UX

---

## 9. Testing strategy

**Decision**: Vitest for schema/merge/completeness/ETL mappers; integration tests for import merge + chat patch confirmation with mocked LLM/connector; Playwright for sign-in (mocked), chat confirm→profile update, preview switch, export download smoke.

**Rationale**: Balances speed with coverage of the ETL+chat critical path without flaky live LLM in CI (use recorded fixtures / mock providers).

**Alternatives considered**: E2E-only — too slow/flaky for merge rules; unit-only — misses auth/stream wiring

---

## 10. Hosting & env

**Decision**: Target Vercel + managed PostgreSQL (Neon/Supabase/Vercel Postgres). Secrets: `AUTH_SECRET`, GitHub OAuth, LLM API key / AI Gateway, LinkedIn connector key, `DATABASE_URL`.

**Rationale**: Aligns with Next.js + AI SDK ecosystem; Prisma-friendly.

**Alternatives considered**: Self-hosted Node VM — viable later, not required for v1 plan
