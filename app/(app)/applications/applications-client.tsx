"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ApplicationStatus } from "@prisma/client";
import { Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ResumeOption = { id: string; title: string };

export type ApplicationListItem = {
  id: string;
  title: string;
  description: string | null;
  companyName: string | null;
  jobUrl: string | null;
  status: ApplicationStatus;
  appliedAt: string | null;
  linkedResumeId: string | null;
  linkedResumeTitle: string | null;
  coverLetterId: string | null;
  updatedAt: string;
};

type FormState = {
  title: string;
  description: string;
  companyName: string;
  jobUrl: string;
  status: ApplicationStatus;
  appliedAt: string;
  linkedResumeId: string;
};

const ALL_STATUSES = "all" as const;
type StatusFilter = ApplicationStatus | typeof ALL_STATUSES;

const STATUS_OPTIONS: Array<{ id: ApplicationStatus; label: string }> = [
  { id: "interested", label: "Interested" },
  { id: "applied", label: "Applied" },
  { id: "interviewing", label: "Interviewing" },
  { id: "offer", label: "Offer" },
  { id: "rejected", label: "Rejected" },
  { id: "withdrawn", label: "Withdrawn" },
];

const STATUS_BADGE_CLASSES: Record<ApplicationStatus, string> = {
  interested: "border-sky-200 bg-sky-50 text-sky-700",
  applied: "border-blue-200 bg-blue-50 text-blue-700",
  interviewing: "border-violet-200 bg-violet-50 text-violet-700",
  offer: "border-emerald-200 bg-emerald-50 text-emerald-700",
  rejected: "border-rose-200 bg-rose-50 text-rose-700",
  withdrawn: "border-slate-200 bg-slate-100 text-slate-700",
};

function toFormState(item?: ApplicationListItem): FormState {
  return {
    title: item?.title ?? "",
    description: item?.description ?? "",
    companyName: item?.companyName ?? "",
    jobUrl: item?.jobUrl ?? "",
    status: item?.status ?? "interested",
    appliedAt: item?.appliedAt ? item.appliedAt.slice(0, 10) : "",
    linkedResumeId: item?.linkedResumeId ?? "",
  };
}

export function ApplicationsClient({
  initialApplications,
}: {
  initialApplications: ApplicationListItem[];
}) {
  const [applications, setApplications] = useState(initialApplications);
  const [resumes, setResumes] = useState<ResumeOption[]>([]);
  const [resumesLoading, setResumesLoading] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState<ApplicationListItem | null>(null);
  const [deleting, setDeleting] = useState<ApplicationListItem | null>(null);
  const [form, setForm] = useState<FormState>(toFormState());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(ALL_STATUSES);

  const isEditing = !!editing;

  useEffect(() => {
    void loadResumes();
  }, []);

  const filteredApplications = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return applications.filter((app) => {
      if (statusFilter !== ALL_STATUSES && app.status !== statusFilter) {
        return false;
      }
      if (!normalizedSearch) return true;
      return [app.title, app.companyName ?? "", app.description ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [applications, searchTerm, statusFilter]);

  const sortedApplications = useMemo(
    () =>
      [...filteredApplications].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
    [filteredApplications],
  );

  async function loadResumes() {
    setResumesLoading(true);
    try {
      const res = await fetch("/api/profile");
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return;
      const items = Array.isArray(json.resumes)
        ? (json.resumes as Array<{ id: string; title: string }>).map((r) => ({
            id: r.id,
            title: r.title,
          }))
        : [];
      setResumes(items);
    } finally {
      setResumesLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm(toFormState());
    setError(null);
    setPanelOpen(true);
  }

  async function openEdit(item: ApplicationListItem) {
    setError(null);
    setPageError(null);
    setPanelOpen(true);
    try {
      const res = await fetch(`/api/applications/${item.id}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPageError(json.error?.message || "Could not load application");
        setPanelOpen(false);
        return;
      }
      const full = json.application as ApplicationListItem;
      setEditing(full);
      setForm(toFormState(full));
    } catch {
      setPageError("Network error");
      setPanelOpen(false);
    }
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }

    setBusy(true);
    setError(null);
    setPageError(null);
    try {
      const body = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        companyName: form.companyName.trim() || null,
        jobUrl: form.jobUrl.trim() || null,
        status: form.status,
        appliedAt: form.appliedAt ? new Date(form.appliedAt).toISOString() : null,
        linkedResumeId: form.linkedResumeId || null,
        coverLetterId: null,
      };

      const res = await fetch(
        isEditing ? `/api/applications/${editing.id}` : "/api/applications",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error?.message || "Could not save application");
        return;
      }

      const saved = json.application as ApplicationListItem;
      setApplications((prev) =>
        isEditing
          ? prev.map((a) => (a.id === saved.id ? saved : a))
          : [saved, ...prev],
      );
      setPanelOpen(false);
      setEditing(null);
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleting || busy) return;
    setBusy(true);
    setPageError(null);
    try {
      const res = await fetch(`/api/applications/${deleting.id}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPageError(json.error?.message || "Could not delete application");
        return;
      }
      setApplications((prev) => prev.filter((a) => a.id !== deleting.id));
      setDeleting(null);
    } catch {
      setPageError("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Applications</h1>
          <p className="mt-2 max-w-2xl text-muted">
            Track job applications, update status over time, and connect each role
            to the resume you submitted.
          </p>
        </div>
        <Button onClick={openCreate}>New application</Button>
      </div>

      {pageError ? <p className="text-sm text-danger">{pageError}</p> : null}

      <section className="space-y-3">
        <Card className="space-y-3 px-6 py-4">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <div className="min-w-0 space-y-1">
              <label htmlFor="application-search" className="text-xs text-muted">
                Search applications
              </label>
              <Input
                id="application-search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, company, or description"
              />
            </div>
            <div className="w-full shrink-0 space-y-1 md:w-48 md:pr-4">
              <label htmlFor="application-status-filter" className="mr-1 text-xs text-muted">
                Filter by status
              </label>
              <select
                id="application-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm"
              >
                <option value={ALL_STATUSES}>All statuses</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {!sortedApplications.length ? (
          <Card className="space-y-2 py-5 text-sm text-muted">
            <p>
              {applications.length
                ? "No applications match your current search and filters."
                : "No applications yet."}
            </p>
            <p>
              {applications.length
                ? "Try a different keyword or status filter."
                : "Create your first application to start tracking your job search."}
            </p>
            <div>
              <Button size="sm" onClick={openCreate}>
                Create application
              </Button>
            </div>
          </Card>
        ) : (
          sortedApplications.map((item) => {
            const missingResume = !!item.linkedResumeId && !item.linkedResumeTitle;
            return (
              <Card
                key={item.id}
                className="flex flex-wrap items-start justify-between gap-3 py-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{item.title}</p>
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATUS_BADGE_CLASSES[item.status]}`}
                    >
                      {STATUS_OPTIONS.find((s) => s.id === item.status)?.label}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {item.companyName || "No company"} · updated{" "}
                    {new Date(item.updatedAt).toLocaleString()}
                  </p>
                  {item.appliedAt ? (
                    <p className="mt-1 text-xs text-muted">
                      Applied on {new Date(item.appliedAt).toLocaleDateString()}
                    </p>
                  ) : null}
                  {item.linkedResumeTitle ? (
                    <p className="mt-1 text-xs text-muted">
                      Linked resume: {item.linkedResumeTitle}
                    </p>
                  ) : null}
                  {missingResume ? (
                    <p className="mt-1 text-xs text-muted">Resume unavailable</p>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  {item.jobUrl ? (
                    <Button size="sm" variant="outline" asChild>
                      <a
                        href={item.jobUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Open job link"
                        title="Open job link"
                      >
                        <Link2 className="size-4" />
                      </a>
                    </Button>
                  ) : null}
                  <Button size="sm" variant="outline" onClick={() => void openEdit(item)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => setDeleting(item)}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </section>

      <Dialog
        open={panelOpen}
        onOpenChange={(open) => {
          if (!busy) setPanelOpen(open);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <form onSubmit={(e) => void submitForm(e)} className="space-y-4">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "Edit application" : "Create application"}
              </DialogTitle>
              <DialogDescription>
                Save core details now and update them as your process moves
                forward.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-1">
              <label htmlFor="app-title" className="text-xs text-muted">
                Title
              </label>
              <Input
                id="app-title"
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
                autoFocus
                disabled={busy}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="app-company" className="text-xs text-muted">
                Company name (optional)
              </label>
              <Input
                id="app-company"
                value={form.companyName}
                onChange={(e) => setField("companyName", e.target.value)}
                disabled={busy}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="app-description" className="text-xs text-muted">
                Description (optional)
              </label>
              <Textarea
                id="app-description"
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                disabled={busy}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="app-url" className="text-xs text-muted">
                Job posting URL (optional)
              </label>
              <Input
                id="app-url"
                value={form.jobUrl}
                onChange={(e) => setField("jobUrl", e.target.value)}
                placeholder="https://example.com/jobs/123"
                disabled={busy}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="app-status" className="text-xs text-muted">
                  Status
                </label>
                <select
                  id="app-status"
                  value={form.status}
                  onChange={(e) =>
                    setField("status", e.target.value as ApplicationStatus)
                  }
                  disabled={busy}
                  className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="app-applied-at" className="text-xs text-muted">
                  Applied date (optional)
                </label>
                <Input
                  id="app-applied-at"
                  type="date"
                  value={form.appliedAt}
                  onChange={(e) => setField("appliedAt", e.target.value)}
                  disabled={busy}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="app-resume" className="text-xs text-muted">
                Linked resume (optional)
              </label>
              <select
                id="app-resume"
                value={form.linkedResumeId}
                onChange={(e) => setField("linkedResumeId", e.target.value)}
                disabled={busy || resumesLoading}
                className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm"
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
            </div>

            {isEditing && editing?.linkedResumeTitle ? (
              <div className="text-xs text-muted">
                <span>Linked resume: {editing.linkedResumeTitle}. </span>
                {editing.linkedResumeId ? (
                  <Link
                    href={`/workspace/${editing.linkedResumeId}`}
                    className="text-accent hover:underline"
                  >
                    Open resume
                  </Link>
                ) : null}
              </div>
            ) : null}

            {isEditing && editing?.linkedResumeId && !editing.linkedResumeTitle ? (
              <p className="text-xs text-muted">Resume unavailable</p>
            ) : null}

            {isEditing && form.jobUrl ? (
              <div className="text-xs text-muted">
                <a
                  href={form.jobUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent hover:underline"
                >
                  Open job posting
                </a>
              </div>
            ) : null}

            <div className="rounded-md border border-border/70 bg-surface p-3 text-xs text-muted">
              <p className="font-medium text-foreground">Cover letter</p>
              <p className="mt-1">
                Coming soon. You will be able to attach a cover letter once cover
                letters are available as a resource.
              </p>
            </div>

            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => setPanelOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? "Saving…" : "Save application"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open && !busy) setDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete application?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting
                ? `“${deleting.title}” will be permanently deleted. Linked resumes are not affected.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-danger text-white hover:opacity-90"
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
            >
              {busy ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
