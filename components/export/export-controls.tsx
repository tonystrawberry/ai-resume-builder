"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { IncompleteWarning } from "@/components/export/incomplete-warning";
import { RESUME_LOCALES } from "@/lib/resume/locales";
import type { MasterResume } from "@/lib/resume/schema";

export function ExportControls({
  profileId,
  locale,
  onLocaleChange,
  hasCriticalGaps = false,
}: {
  profileId: string;
  locale: string;
  onLocaleChange: (locale: string, data?: MasterResume) => void;
  hasCriticalGaps?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [warningOpen, setWarningOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function translate(next: string) {
    if (busy || shareBusy) return;
    if (next === locale) return;
    setBusy(true);
    setError(null);
    setShareUrl(null);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, locale: next }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error?.message || "Translate failed");
        return;
      }
      onLocaleChange(next, json.data as MasterResume);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Translate failed");
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    if (busy || shareBusy) return;
    setShareBusy(true);
    setError(null);
    setCopied(false);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, locale }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error?.message || "Share failed");
        return;
      }
      const path = json.link?.path as string;
      const url =
        (json.link?.url as string)?.startsWith("http")
          ? (json.link.url as string)
          : `${window.location.origin}${path}`;
      setShareUrl(url);
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Share failed");
    } finally {
      setShareBusy(false);
    }
  }

  function exportPdf(acknowledgeIncomplete: boolean) {
    setError(null);
    if (hasCriticalGaps && !acknowledgeIncomplete) {
      setWarningOpen(true);
      return;
    }
    setWarningOpen(false);
    window.print();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {RESUME_LOCALES.map((l) => (
          <Button
            key={l.id}
            size="sm"
            variant={locale === l.id ? "default" : "outline"}
            disabled={busy || shareBusy}
            onClick={() => void translate(l.id)}
          >
            {l.label}
          </Button>
        ))}
        <Button
          size="sm"
          variant="secondary"
          disabled={busy || shareBusy}
          onClick={() => exportPdf(false)}
        >
          Export PDF
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={busy || shareBusy}
          onClick={() => void share()}
        >
          {shareBusy ? "Sharing…" : "Share"}
        </Button>
      </div>
      {shareUrl ? (
        <div className="rounded-md border border-border bg-card px-3 py-2 text-xs">
          <p className="text-muted">
            Public link created for{" "}
            <span className="font-medium text-foreground">
              {RESUME_LOCALES.find((l) => l.id === locale)?.label ?? locale}
            </span>
            {copied ? " · copied to clipboard" : ""}
          </p>
          <p className="mt-1 break-all font-mono">{shareUrl}</p>
          <p className="mt-2">
            <Link href="/sharing" className="text-accent underline-offset-2 hover:underline">
              Manage shares
            </Link>
          </p>
        </div>
      ) : null}
      {busy ? (
        <p className="text-xs text-muted">Translating… this can take a few seconds.</p>
      ) : !shareUrl ? (
        <p className="text-xs text-muted">
          Opens the print dialog — choose “Save as PDF”. Set margins to
          <span className="font-medium text-foreground"> None</span> and turn off
          headers/footers so the PDF matches the preview scale. Share creates a
          public link for the selected language.
        </p>
      ) : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <IncompleteWarning
        open={warningOpen}
        onCancel={() => setWarningOpen(false)}
        onConfirm={() => exportPdf(true)}
      />
    </div>
  );
}
