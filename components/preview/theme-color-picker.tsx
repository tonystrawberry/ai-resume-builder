"use client";

import { useState } from "react";
import {
  DEFAULT_PRIMARY_COLOR,
  normalizePrimaryColor,
} from "@/lib/resume/theme-color";

export function ThemeColorPicker({
  profileId,
  value,
  onChange,
}: {
  profileId: string;
  value: string;
  onChange: (color: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const color = normalizePrimaryColor(value) ?? DEFAULT_PRIMARY_COLOR;

  async function pick(next: string) {
    const normalized = normalizePrimaryColor(next);
    if (!normalized) return;
    setBusy(true);
    try {
      onChange(normalized);
      await fetch("/api/preview", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, primaryColor: normalized }),
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted">Primary</span>
      <input
        type="color"
        value={color}
        disabled={busy}
        onChange={(e) => void pick(e.target.value)}
        className="h-9 w-12 cursor-pointer rounded border border-border bg-card p-0.5 disabled:opacity-50"
        aria-label="Resume primary color"
      />
      <span className="font-mono text-xs text-muted">{color}</span>
    </label>
  );
}
