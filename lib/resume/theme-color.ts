import type { CSSProperties } from "react";

export const DEFAULT_PRIMARY_COLOR = "#0f6e56";
export const DEFAULT_PRIMARY_FOREGROUND = "#f4fbf8";

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

export function isValidPrimaryColor(value: string): boolean {
  return HEX_COLOR.test(value);
}

/** Normalize `<input type="color">` / pasted values to #RRGGBB */
export function normalizePrimaryColor(value: string): string | null {
  const trimmed = value.trim();
  if (HEX_COLOR.test(trimmed)) return trimmed.toLowerCase();
  const short = trimmed.match(/^#([0-9A-Fa-f]{3})$/);
  if (short) {
    const [r, g, b] = short[1].split("");
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return null;
}

export function primaryForeground(hex: string): string {
  const normalized = normalizePrimaryColor(hex);
  if (!normalized) return DEFAULT_PRIMARY_FOREGROUND;
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#1a2332" : DEFAULT_PRIMARY_FOREGROUND;
}

export function resumeThemeCssVars(primaryColor: string): CSSProperties {
  return {
    "--resume-primary": primaryColor,
    "--resume-primary-fg": primaryForeground(primaryColor),
  } as CSSProperties;
}
