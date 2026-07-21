"use client";

import { Fragment } from "react";
import { InlineText } from "@/components/preview/inline-text";
import { PreviewDeleteButton } from "@/components/preview/preview-delete";
import {
  formatLinkDisplay,
  normalizeWebsiteUrl,
  type IdentityLink,
} from "@/lib/resume/identity-links";
import { cn } from "@/lib/utils";

export type { IdentityLink };
export { formatLinkDisplay, formatIdentityLinksForMeta } from "@/lib/resume/identity-links";

/**
 * Website / profile links in the resume header.
 * Supports add, edit URL, and remove when `canEdit` is true.
 *
 * Separators are sibling flex items (not wrapped with the link) so parent
 * `gap-x-*` spacing matches email · phone · location.
 */
export function IdentityLinksRow({
  links,
  canEdit,
  onChange,
  className,
  inputClassName,
  separatorClassName,
  privacyBlur = false,
}: {
  links: IdentityLink[] | undefined;
  canEdit: boolean;
  onChange?: (next: IdentityLink[]) => void;
  className?: string;
  inputClassName?: string;
  separatorClassName?: string;
  privacyBlur?: boolean;
}) {
  const items = links ?? [];

  function commitLinks(next: IdentityLink[]) {
    onChange?.(next);
  }

  function updateUrl(index: number, raw: string) {
    const url = normalizeWebsiteUrl(raw);
    if (!url) {
      commitLinks(items.filter((_, i) => i !== index));
      return;
    }
    const next = items.map((link, i) =>
      i === index ? { ...link, url, label: link.label || "Website" } : link,
    );
    commitLinks(next);
  }

  function addUrl(raw: string) {
    const url = normalizeWebsiteUrl(raw);
    if (!url) return;
    if (items.some((l) => l.url === url)) return;
    commitLinks([...items, { label: "Website", url }]);
  }

  if (!items.length && !canEdit) return null;

  return (
    <>
      {items.map((link, index) => (
        <Fragment key={`${link.url}-${index}`}>
          <span
            className={cn("text-border", separatorClassName, "print:inline")}
            aria-hidden
          >
            ·
          </span>
          {canEdit ? (
            <span
              className={cn(
                "group/link inline-flex max-w-full items-baseline gap-0.5",
                className,
              )}
            >
              <InlineText
                value={link.url}
                editable
                className="max-w-[14rem] truncate"
                inputClassName={inputClassName}
                emptyLabel="website"
                placeholder="https://yoursite.com"
                onCommit={(url) => updateUrl(index, url)}
                privacyBlur={privacyBlur}
              />
              <PreviewDeleteButton
                label="Remove website"
                className="opacity-0 group-hover/link:opacity-100 focus-visible:opacity-100"
                onDelete={() =>
                  commitLinks(items.filter((_, i) => i !== index))
                }
              />
            </span>
          ) : (
            <a
              href={normalizeWebsiteUrl(link.url) || link.url}
              target="_blank"
              rel="noreferrer"
              data-privacy-blur={privacyBlur ? "true" : undefined}
              className={cn(
                "max-w-[14rem] truncate underline-offset-2 hover:underline",
                className,
              )}
            >
              {formatLinkDisplay(link)}
            </a>
          )}
        </Fragment>
      ))}
      {canEdit ? (
        <Fragment>
          <span
            className={cn("text-border print:hidden", separatorClassName)}
            aria-hidden
          >
            ·
          </span>
          <InlineText
            value=""
            editable
            emptyLabel="+ Website"
            placeholder="https://yoursite.com"
            inputClassName={inputClassName}
            className={className}
            onCommit={addUrl}
          />
        </Fragment>
      ) : null}
    </>
  );
}
