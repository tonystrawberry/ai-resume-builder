# HTTP API Contracts: AI Resume Builder

**Base**: same origin | **Auth**: session cookie via Auth.js (unless noted)  
**Content-Type**: `application/json` unless noted  
**Errors**: `{ "error": { "code": string, "message": string, "details"?: unknown } }`

All `/api/*` routes below (except Auth.js handlers) require an authenticated session. Responses must never leak another user’s data (FR-018).

---

## Auth

### `* /api/auth/[...nextauth]`

Auth.js v5 handlers (sign-in, callback, sign-out, session). GitHub provider enabled.

---

## Profile

### `GET /api/profile`

Returns the current user’s master resume profile and preferences.

**Response 200**:
```json
{
  "profile": {
    "id": "string",
    "data": { "$ref": "MasterResume" },
    "completeness": { "score": 0, "gaps": [] },
    "selectedTemplateId": "classic",
    "sourceLocale": "en",
    "selectedLocale": "en",
    "version": 1,
    "updatedAt": "ISO-8601"
  }
}
```

**Response 404**: No profile yet — client may create via import or `POST /api/profile`.

### `POST /api/profile`

Creates an empty master profile for chat-only path (FR-019).

**Body**: `{ "sourceLocale"?: "en" }`  
**Response 201**: same shape as GET `profile`  
**Response 409**: Profile already exists

### `PATCH /api/profile`

Applies a confirmed partial update (from settings/chat confirmation UI).

**Body**:
```json
{
  "version": 1,
  "patch": { "/* partial MasterResume deep-partial */": true },
  "confirmAiSuggestions": true
}
```

**Rules**: Reject if `version` mismatch (409). Upgrade any `ai_suggested` nodes in patch to `user` only when `confirmAiSuggestions` is true; otherwise strip/reject them (FR-010).

**Response 200**: updated profile  
**Response 409**: version conflict

---

## Connected sources

### `GET /api/sources`

**Response 200**:
```json
{
  "sources": [
    {
      "id": "string",
      "provider": "github",
      "status": "connected",
      "externalHandle": "octocat",
      "lastImportAt": "ISO-8601",
      "lastError": null
    }
  ]
}
```

### `DELETE /api/sources/{provider}`

Disconnects source (`github` | `linkedin`). Retains existing master profile data; future imports ignore this source (FR-017).

**Response 200**: `{ "provider": "github", "status": "disconnected", "profileRetained": true }`

---

## Import (ETL)

### `POST /api/import/github`

Fetches GitHub using stored OAuth token → snapshot → LLM extract → merge.

**Body**: `{ }` (optional flags later)  
**Response 200**:
```json
{
  "status": "ready",
  "profile": { "$ref": "GET /api/profile.profile" },
  "snapshotId": "string",
  "warnings": ["string"]
}
```
**Response 401/403**: Missing/expired GitHub account link  
**Response 502**: Upstream GitHub or LLM failure (profile unchanged)

### `POST /api/import/linkedin`

**Body**: `{ "profileUrl": "https://www.linkedin.com/in/..." }`  
**Response**: same as GitHub import  
**Response 400**: Invalid URL  
**Response 502**: Connector/LLM failure (profile unchanged)

---

## Chat (enrichment)

### `POST /api/chat`

AI SDK UI message stream endpoint for `useChat`.

**Body** (AI SDK transport shape; conceptually):
```json
{
  "id": "conversation-id",
  "messages": [ { "id": "…", "role": "user", "parts": [] } ]
}
```

**Behavior**:
- Ensures conversation belongs to session user
- Injects current gaps + master profile summary into system context
- Streams assistant UI messages
- May include tool calls proposing `ResumePatch` (JSON patch / partial MasterResume)
- Persists full `UIMessage[]` on stream end
- **Does not** commit patches to master profile until client calls `PATCH /api/profile` with confirmation (or a dedicated confirm tool result that sets confirmation flag)

**Response**: `text/event-stream` (UI message stream)

### `GET /api/chat`

Load conversation for resume UI.

**Response 200**:
```json
{
  "id": "string",
  "messages": []
}
```

---

## Preview preferences

### `PATCH /api/preview`

**Body**:
```json
{
  "selectedTemplateId": "modern",
  "selectedLocale": "ja"
}
```

**Response 200**: updated preferences + `localePresentation` if available/fresh  
If locale presentation stale/missing and locale ≠ sourceLocale, client should call translate.

---

## Translate

### `POST /api/translate`

**Body**: `{ "locale": "ja" }`  
**Response 200**:
```json
{
  "locale": "ja",
  "sourceVersion": 3,
  "data": { "$ref": "MasterResume" }
}
```

Does not mutate master profile (FR-014).

---

## Export

### `POST /api/export/pdf`

**Body**:
```json
{
  "templateId": "classic",
  "locale": "en",
  "acknowledgeIncomplete": false
}
```

**Response 200**: `application/pdf` binary (`Content-Disposition: attachment`)  
**Response 422**: Missing critical identity fields, or incomplete without `acknowledgeIncomplete: true` (FR-020)

---

## Shared types

### ResumePatch

Partial `MasterResume` used for confirmed updates. Server validates against Zod schema after merge.

### Completeness

```json
{
  "score": 0,
  "gaps": [
    {
      "section": "experience",
      "path": "experience[0].metrics",
      "severity": "high",
      "message": "Add a measurable outcome for this role"
    }
  ]
}
```
