"use client";

import type { ReactNode, FormEvent } from "react";
import Link from "next/link";
import { SquareArrowOutUpRight } from "lucide-react";
import { ApplicationStatus } from "@prisma/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type ApplicationFormState = {
  title: string;
  description: string;
  companyName: string;
  jobUrl: string;
  status: ApplicationStatus;
  appliedAt: string;
  linkedResumeId: string;
};

export type ResumeOption = { id: string; title: string };

export const APPLICATION_STATUS_OPTIONS: Array<{
  id: ApplicationStatus;
  label: string;
}> = [
  { id: "interested", label: "Interested" },
  { id: "applied", label: "Applied" },
  { id: "interviewing", label: "Interviewing" },
  { id: "offer", label: "Offer" },
  { id: "rejected", label: "Rejected" },
  { id: "withdrawn", label: "Withdrawn" },
];

export const APPLICATION_STATUS_BADGE_CLASSES: Record<
  ApplicationStatus,
  string
> = {
  interested: "border-sky-200 bg-sky-50 text-sky-700",
  applied: "border-blue-200 bg-blue-50 text-blue-700",
  interviewing: "border-violet-200 bg-violet-50 text-violet-700",
  offer: "border-emerald-200 bg-emerald-50 text-emerald-700",
  rejected: "border-rose-200 bg-rose-50 text-rose-700",
  withdrawn: "border-slate-200 bg-slate-100 text-slate-700",
};

type ApplicationFormProps = {
  form: ApplicationFormState;
  onChange: <K extends keyof ApplicationFormState>(
    key: K,
    value: ApplicationFormState[K],
  ) => void;
  resumes: ResumeOption[];
  resumesLoading?: boolean;
  busy?: boolean;
  error?: string | null;
  linkedResumeUnavailable?: boolean;
  showLinkedResumeOpenLink?: boolean;
  idPrefix?: string;
  autoFocusTitle?: boolean;
  footer?: ReactNode;
  onSubmit: (e: FormEvent) => void;
};

export function ApplicationForm({
  form,
  onChange,
  resumes,
  resumesLoading = false,
  busy = false,
  error = null,
  linkedResumeUnavailable = false,
  showLinkedResumeOpenLink = false,
  idPrefix = "app",
  autoFocusTitle = false,
  footer,
  onSubmit,
}: ApplicationFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor={`${idPrefix}-title`} className="text-xs text-muted">
          Title
        </label>
        <Input
          id={`${idPrefix}-title`}
          value={form.title}
          onChange={(e) => onChange("title", e.target.value)}
          placeholder="e.g. Senior Frontend Engineer"
          autoFocus={autoFocusTitle}
          disabled={busy}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor={`${idPrefix}-company`} className="text-xs text-muted">
          Company name (optional)
        </label>
        <Input
          id={`${idPrefix}-company`}
          value={form.companyName}
          onChange={(e) => onChange("companyName", e.target.value)}
          disabled={busy}
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor={`${idPrefix}-description`}
          className="text-xs text-muted"
        >
          Description (optional)
        </label>
        <Textarea
          id={`${idPrefix}-description`}
          value={form.description}
          onChange={(e) => onChange("description", e.target.value)}
          disabled={busy}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor={`${idPrefix}-url`} className="text-xs text-muted">
          Job posting URL (optional)
        </label>
        <Input
          id={`${idPrefix}-url`}
          value={form.jobUrl}
          onChange={(e) => onChange("jobUrl", e.target.value)}
          placeholder="https://example.com/jobs/123"
          disabled={busy}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor={`${idPrefix}-status`} className="text-xs text-muted">
            Status
          </label>
          <select
            id={`${idPrefix}-status`}
            value={form.status}
            onChange={(e) =>
              onChange("status", e.target.value as ApplicationStatus)
            }
            disabled={busy}
            className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm"
          >
            {APPLICATION_STATUS_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label
            htmlFor={`${idPrefix}-applied-at`}
            className="text-xs text-muted"
          >
            Applied date (optional)
          </label>
          <Input
            id={`${idPrefix}-applied-at`}
            type="date"
            value={form.appliedAt}
            onChange={(e) => onChange("appliedAt", e.target.value)}
            disabled={busy}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor={`${idPrefix}-resume`} className="text-xs text-muted">
          Linked resume (optional)
        </label>
        <div className="flex gap-2">
          <select
            id={`${idPrefix}-resume`}
            value={form.linkedResumeId}
            onChange={(e) => onChange("linkedResumeId", e.target.value)}
            disabled={busy || resumesLoading}
            className="h-10 min-w-0 flex-1 rounded-md border border-border bg-card px-3 text-sm"
          >
            <option value="">
              {resumesLoading
                ? "Loading resumes…"
                : resumes.length
                  ? "No linked resume"
                  : "No resumes available"}
            </option>
            {resumes.map((resume) => (
              <option key={resume.id} value={resume.id}>
                {resume.title}
              </option>
            ))}
          </select>
          {showLinkedResumeOpenLink ? (
            form.linkedResumeId ? (
              <Link
                href={`/workspace/${form.linkedResumeId}`}
                target="_blank"
                rel="noreferrer"
                title="Open resume in new tab"
                aria-label="Open resume in new tab"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "h-10 w-10 shrink-0 px-0",
                )}
              >
                <SquareArrowOutUpRight className="h-4 w-4" />
              </Link>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-10 w-10 shrink-0 px-0"
                disabled
                title="Select a resume to open"
                aria-label="Select a resume to open"
              >
                <SquareArrowOutUpRight className="h-4 w-4" />
              </Button>
            )
          ) : null}
        </div>
      </div>

      {linkedResumeUnavailable ? (
        <p className="text-xs text-muted">Resume unavailable</p>
      ) : null}

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {footer ?? (
        <div className="flex justify-end gap-2">
          {form.jobUrl.trim() ? (
            <a
              href={form.jobUrl.trim()}
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Open job posting
            </a>
          ) : null}
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save application"}
          </Button>
        </div>
      )}
    </form>
  );
}
