# HTTP API Contracts: Job Application Tracker

**Base**: same origin  
**Auth**: session cookie via Auth.js (required for all routes below)  
**Content-Type**: `application/json`  
**Errors**: `{ "error": { "code": string, "message": string, "details"?: unknown } }`

## Shared Types

### JobApplicationStatus

`"interested" | "applied" | "interviewing" | "offer" | "rejected" | "withdrawn"`

### JobApplication

```json
{
  "id": "string",
  "title": "string",
  "description": "string | null",
  "companyName": "string | null",
  "jobUrl": "string | null",
  "status": "interested",
  "appliedAt": "ISO-8601 | null",
  "linkedResumeId": "string | null",
  "linkedResumeTitle": "string | null",
  "coverLetterId": "string | null",
  "coverLetterState": "coming_soon | linked | unavailable",
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601"
}
```

---

## List + Create

### `GET /api/applications`

Returns current user applications, ordered by `updatedAt desc`.

**Response 200**:

```json
{
  "applications": [
    {
      "id": "app_123",
      "title": "Senior Frontend Engineer",
      "status": "applied",
      "companyName": "Acme",
      "appliedAt": "2026-07-18T09:30:00.000Z",
      "linkedResumeId": "prof_abc",
      "linkedResumeTitle": "Frontend Resume",
      "updatedAt": "2026-07-20T08:10:00.000Z"
    }
  ]
}
```

### `POST /api/applications`

Create a new application.

**Body**:

```json
{
  "title": "Senior Frontend Engineer",
  "description": "Optional notes",
  "companyName": "Acme",
  "jobUrl": "https://example.com/jobs/123",
  "status": "interested",
  "appliedAt": "2026-07-20T00:00:00.000Z",
  "linkedResumeId": "prof_abc",
  "coverLetterId": null
}
```

**Rules**:

- `title` required.
- Omitted `status` defaults to `interested`.
- `linkedResumeId` must belong to current user if provided.
- `coverLetterId` accepted as nullable placeholder; when cover-letter resource is not available, non-null values may be rejected with validation error.

**Response 201**:

```json
{
  "application": {
    "id": "app_123",
    "title": "Senior Frontend Engineer",
    "status": "interested"
  }
}
```

**Errors**:

- `400` validation failure
- `401` unauthenticated
- `403` linked resume ownership mismatch

---

## Read + Update + Delete

### `GET /api/applications/{applicationId}`

Returns one application owned by current user.

**Response 200**:

```json
{
  "application": {
    "id": "app_123",
    "title": "Senior Frontend Engineer",
    "description": "Optional notes",
    "companyName": "Acme",
    "jobUrl": "https://example.com/jobs/123",
    "status": "interviewing",
    "appliedAt": "2026-07-20T00:00:00.000Z",
    "linkedResumeId": "prof_abc",
    "linkedResumeTitle": "Frontend Resume",
    "coverLetterId": null,
    "coverLetterState": "coming_soon",
    "createdAt": "2026-07-20T08:00:00.000Z",
    "updatedAt": "2026-07-20T08:10:00.000Z"
  }
}
```

**Errors**:

- `404` not found (including other user's resource)
- `401` unauthenticated

### `PATCH /api/applications/{applicationId}`

Partial update for editable fields.

**Body** (any subset):

```json
{
  "title": "Senior Frontend Engineer - Platform",
  "description": null,
  "companyName": "Acme",
  "jobUrl": "https://example.com/jobs/123",
  "status": "applied",
  "appliedAt": "2026-07-20T00:00:00.000Z",
  "linkedResumeId": null,
  "coverLetterId": null
}
```

**Rules**:

- Empty `title` is invalid.
- `null` clears optional fields.
- Ownership checks apply for linked references.

**Response 200**:

```json
{
  "application": {
    "id": "app_123",
    "title": "Senior Frontend Engineer - Platform",
    "status": "applied",
    "updatedAt": "2026-07-20T08:20:00.000Z"
  }
}
```

### `DELETE /api/applications/{applicationId}`

Delete owned application.

**Response 200**:

```json
{
  "deleted": true,
  "id": "app_123"
}
```

**Errors**:

- `404` not found
- `401` unauthenticated

---

## Supporting UI Data

### `GET /api/applications/meta`

Optional helper endpoint for editor forms.

**Response 200**:

```json
{
  "statuses": [
    "interested",
    "applied",
    "interviewing",
    "offer",
    "rejected",
    "withdrawn"
  ],
  "resumes": [
    {
      "id": "prof_abc",
      "title": "Frontend Resume"
    }
  ],
  "coverLetterSupport": "coming_soon"
}
```

If this endpoint is not implemented, equivalent metadata may be embedded in page payloads.
