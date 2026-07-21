"use client";

import { cn } from "@/lib/utils";

/** Wraps content that should be CSS-blurred in privacy mode. */
export function PrivacyBlur({
  active,
  className,
  children,
}: {
  active?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  if (!active) return <>{children}</>;
  return (
    <span
      data-privacy-blur="true"
      className={cn("inline-block max-w-full", className)}
    >
      {children}
    </span>
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Split text so sensitive terms render inside PrivacyBlur spans.
 * Longest terms first to avoid partial overlaps.
 */
export function PrivacySensitiveText({
  text,
  terms,
  active,
  className,
}: {
  text: string;
  terms: string[];
  active?: boolean;
  className?: string;
}) {
  if (!active || !terms.length || !text) {
    return <span className={className}>{text}</span>;
  }

  const pattern = terms
    .filter(Boolean)
    .map(escapeRegExp)
    .join("|");
  if (!pattern) return <span className={className}>{text}</span>;

  const re = new RegExp(`(${pattern})`, "gi");
  const parts = text.split(re);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (!part) return null;
        const isHit = terms.some(
          (t) => t.localeCompare(part, undefined, { sensitivity: "accent" }) === 0
            || t.toLowerCase() === part.toLowerCase(),
        );
        if (isHit) {
          return (
            <span key={`${i}-${part}`} data-privacy-blur="true">
              {part}
            </span>
          );
        }
        return <span key={`${i}-${part}`}>{part}</span>;
      })}
    </span>
  );
}
