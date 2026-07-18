# Data Model: AI Resume Builder

**Feature**: `002-ai-resume-builder` | **Date**: 2026-07-18

## Overview

PostgreSQL via Prisma. Auth.js models (`User`, `Account`, `Session`, `VerificationToken`) plus domain models for resume ETL, chat, locale cache, and exports. Canonical resume content lives in `MasterResumeProfile.data` (JSON) validated by Zod `MasterResume` schema at write boundaries.

```text
User 1──1 MasterResumeProfile
User 1──* ConnectedSource
MasterResumeProfile 1──* SourceSnapshot
MasterResumeProfile 1──1 ChatConversation
MasterResumeProfile 1──* LocalePresentation
MasterResumeProfile 1──* ExportArtifact
ChatConversation 1──* ChatMessage (or messages JSON on conversation)
```

---

## Auth.js entities (adapter)

### User

| Field | Type | Notes |
|-------|------|-------|
| id | string (cuid/uuid) | PK |
| name | string? | From IdP |
| email | string? | Unique when present |
| emailVerified | datetime? | |
| image | string? | |
| createdAt / updatedAt | datetime | |

### Account

| Field | Type | Notes |
|-------|------|-------|
| id | string | PK |
| userId | string | FK → User |
| type / provider / providerAccountId | string | Unique (provider, providerAccountId) |
| access_token / refresh_token / expires_at | … | Used for GitHub API import when provider = `github` |
| scope / token_type / id_token | … | Standard Auth.js fields |

### Session / VerificationToken

Standard Auth.js Prisma adapter shapes.

---

## Domain entities

### ConnectedSource

Represents an authorized external career/social connection.

| Field | Type | Notes |
|-------|------|-------|
| id | string | PK |
| userId | string | FK → User |
| provider | enum: `github` \| `linkedin` | |
| status | enum: `connected` \| `disconnected` \| `error` | |
| externalHandle | string? | GitHub login or LinkedIn URL/slug |
| lastImportAt | datetime? | |
| lastError | string? | User-safe message |
| metadata | json? | Non-secret connector metadata |
| createdAt / updatedAt | datetime | |

**Rules**:
- Unique `(userId, provider)` in v1
- Disconnect sets `status=disconnected`; does not delete master profile content
- GitHub tokens live on Auth.js `Account`; LinkedIn connector credentials are app-level + user-provided profile URL (no LinkedIn OAuth token unless vendor requires it)

### SourceSnapshot

Raw/normalized payload captured at import time.

| Field | Type | Notes |
|-------|------|-------|
| id | string | PK |
| profileId | string | FK → MasterResumeProfile |
| provider | enum | |
| connectedSourceId | string? | FK → ConnectedSource |
| payload | json | Raw connector/API response |
| normalized | json? | Optional pre-LLM normalize |
| importedAt | datetime | |

**Rules**: Immutable append-only for audit/reprocess; re-import creates a new snapshot.

### MasterResumeProfile

Canonical structured resume (single active per user in v1).

| Field | Type | Notes |
|-------|------|-------|
| id | string | PK |
| userId | string | FK → User, **unique** |
| data | json | Zod `MasterResume` |
| completeness | json | Section scores / gap list cache |
| selectedTemplateId | string | Default `classic` |
| sourceLocale | string | BCP-47, default `en` |
| selectedLocale | string | Active preview/export locale |
| version | int | Optimistic concurrency |
| createdAt / updatedAt | datetime | |

#### MasterResume JSON shape (logical)

```text
MasterResume
├── identity: { fullName, email?, phone?, location?, links[] }
├── summary: string?
├── experience[]: { id, company, title, location?, startDate?, endDate?, current?, bullets[], metrics[], provenance, sourceRefs[] }
├── education[]: { id, institution, degree?, field?, startDate?, endDate?, bullets[], provenance, sourceRefs[] }
├── skills[]: { id, name, category?, provenance, sourceRefs[] }
├── projects[]: { id, name, description?, url?, highlights[], technologies[], provenance, sourceRefs[] }
├── certifications[]? / languages[]?
└── meta: { gaps[], lastEnrichedAt?, schemaVersion }
```

**Provenance**: `github` | `linkedin` | `user` | `ai_suggested` (suggested must not persist as final without upgrade to `user`).

**Validation**:
- `identity.fullName` required before export (warn/block per FR-020)
- Each experience/project item needs stable `id` (ulid/uuid) for chat patches
- Re-import merge must not downgrade `provenance: user` fields without conflict marker

### ChatConversation

| Field | Type | Notes |
|-------|------|-------|
| id | string | PK (also AI SDK chat id) |
| profileId | string | FK → MasterResumeProfile, **unique** in v1 |
| status | enum: `active` \| `archived` | |
| createdAt / updatedAt | datetime | |

### ChatMessage

Prefer either relational rows **or** a JSON `messages` column on `ChatConversation`.

**Recommended for v1**: `messages Json` on `ChatConversation` storing AI SDK `UIMessage[]` (simpler persistence matching AI SDK docs). Optional relational split later if querying is needed.

If relational:

| Field | Type | Notes |
|-------|------|-------|
| id | string | PK (matches UIMessage.id) |
| conversationId | string | FK |
| role | string | user / assistant / system |
| parts | json | UIMessage parts |
| createdAt | datetime | |

### LocalePresentation

Cached translated view of master data for a locale.

| Field | Type | Notes |
|-------|------|-------|
| id | string | PK |
| profileId | string | FK |
| locale | string | BCP-47 |
| data | json | Same shape as MasterResume text fields, translated |
| sourceVersion | int | Master profile `version` when generated |
| createdAt / updatedAt | datetime | |

**Rules**: Unique `(profileId, locale)`. Invalidate/regenerate when `sourceVersion < profile.version`.

### ExportArtifact

| Field | Type | Notes |
|-------|------|-------|
| id | string | PK |
| profileId | string | FK |
| templateId | string | |
| locale | string | |
| format | enum: `pdf` | v1 |
| storageKey | string? | Path/blob key if persisted |
| createdAt | datetime | |

**Rules**: v1 may stream PDF without durable blob storage; row optional for analytics. If stored, enforce user-scoped access.

---

## State transitions

### ConnectedSource.status

```text
disconnected ──connect──► connected
connected ──error──► error ──retry/reconnect──► connected
connected ──disconnect──► disconnected
```

### Import pipeline (ephemeral job state)

Not necessarily a DB entity in v1; can be request-scoped with UI status:

```text
idle → fetching → extracting → merging → ready | failed
```

### Chat enrichment confirmation

```text
assistant proposes patch (ai_suggested)
  → user confirms → apply to MasterResume (provenance=user), bump version
  → user rejects/skips → discard patch, ask next gap
```

### Export readiness

```text
incomplete (missing required identity) → warn/block
incomplete (optional gaps) → warn + allow acknowledge → export
complete → export
```

---

## Indexes (recommended)

- `ConnectedSource(userId, provider)` unique
- `MasterResumeProfile(userId)` unique
- `SourceSnapshot(profileId, importedAt)`
- `LocalePresentation(profileId, locale)` unique
- `ExportArtifact(profileId, createdAt)`
