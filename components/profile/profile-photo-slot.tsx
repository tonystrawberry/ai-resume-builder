"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Profile photo upload inline in resume preview header. */
export function ProfilePhotoSlot({
  profileId,
  initialPhotoUrl,
  editable = false,
  onChanged,
  variant = "classic",
  privacyBlur = false,
}: {
  profileId?: string;
  initialPhotoUrl?: string;
  editable?: boolean;
  onChanged?: (photoUrl?: string) => void;
  variant?: "classic" | "modern";
  /** CSS-blur the photo in privacy mode. */
  privacyBlur?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [photoUrl, setPhotoUrl] = useState(initialPhotoUrl);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPhotoUrl(initialPhotoUrl);
  }, [initialPhotoUrl]);

  const frameClass =
    variant === "modern"
      ? "h-24 w-24 rounded-full border-2 border-white/40"
      : "h-20 w-20 rounded-full border border-border";

  async function upload(file?: File) {
    if (!file || !editable || !profileId) return;
    setBusy(true);
    try {
      const body = new FormData();
      body.append("profileId", profileId);
      body.append("photo", file);
      const res = await fetch("/api/profile/photo", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) return;
      setPhotoUrl(json.photoUrl);
      onChanged?.(json.photoUrl);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  if (!editable && !photoUrl) return null;

  // Empty editable photo: overlay only so print layout matches (no photo).
  if (editable && !photoUrl) {
    return (
      <div className="profile-photo-slot relative -mr-4 w-0 shrink-0 print:hidden">
        <div
          className={cn(
            "absolute right-full top-0 mr-4 flex items-center justify-center text-xs",
            frameClass,
            variant === "modern"
              ? "border-white/40 text-white/80"
              : "border border-border bg-surface text-muted",
          )}
        >
          +
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => void upload(e.target.files?.[0])}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "absolute right-full top-0 mr-4 cursor-pointer",
            frameClass,
          )}
          title="Add photo"
          aria-label="Add profile photo"
        />
      </div>
    );
  }

  return (
    <div
      className={cn("profile-photo-slot relative shrink-0", frameClass)}
      data-privacy-blur={privacyBlur ? "true" : undefined}
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl}
          alt=""
          className={cn("h-full w-full object-cover", frameClass)}
        />
      ) : null}
      {editable ? (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => void upload(e.target.files?.[0])}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "absolute inset-0 print:hidden",
              frameClass,
              "cursor-pointer opacity-0 hover:opacity-100 hover:bg-black/10",
            )}
            title="Replace photo"
            aria-label="Replace profile photo"
          />
        </>
      ) : null}
    </div>
  );
}
