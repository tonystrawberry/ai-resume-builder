# Quickstart: Job Application Tracker

**Feature**: `003-job-applications`  
**Branch**: `003-job-applications`  
**Date**: 2026-07-20

## Prerequisites

- Node.js 20+
- npm
- `DATABASE_URL` configured
- Existing auth setup working (GitHub sign-in)

## 1. Install and start

```bash
npm install
npx prisma migrate dev
npm run dev
```

## 2. Verify database changes

Confirm `JobApplication` model and status enum are present in `prisma/schema.prisma`, then apply migration.

```bash
npx prisma generate
```

## 3. Smoke test the API

Use an authenticated browser session and verify:

- `GET /api/applications` returns only current user entries.
- `POST /api/applications` with title only succeeds.
- `PATCH /api/applications/{id}` updates status and optional fields.
- `DELETE /api/applications/{id}` removes the record.

## 4. Smoke test the UI

1. Sign in and open `/applications`.
2. Create an entry with only title.
3. Edit it to add optional fields (`description`, `companyName`, `jobUrl`, `appliedAt`).
4. Link a resume if one exists.
5. Confirm status appears in list and list order updates by recency.
6. Delete the application and verify it disappears without affecting resume records.

## 5. Edge verification

- Attempt to create with empty title -> validation error.
- Attempt to open another user's application id -> 404/not accessible.
- Delete a linked resume and verify the application still loads with missing-link indicator.
- Ensure cover-letter field is non-blocking and marked as coming soon.
