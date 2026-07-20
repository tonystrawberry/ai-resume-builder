# Feature Specification: Job Application Tracker

**Feature Branch**: `003-job-applications`

**Created**: 2026-07-20

**Status**: Draft

**Input**: User description: "Track applications to companies. Create an application list page for creating and managing applications. Each application should have a title, a description (optional), a link to the job offer page (optional), a linked resume (optional), and a cover letter (optional - new resource to be defined later)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View and Browse Applications (Priority: P1)

A signed-in job seeker opens the applications page and sees every job application they have recorded, with enough context to understand what each one is and where it stands in their search.

**Why this priority**: A single place to see all applications is the foundation of tracking. Without a list view, users cannot manage or revisit applications they have started.

**Independent Test**: Can be fully tested by signing in, seeding several applications with varied titles and statuses, and verifying the list displays them in a scannable order with key fields visible.

**Acceptance Scenarios**:

1. **Given** a signed-in user with one or more applications, **When** they open the applications page, **Then** they see a list of their applications showing at minimum the title and current status for each.
2. **Given** a signed-in user with no applications, **When** they open the applications page, **Then** they see an empty state that explains how to add their first application and offers a clear action to create one.
3. **Given** a signed-in user viewing the list, **When** applications were created on different dates, **Then** the list defaults to showing the most recently updated applications first.

---

### User Story 2 - Create a New Application (Priority: P1)

A job seeker records a new job application by providing a title and optionally adding supporting details before or after saving.

**Why this priority**: Creating applications is the core write path. Users need to capture opportunities as soon as they find them, often with only a title and company name at first.

**Independent Test**: Can be fully tested by creating an application with only a title, then verifying it appears in the list and can be opened again with the saved title.

**Acceptance Scenarios**:

1. **Given** a signed-in user on the applications page, **When** they create an application with a title, **Then** the application is saved and appears in their list.
2. **Given** a user creating an application, **When** they leave the title empty, **Then** the system prevents save and explains that a title is required.
3. **Given** a user creating an application, **When** they optionally provide a description, job posting URL, company name, and applied date, **Then** those values are stored and shown when the application is reopened.
4. **Given** a user creating an application, **When** they do not provide optional fields, **Then** the application is still saved successfully with only the required title.

---

### User Story 3 - Edit and Update an Application (Priority: P1)

A job seeker opens an existing application to update its details, change its status as the hiring process progresses, or attach resources used for that application.

**Why this priority**: Application tracking only stays useful if users can evolve a record over time—from draft to applied to interview and beyond.

**Independent Test**: Can be fully tested by opening a saved application, changing its status and optional fields, saving, and confirming the list and detail views reflect the updates.

**Acceptance Scenarios**:

1. **Given** a signed-in user with a saved application, **When** they open it and change the title, description, company name, job URL, status, or applied date, **Then** the changes persist after save.
2. **Given** a user editing an application, **When** they set status to a new value (e.g., from "Interested" to "Applied"), **Then** the updated status is visible on both the detail view and the list.
3. **Given** a user editing an application, **When** they clear an optional text field, **Then** the field is stored as empty rather than retaining the previous value.

---

### User Story 4 - Link a Resume to an Application (Priority: P2)

A job seeker associates one of their existing resumes with an application so they know which version they submitted or plan to submit.

**Why this priority**: Linking resumes connects the application tracker to the product’s core resume workflow, but applications remain useful without a linked resume.

**Independent Test**: Can be fully tested by creating an application, selecting a resume from the user’s resume library, saving, and verifying the link is shown and opens the correct resume workspace.

**Acceptance Scenarios**:

1. **Given** a user with at least one resume, **When** they edit an application and select a linked resume, **Then** the application stores that association and displays the resume title in the application detail.
2. **Given** a user editing an application with a linked resume, **When** they remove the link, **Then** the application no longer references that resume.
3. **Given** a user with no resumes, **When** they edit an application, **Then** the resume link control explains that no resumes are available and does not block saving other fields.
4. **Given** a linked resume is later deleted, **When** the user opens the application, **Then** the application shows that the previously linked resume is unavailable rather than failing to load.

---

### User Story 5 - Reserve Cover Letter Association (Priority: P3)

A job seeker can optionally associate a cover letter with an application once cover letters exist as a first-class resource in the product.

**Why this priority**: Cover letters are explicitly deferred as a new resource. The application model should accept an optional cover letter link without requiring cover letter authoring in this feature.

**Independent Test**: Can be fully tested by verifying the application form exposes an optional cover letter field that remains disabled or informational until cover letters ship, or accepts a link when the cover letter resource becomes available.

**Acceptance Scenarios**:

1. **Given** cover letters are not yet available in the product, **When** a user views or edits an application, **Then** they see that cover letter linking is coming soon and can still save all other application fields.
2. **Given** cover letters become available in a future release, **When** a user selects a cover letter for an application, **Then** the association is stored and displayed alongside the linked resume.

---

### User Story 6 - Delete an Application (Priority: P2)

A job seeker removes an application they no longer need to track, without affecting linked resumes or future cover letters.

**Why this priority**: Users need a way to clean up mistaken entries or withdrawn opportunities. Deletion is secondary to create and update flows.

**Independent Test**: Can be fully tested by deleting an application and confirming it disappears from the list while linked resumes remain in the resume library.

**Acceptance Scenarios**:

1. **Given** a user viewing an application, **When** they confirm deletion, **Then** the application is removed from their list.
2. **Given** a user deletes an application that had a linked resume, **When** deletion completes, **Then** the resume itself remains available in the resume library.
3. **Given** a user initiates delete, **When** they cancel the confirmation, **Then** the application is not removed.

---

### Edge Cases

- What happens when a user enters a job posting URL that is malformed or unreachable? The system saves the URL as entered and does not block save; opening the link is the user’s responsibility.
- What happens when two applications share the same title? Both are allowed; the list should disambiguate with company name, status, or date when present.
- What happens when a user tries to access another user’s application? The system denies access and does not reveal whether the application exists.
- What happens when optional linked resources (resume, cover letter) are removed from the library? The application remains valid and shows that the link is broken or unavailable.
- What happens when a user has a large number of applications (e.g., 100+)? The list remains usable via scrolling; search and filter are out of scope for the initial release unless performance requires basic text search.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a dedicated applications page accessible to signed-in users for viewing all of their job applications.
- **FR-002**: System MUST allow users to create an application with a required title.
- **FR-003**: System MUST allow users to optionally store a description, job posting URL, company name, and applied date on each application.
- **FR-004**: System MUST allow users to set and update an application status from a predefined set: Interested, Applied, Interviewing, Offer, Rejected, and Withdrawn.
- **FR-005**: System MUST default new applications to status "Interested" unless the user chooses otherwise at creation time.
- **FR-006**: System MUST allow users to open, edit, and save changes to any application they own.
- **FR-007**: System MUST allow users to optionally link zero or one resume from their existing resume library to an application.
- **FR-008**: System MUST reserve an optional cover letter association on each application without requiring cover letter creation in this release.
- **FR-009**: System MUST allow users to delete an application they own, with a confirmation step before permanent removal.
- **FR-010**: System MUST ensure each user can only view and manage their own applications.
- **FR-011**: System MUST display applications in the list with title and status visible without opening each record.
- **FR-012**: System MUST order the default application list by most recently updated first.
- **FR-013**: System MUST show company name and applied date in the list when those fields are populated.
- **FR-014**: System MUST provide a clear action from an application to open an associated job posting URL in a new browser context when a URL is stored.
- **FR-015**: System MUST provide a clear action from an application to open a linked resume when one is associated and still available.
- **FR-016**: System MUST validate that a title is present before saving an application.
- **FR-017**: System MUST handle missing linked resources gracefully without preventing access to the rest of the application record.

### Key Entities

- **Application**: A job opportunity the user is tracking. Belongs to one user. Key attributes: title (required), description (optional), company name (optional), job posting URL (optional), status, applied date (optional), created/updated timestamps. May reference zero or one resume and zero or one cover letter.
- **Resume (existing)**: A user-owned resume document already managed elsewhere in the product. Referenced optionally by an application; not owned or deleted by the application.
- **Cover letter (future)**: A user-owned document type to be defined in a later feature. Referenced optionally by an application when available.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create a new application with only a title in under 30 seconds from the applications page.
- **SC-002**: 95% of users who open the applications page with existing data can identify the status of any application without opening its detail view.
- **SC-003**: Users can update an application’s status and optional fields and see the changes reflected in the list on the next page load without data loss.
- **SC-004**: 100% of attempts to access another user’s application are blocked.
- **SC-005**: Users with at least one resume can link it to an application in a single edit flow without leaving the applications area.
- **SC-006**: After deleting an application, it no longer appears in the user’s list within one interaction cycle (no stale entries).

## Assumptions

- Users are already authenticated; the same sign-in used for resumes applies to applications.
- Each application belongs to exactly one user; there is no sharing or collaboration on applications in this release.
- Company name and applied date are included in v1 because they are standard for job tracking and complement the user-provided title.
- A simple status workflow (Interested → Applied → Interviewing → Offer / Rejected / Withdrawn) is included in v1 because "tracking" implies pipeline visibility; users can change status manually.
- Cover letter authoring, templates, and export are explicitly out of scope; only optional linkage is reserved for a future cover letter resource.
- Search, filtering, sorting beyond default recency, reminders, calendar integration, and employer-side application portals are out of scope for v1.
- Archiving applications (soft delete) is out of scope for v1; delete is permanent with confirmation.
- One resume per application is sufficient; users who tailor multiple versions can update the link before submitting.

## Future Recommendations (Out of Scope for v1)

The following enhancements are recommended for later iterations but are not required to deliver the initial application list and management experience:

- **Notes vs. description**: A separate short "notes" field for interview prep or recruiter contact details, distinct from a longer role description.
- **Follow-up reminders**: Notify users to follow up after N days in a given status.
- **Search and filter**: Filter by status or company; text search across title and company.
- **Application timeline**: Automatic history of status changes with timestamps.
- **Duplicate from application**: Clone an application to reuse resume/link patterns for similar roles.
- **Quick apply shortcut**: Pre-fill workspace or export from the linked resume directly from the application detail page.
