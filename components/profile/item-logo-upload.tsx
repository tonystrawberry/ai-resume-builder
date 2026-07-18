"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { LogoSection } from "@/lib/resume/logo-sections";

export function ItemLogoUpload({
  section,
  itemId,
  label,
  initialLogoUrl,
  onChanged,
}: {
  section: LogoSection;
  itemId: string;
  label: string;
  initialLogoUrl?: string;
  onChanged?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file?: File) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.set("section", section);
      body.set("itemId", itemId);
      body.set("logo", file);
      const res = await fetch("/api/profile/logo", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.message || "Upload failed");
        return;
      }
      setLogoUrl(json.logoUrl);
      onChanged?.();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ section, itemId });
      const res = await fetch(`/api/profile/logo?${qs}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error?.message || "Remove failed");
        return;
      }
      setLogoUrl(undefined);
      onChanged?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/80 bg-card px-3 py-2">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-surface">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className="h-full w-full object-contain p-0.5" />
        ) : (
          <span className="text-[10px] text-muted">Logo</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{label}</p>
        <p className="text-xs capitalize text-muted">{section}</p>
        {error ? <p className="text-xs text-danger">{error}</p> : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/svg+xml"
        className="hidden"
        onChange={(e) => void upload(e.target.files?.[0])}
      />
      <Button
        size="sm"
        variant="outline"
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? "…" : logoUrl ? "Replace" : "Add"}
      </Button>
      {logoUrl ? (
        <Button
          size="sm"
          variant="ghost"
          type="button"
          disabled={busy}
          onClick={() => void remove()}
        >
          Remove
        </Button>
      ) : null}
    </div>
  );
}
