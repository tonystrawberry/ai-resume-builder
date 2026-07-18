"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RESUME_LOCALES } from "@/lib/resume/locales";

type ShareLink = {
  id: string;
  token: string;
  locale: string;
  templateId: string;
  primaryColor: string;
  sourceVersion: number;
  status: "active" | "revoked";
  label: string | null;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  revokedAt: string | null;
  path: string;
  url: string;
  resumeTitle?: string;
  profileId?: string;
};

function localeLabel(id: string) {
  return RESUME_LOCALES.find((l) => l.id === id)?.label ?? id;
}

export function SharingClient({
  initialLinks,
}: {
  initialLinks: ShareLink[];
}) {
  const [links, setLinks] = useState(initialLinks);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/share");
    if (!res.ok) return;
    const json = await res.json();
    setLinks(json.links);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function runAction(id: string, action: "revoke" | "refresh" | "reactivate") {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/share/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error?.message || "Action failed");
        return;
      }
      setLinks((prev) =>
        prev.map((l) => (l.id === id ? (json.link as ShareLink) : l)),
      );
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this share link permanently?")) return;
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/share/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error?.message || "Delete failed");
        return;
      }
      setLinks((prev) => prev.filter((l) => l.id !== id));
    } finally {
      setBusyId(null);
    }
  }

  async function copyLink(link: ShareLink) {
    const absolute =
      link.url.startsWith("http")
        ? link.url
        : `${window.location.origin}${link.path}`;
    await navigator.clipboard.writeText(absolute);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const active = links.filter((l) => l.status === "active");
  const revoked = links.filter((l) => l.status === "revoked");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Sharing</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Manage public links to your resume. Each link freezes a snapshot in
          one language — refresh it to push your latest content.
        </p>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Active links</h2>
        {!active.length ? (
          <Card className="py-5 text-sm text-muted">
            No active shares yet. Open a resume and use{" "}
            <span className="font-medium text-foreground">Share</span> to create
            a public link for the selected language.
          </Card>
        ) : (
          active.map((link) => (
            <ShareCard
              key={link.id}
              link={link}
              busy={busyId === link.id}
              copied={copiedId === link.id}
              onCopy={() => void copyLink(link)}
              onRefresh={() => void runAction(link.id, "refresh")}
              onRevoke={() => void runAction(link.id, "revoke")}
              onDelete={() => void remove(link.id)}
            />
          ))
        )}
      </section>

      {revoked.length ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Revoked</h2>
          {revoked.map((link) => (
            <ShareCard
              key={link.id}
              link={link}
              busy={busyId === link.id}
              copied={copiedId === link.id}
              onCopy={() => void copyLink(link)}
              onRefresh={() => void runAction(link.id, "refresh")}
              onReactivate={() => void runAction(link.id, "reactivate")}
              onDelete={() => void remove(link.id)}
            />
          ))}
        </section>
      ) : null}
    </div>
  );
}

function ShareCard({
  link,
  busy,
  copied,
  onCopy,
  onRefresh,
  onRevoke,
  onReactivate,
  onDelete,
}: {
  link: ShareLink;
  busy: boolean;
  copied: boolean;
  onCopy: () => void;
  onRefresh: () => void;
  onRevoke?: () => void;
  onReactivate?: () => void;
  onDelete: () => void;
}) {
  const displayUrl = link.url.startsWith("http") ? link.url : link.path;

  return (
    <Card className="space-y-3 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium">
            {link.label || `${localeLabel(link.locale)} resume`}
          </p>
          <p className="mt-1 text-xs text-muted">
            {link.resumeTitle ? `${link.resumeTitle} · ` : ""}
            {localeLabel(link.locale)} · {link.templateId} · v{link.sourceVersion} ·{" "}
            {link.viewCount} view{link.viewCount === 1 ? "" : "s"} · created{" "}
            {new Date(link.createdAt).toLocaleString()}
          </p>
          <p className="mt-2 break-all font-mono text-xs text-muted">{displayUrl}</p>
        </div>
        <span
          className={
            link.status === "active"
              ? "rounded-md bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent"
              : "rounded-md bg-surface px-2 py-0.5 text-xs font-medium text-muted"
          }
        >
          {link.status}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" disabled={busy} onClick={onCopy}>
          {copied ? "Copied" : "Copy link"}
        </Button>
        {link.status === "active" ? (
          <>
            <Button size="sm" variant="secondary" disabled={busy} onClick={onRefresh}>
              Refresh snapshot
            </Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={onRevoke}>
              Revoke
            </Button>
          </>
        ) : (
          <Button size="sm" variant="secondary" disabled={busy} onClick={onReactivate}>
            Reactivate
          </Button>
        )}
        <Button size="sm" variant="danger" disabled={busy} onClick={onDelete}>
          Delete
        </Button>
      </div>
    </Card>
  );
}
