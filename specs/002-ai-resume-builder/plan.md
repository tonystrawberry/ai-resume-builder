# Implementation Plan: AI Resume Builder

**Branch**: `002-ai-resume-builder` | **Date**: 2026-07-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-ai-resume-builder/spec.md`

## Summary

Build a greenfield AI-powered resume builder as a Next.js App Router application. The core loop is an ETL pipeline attached to a stateful chat: ingest GitHub (OAuth) and LinkedIn (third-party connector) data → LLM extraction into a Zod-validated master resume JSON → gap-filling chat that patches the master JSON with user confirmation → template preview with locale presentation → PDF export. Persistence uses PostgreSQL via Prisma; auth uses Auth.js v5; AI uses Vercel AI SDK (`useChat` + structured object generation).

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), Node.js 20+

**Primary Dependencies**: Next.js 14+ (App Router), Auth.js v5 (`next-auth`), Prisma, Vercel AI SDK (`ai`, `@ai-sdk/react`, `@ai-sdk/openai` or gateway), Zod, Tailwind CSS, shadcn/ui, `@react-pdf/renderer` (PDF), LinkedIn connector SDK/HTTP client (provider-abstracted)

**Storage**: PostgreSQL (Prisma ORM); master resume profile and chat messages as JSON columns with Zod validation at boundaries

**Testing**: Vitest (unit/integration), Playwright (e2e critical paths), Prisma test DB or transactional fixtures

**Target Platform**: Web (Vercel-deployable serverless/Node runtime); mobile-responsive browser

**Project Type**: Full-stack web application (Next.js monolith: UI + Route Handlers)

**Performance Goals**: Import → non-empty profile within 3 minutes (SC-001); template switch perceived <5s (SC-004); PDF export <30s (SC-005); chat stream first token typically <2s under normal load

**Constraints**: Single active master resume per user (v1); user confirmation required before speculative AI content enters master JSON; LinkedIn only via authorized third-party connector; PDF-only export in v1; TypeScript strict; App Router only (no Pages Router)

**Scale/Scope**: Individual job seekers; v1 supports GitHub + LinkedIn ingest, one chat thread per profile, ≥2 templates, ≥2 locales (e.g. EN + JA or EN + FR), PDF export

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Project constitution (`.specify/memory/constitution.md`) is still an unfilled template — **no binding principles are ratified**.

| Gate | Status | Notes |
|------|--------|-------|
| Constitution principles enforced | N/A (placeholder) | Proceed using spec Assumptions + stack constraints |
| Spec alignment | PASS | Plan covers all P1–P3 stories and FRs |
| Complexity justified | PASS | Single Next.js app; no premature multi-service split |
| Security baseline | PASS (design) | Auth-gated APIs; per-user data isolation; OAuth tokens stored via Auth.js Account model; confirmation gate for AI writes |

**Post-design re-check**: Still PASS / N/A. Design stays within one deployable app, clear module boundaries (`lib/etl`, `lib/ai`, `lib/resume`), and contract-first APIs. Recommend filling the constitution before `/speckit-implement` for lasting governance.

## Project Structure

### Documentation (this feature)

```text
specs/002-ai-resume-builder/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md             # Created by /speckit-tasks (not this command)
```

### Source Code (repository root)

```text
app/
├── (marketing)/
│   └── page.tsx                 # Landing / sign-in CTA
├── (app)/
│   ├── layout.tsx               # Authenticated shell
│   ├── onboarding/page.tsx      # Connect sources / start chat-only
│   ├── workspace/page.tsx       # Chat + live completeness
│   ├── preview/page.tsx         # Template + locale preview
│   └── settings/page.tsx        # Connected sources, account
├── api/
│   ├── auth/[...nextauth]/route.ts
│   ├── import/github/route.ts
│   ├── import/linkedin/route.ts
│   ├── profile/route.ts
│   ├── chat/route.ts
│   ├── translate/route.ts
│   └── export/pdf/route.ts
├── layout.tsx
└── globals.css

components/
├── ui/                          # shadcn/ui primitives
├── auth/
├── chat/
├── import/
├── preview/
└── export/

lib/
├── auth.ts                      # Auth.js config
├── db.ts                        # Prisma client
├── resume/
│   ├── schema.ts                # Zod master resume schema
│   ├── completeness.ts          # Gap detection
│   ├── merge.ts                 # Multi-source merge rules
│   └── templates.ts             # Template registry
├── etl/
│   ├── github.ts
│   ├── linkedin.ts              # Connector adapter interface
│   └── extract.ts               # LLM → master JSON
├── ai/
│   ├── models.ts
│   ├── enrich-chat.ts           # Chat tools / system prompts
│   └── translate.ts
└── pdf/
    └── render.tsx               # @react-pdf templates

prisma/
├── schema.prisma
└── migrations/

templates/                       # Resume visual template definitions
├── classic/
└── modern/

tests/
├── unit/
├── integration/
└── e2e/
```

**Structure Decision**: Single Next.js App Router project (default for this stack). UI routes under `app/(app)`, domain logic in `lib/*`, persistence in Prisma, contracts documented under `specs/002-ai-resume-builder/contracts/`. No separate frontend/backend repos for v1.

## Complexity Tracking

> No constitution violations to justify. Table left empty intentionally.
