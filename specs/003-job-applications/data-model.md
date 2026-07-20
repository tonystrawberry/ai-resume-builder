# Data Model: Job Application Tracker

**Feature**: `003-job-applications`  
**Date**: 2026-07-20

## Entity: JobApplication

Represents one job opportunity a user is tracking.

### Fields

- `id` (string, cuid, primary key)
- `userId` (string, required, foreign key -> `User.id`)
- `title` (string, required, 1..200 chars after trim)
- `description` (string, optional, max 5000 chars)
- `companyName` (string, optional, max 200 chars)
- `jobUrl` (string, optional, URL-like string, max 2000 chars)
- `status` (enum, required, default `interested`)
- `appliedAt` (datetime, optional)
- `linkedResumeId` (string, optional, foreign key -> `MasterResumeProfile.id`, `onDelete: SetNull`)
- `coverLetterId` (string, optional, reserved for future cover-letter resource id)
- `createdAt` (datetime, default now)
- `updatedAt` (datetime, auto-updated)

### Status Enum

- `interested`
- `applied`
- `interviewing`
- `offer`
- `rejected`
- `withdrawn`

### Relationships

- Many `JobApplication` to one `User`
- Many `JobApplication` to zero/one `MasterResumeProfile` (linked resume)
- Future: many `JobApplication` to zero/one `CoverLetter`

### Validation Rules

- `title` is mandatory on create and update.
- `jobUrl`, when provided, must pass URL parsing validation in API layer.
- `linkedResumeId`, when provided, must reference a resume owned by same `userId`.
- `coverLetterId`, when provided later, must reference a cover letter owned by same `userId`.
- `status` must be one of enum values.

### Indexing

- Composite index: `(userId, updatedAt desc)` for default list ordering.
- Optional index: `(userId, status)` to support future status filtering efficiently.

## Existing Entity Touchpoints

### User

- Add relation: `jobApplications JobApplication[]`

### MasterResumeProfile

- No ownership changes.
- Optional back relation for linked applications can be added for query convenience.

## State Transitions

Status transitions are user-controlled (not system-enforced beyond enum validity).

- Typical path: `interested -> applied -> interviewing -> offer|rejected|withdrawn`
- Allowed operation: user may set any enum value at edit time to support real-world nonlinear workflows.

## Deletion Behavior

- Deleting `JobApplication` removes only that record.
- Deleting linked resume sets `linkedResumeId` to null (application remains).
- Cover-letter deletion behavior will mirror resume unlink behavior once cover-letter resource exists.
