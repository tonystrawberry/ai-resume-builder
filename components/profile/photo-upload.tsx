"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export function PhotoUpload({
  initialPhotoUrl,
  onChanged,
}: {
  initialPhotoUrl?: string;
  onChanged?: (photoUrl?: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [photoUrl, setPhotoUrl] = useState(initialPhotoUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPhotoUrl(initialPhotoUrl);
  }, [initialPhotoUrl]);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("photo", file);
      const res = await fetch("/api/profile/photo", {
        method: "POST",
        body,
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.message || "Upload failed");
        return;
      }
      setPhotoUrl(json.photoUrl);
      onChanged?.(json.photoUrl);
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
      const res = await fetch("/api/profile/photo", { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error?.message || "Remove failed");
        return;
      }
      setPhotoUrl(undefined);
      onChanged?.(undefined);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="h-20 w-20 overflow-hidden rounded-full border border-border bg-surface">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt="Resume photo"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted">
            No photo
          </div>
        )}
      </div>
      <div className="space-y-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            void onFile(file);
          }}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? "Working…" : photoUrl ? "Replace photo" : "Upload photo"}
          </Button>
          {photoUrl ? (
            <Button
              size="sm"
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => void remove()}
            >
              Remove
            </Button>
          ) : null}
        </div>
        <p className="text-xs text-muted">JPEG, PNG, or WebP · max 2MB</p>
        {error ? <p className="text-xs text-danger">{error}</p> : null}
      </div>
    </div>
  );
}
