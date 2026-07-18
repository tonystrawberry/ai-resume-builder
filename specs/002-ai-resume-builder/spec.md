# Feature Specification: AI Resume Builder

**Feature Branch**: `002-ai-resume-builder`

**Created**: 2026-07-18

**Status**: Draft

**Input**: User description: "AI-powered Resume Builder. Core flow is an ETL pipeline attached to a stateful chat interface: (1) ingest social data via GitHub OAuth and LinkedIn via 3rd-party API scraper, (2) LLM extracts into structured master JSON, (3) stateful chat fills gaps (achievements, metrics, etc.), (4) LLM updates master JSON from chat, (5) render final JSON into translatable, exportable UI templates."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Import Career Data from Social Profiles (Priority: P1)

A job seeker signs in, connects at least one social/career source (GitHub and/or LinkedIn), and starts an import. The system pulls available profile, experience, education, skills, and project signals, then transforms them into a structured master resume profile they can review.

**Why this priority**: Without reliable ingestion into a structured profile, every later step (chat enrichment, preview, export) has nothing meaningful to build on. This is the core ETL entry point.

**Independent Test**: Can be fully tested by connecting a source account (or using a fixture profile), running import, and verifying a structured master resume profile is created with recognizable sections populated from the source data.

**Acceptance Scenarios**:

1. **Given** a signed-in user with no resume profile, **When** they connect GitHub and start import, **Then** the system creates a master resume profile populated with available identity, projects, skills, and contribution-derived experience signals.
2. **Given** a signed-in user with no resume profile, **When** they connect LinkedIn (via the approved third-party connector) and start import, **Then** the system creates a master resume profile populated with available work history, education, skills, and headline/summary when present.
3. **Given** a signed-in user who connects both GitHub and LinkedIn, **When** they run import, **Then** the system merges signals into a single master resume profile without silently dropping either source’s non-conflicting data.
4. **Given** a user whose connected source returns incomplete or empty data, **When** import finishes, **Then** the system still creates a master resume profile, marks sparse sections as incomplete, and prompts the user to continue via chat enrichment.
5. **Given** a user who denies or revokes source access, **When** they attempt import, **Then** the system explains what failed and offers to retry or continue with another source / manual chat entry.

---

### User Story 2 - Enrich Resume Through Stateful Chat (Priority: P1)

After import (or with a sparse profile), the user chats with an assistant that asks targeted questions about missing achievements, metrics, role impact, and preferences. Each confirmed answer updates the master resume profile, and the conversation remains available so the user can continue later.

**Why this priority**: Social imports rarely include quantified impact. Conversational gap-filling is the product’s primary value over static form-based builders.

**Independent Test**: Can be fully tested with a pre-seeded sparse master profile: open chat, answer questions about missing metrics/achievements, and verify the master profile is updated while chat history remains after refresh/reopen.

**Acceptance Scenarios**:

1. **Given** a master resume profile with incomplete sections, **When** the user opens the chat, **Then** the assistant surfaces the highest-priority gaps (e.g., missing metrics, vague responsibilities) and asks one clear question at a time.
2. **Given** an active chat, **When** the user provides an achievement or metric, **Then** the master resume profile is updated to reflect that information in the appropriate section.
3. **Given** a user mid-conversation, **When** they leave and return later, **Then** the prior chat context and master profile state are restored so they can continue without repeating answered questions.
4. **Given** a user who corrects or contradicts earlier information, **When** they state the correction in chat, **Then** the master resume profile is updated to the latest confirmed version and outdated conflicting content is superseded.
5. **Given** a user who wants to skip a question, **When** they decline or ask to move on, **Then** the assistant proceeds to the next gap without blocking progress.

---

### User Story 3 - Preview Resume on Exportable Templates (Priority: P2)

The user selects a resume template and sees a live preview rendered from the current master resume profile. They can switch templates and confirm the content is presentation-ready before export.

**Why this priority**: Users need visual confidence that their structured data becomes a professional resume. Preview is required before export but can follow a working import + chat MVP.

**Independent Test**: Can be fully tested with a completed (or fixture) master profile by selecting each available template and verifying the rendered preview reflects profile content.

**Acceptance Scenarios**:

1. **Given** a master resume profile with core sections filled, **When** the user opens the template preview, **Then** they see a formatted resume reflecting name, experience, education, skills, and summary from the master profile.
2. **Given** a user viewing a template, **When** they switch to another available template, **Then** the same master profile content re-renders in the new layout without data loss.
3. **Given** a user who updates the master profile via chat, **When** they return to preview, **Then** the preview reflects the latest profile content.

---

### User Story 4 - Translate and Export the Resume (Priority: P2)

The user chooses a target language for the resume presentation and exports a shareable/downloadable resume suitable for applications.

**Why this priority**: Translation and export complete the end-to-end job-seeker outcome, but depend on a solid master profile and at least one template.

**Independent Test**: Can be fully tested by selecting a language, exporting from a filled master profile + template, and verifying the output is downloadable/shareable and matches the selected language and template content.

**Acceptance Scenarios**:

1. **Given** a preview-ready resume, **When** the user selects an available target language, **Then** the presented resume content appears in that language while the underlying master profile remains the source of truth.
2. **Given** a preview-ready resume in a selected language, **When** the user exports, **Then** they receive a downloadable file suitable for job applications.
3. **Given** a user who changes language after export, **When** they export again, **Then** a new export is produced in the newly selected language without requiring re-import.

---

### User Story 5 - Sign In and Manage Connected Sources (Priority: P3)

A user creates or signs into an account, manages connected social sources, and understands what data is stored for their resume.

**Why this priority**: Account and source management is necessary for persistence and re-import, but can be thinner for early demos if import is fixture-backed; still required for the real product flow.

**Independent Test**: Can be fully tested by signing in, connecting/disconnecting sources, and verifying resume data remains associated with the account.

**Acceptance Scenarios**:

1. **Given** a new visitor, **When** they sign in with a supported identity provider, **Then** they land in a workspace where they can start or resume resume building.
2. **Given** a signed-in user with a connected source, **When** they disconnect that source, **Then** future imports no longer use that source, and the user is told whether existing imported profile content is retained.
3. **Given** a returning user, **When** they sign in again, **Then** their master resume profile, chat history, and template/language preferences are available.

---

### Edge Cases

- What happens when GitHub or LinkedIn import partially succeeds (some fields available, others fail)? System keeps successful fields, marks failed sections incomplete, and notifies the user.
- What happens when source data conflicts (e.g., different job titles/dates across GitHub and LinkedIn)? System prefers explicit professional history from LinkedIn for employment chronology and keeps GitHub-derived project/skill signals; conflicts are surfaced in chat for confirmation.
- How does the system handle very large histories (many repos/roles)? System prioritizes the most recent and most relevant items for the master profile and allows the user to promote/demote items via chat.
- What happens if the assistant proposes an inaccurate claim? User confirmation is required before speculative or inferred statements become part of the master profile; clearly labeled suggestions may appear in chat first.
- What happens during chat or import outages? User sees a clear retryable error; previously saved master profile and chat history remain intact.
- What happens when the user has no social accounts? User can start from an empty master profile and build entirely via chat (slower path, still supported).
- What happens if export is requested with critical sections empty? System warns about incomplete sections and allows export only after acknowledgment (or blocks export of required identity fields if name/contact are missing).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to sign in and persist their resume-building workspace across sessions.
- **FR-002**: System MUST allow users to connect GitHub as a data source and import available career/project signals into a master resume profile.
- **FR-003**: System MUST allow users to connect LinkedIn via an approved third-party connector and import available professional history into a master resume profile.
- **FR-004**: System MUST transform imported source data into a single structured master resume profile (canonical resume data) owned by the user.
- **FR-005**: System MUST support merging data from multiple connected sources into one master resume profile, preserving non-conflicting information from each source.
- **FR-006**: System MUST identify incomplete or low-quality sections in the master resume profile (missing metrics, vague bullets, empty required sections).
- **FR-007**: System MUST provide a stateful conversational interface that asks users to fill identified gaps (achievements, metrics, clarifications, preferences).
- **FR-008**: System MUST update the master resume profile based on user-confirmed chat answers, keeping chat history and profile state consistent.
- **FR-009**: System MUST persist chat conversation state so users can resume enrichment later without losing context.
- **FR-010**: System MUST NOT permanently store speculative AI-generated claims in the master resume profile without user confirmation.
- **FR-011**: Users MUST be able to correct previously captured information through chat, with the latest confirmed content superseding older conflicting content.
- **FR-012**: System MUST render the master resume profile into one or more selectable visual resume templates for on-screen preview.
- **FR-013**: Users MUST be able to switch templates without losing master resume profile data.
- **FR-014**: System MUST support presenting resume content in at least two languages (source/default language plus one additional target language) for preview and export.
- **FR-015**: Users MUST be able to export a downloadable resume suitable for job applications from the selected template and language.
- **FR-016**: System MUST show clear, actionable errors when import, chat enrichment, translation, or export fails, without corrupting saved profile data.
- **FR-017**: Users MUST be able to disconnect a connected source and understand the effect on future imports and existing profile content.
- **FR-018**: System MUST restrict each user’s master resume profile, chat history, and exports to that user’s account.
- **FR-019**: System MUST allow a user with no connected sources to create and enrich a master resume profile via chat alone.
- **FR-020**: System MUST warn users before export when critical resume sections remain incomplete.

### Key Entities

- **User Account**: Authenticated person who owns resume data, connected sources, chat history, and export preferences.
- **Connected Source**: An authorized external career/social data connection (GitHub, LinkedIn connector) with connection status and last-import metadata.
- **Source Snapshot**: The raw or normalized payload captured from a source at import time, used for auditability and re-processing.
- **Master Resume Profile**: Canonical structured resume data (identity/contact, summary, experience, education, skills, projects, achievements/metrics, and completeness indicators). Single source of truth for preview, translation, and export.
- **Chat Conversation**: Ordered message history and enrichment progress tied to a user’s master resume profile.
- **Resume Template**: A presentation layout that maps master resume profile sections into a visual resume.
- **Locale Presentation**: A language-specific rendering of the master resume profile for preview/export (master profile remains canonical).
- **Export Artifact**: A downloadable resume output produced from a template + locale presentation at a point in time.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 80% of users who complete a successful source connection can produce a non-empty master resume profile (with two or more sections populated) within 3 minutes of starting import.
- **SC-002**: Users with a sparse imported profile can add at least three concrete achievements or metrics through chat in under 10 minutes.
- **SC-003**: 90% of returning users can resume an in-progress chat enrichment session and see both prior messages and updated profile content without re-entering answered information.
- **SC-004**: Users can switch between available templates and see an updated preview reflecting current master profile content in under 5 seconds of perceived wait for typical profile sizes.
- **SC-005**: Users can generate a downloadable export from a preview-ready resume in under 30 seconds.
- **SC-006**: At least 85% of users who reach preview can complete a first export without contacting support.
- **SC-007**: Fewer than 5% of enrichment sessions result in unrecoverable data loss (profile or chat) after transient failures.
- **SC-008**: In usability testing, at least 80% of participants agree the chat questions helped them articulate impact they would not have added in a blank form.

## Assumptions

- Target users are individual job seekers and career switchers building one primary professional resume at a time (single active master resume profile per user in v1).
- GitHub connection uses standard OAuth authorization granted by the user.
- LinkedIn data is obtained through a compliant third-party connector/scraper service that the user explicitly authorizes; direct unofficial scraping without user authorization is out of scope.
- Either GitHub or LinkedIn alone is sufficient to start; connecting both improves completeness but is optional.
- Users may also build a resume with no social import, using chat-only entry.
- v1 includes at least two resume templates and at least two presentation languages (default/source language plus one additional).
- v1 export format is a downloadable PDF suitable for typical online applications; additional formats (DOCX, plain text) are out of scope unless added later.
- AI may draft suggested wording in chat, but only user-confirmed content becomes part of the master resume profile.
- Contact details needed for export (email/phone/location) may be incomplete after social import and are expected to be collected via chat or a lightweight profile prompt.
- Re-import from a source refreshes source-derived fields but does not blindly overwrite user-confirmed achievements/metrics without confirmation when conflicts exist.
- Mobile-responsive web usage is in scope; native mobile apps are out of scope for v1.
- Project implementation constraints for planning (not user-facing requirements): Next.js App Router, TypeScript strict mode, PostgreSQL with Prisma, Auth.js v5, Vercel AI SDK conversational/object generation patterns, Tailwind CSS + shadcn/ui.
