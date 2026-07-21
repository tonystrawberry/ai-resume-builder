"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { LogoSection } from "@/lib/resume/logo-sections";

/** Compact logo/icon upload inline in resume preview. */
export function EntryLogoSlot({
  profileId,
  section,
  itemId,
  initialLogoUrl,
  editable = false,
  onChanged,
  className,
  privacyBlur = false,
}: {
  profileId?: string;
  section: LogoSection;
  itemId: string;
  initialLogoUrl?: string;
  editable?: boolean;
  onChanged?: (logoUrl?: string) => void;
  className?: string;
  /** CSS-blur the logo in privacy mode. */
  privacyBlur?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLogoUrl(initialLogoUrl);
  }, [initialLogoUrl]);

  async function upload(file?: File) {
    if (!file || !editable || !profileId) return;
    setBusy(true);
    try {
      const body = new FormData();
      body.set("profileId", profileId);
      body.set("section", section);
      body.set("itemId", itemId);
      body.set("logo", file);
      const res = await fetch("/api/profile/logo", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) return;
      setLogoUrl(json.logoUrl);
      onChanged?.(json.logoUrl);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  if (!editable && !logoUrl) return null;

  // Empty editable slot: same footprint as a logo so it isn't clipped by
  // page overflow; print hides it so text aligns with PDF (no empty column).
  if (editable && !logoUrl) {
    return (
      <div
        className={cn(
          "entry-logo-slot relative h-9 w-9 shrink-0 self-start print:hidden",
          className,
        )}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-md border border-dashed border-border bg-surface text-xs text-muted">
          +
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/svg+xml"
          className="hidden"
          onChange={(e) => void upload(e.target.files?.[0])}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="absolute inset-0 cursor-pointer rounded-md"
          title="Add logo"
          aria-label="Add logo"
        />
      </div>
    );
  }

  return (
    <div
      className={cn("entry-logo-slot relative shrink-0", className)}
      data-privacy-blur={privacyBlur ? "true" : undefined}
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt=""
          className="h-9 w-9 rounded-md object-contain p-0.5"
        />
      ) : null}
      {editable ? (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/svg+xml"
            className="hidden"
            onChange={(e) => void upload(e.target.files?.[0])}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "absolute inset-0 rounded-md print:hidden",
              "cursor-pointer opacity-0 hover:opacity-100 hover:bg-black/5",
            )}
            title="Replace logo"
            aria-label="Replace logo"
          />
        </>
      ) : null}
    </div>
  );
}
