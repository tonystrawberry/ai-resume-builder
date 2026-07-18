"use client";

import type { MasterResume } from "@/lib/resume/schema";
import { InlineText } from "@/components/preview/inline-text";
import type { ResumePatchFn } from "@/templates/shared/preview-props";

export function ProjectSection({
  projects,
  textEditable = false,
  onPatch,
}: {
  projects: MasterResume["projects"];
  textEditable?: boolean;
  onPatch?: ResumePatchFn;
}) {
  if (!projects.length) return null;

  return (
    <ul className="mt-2 space-y-3 text-sm">
      {projects.map((p) => (
        <li key={p.id}>
          <InlineText
            as="p"
            className="font-medium"
            value={p.name}
            editable={textEditable}
            placeholder="Project name"
            onCommit={(name) =>
              onPatch?.({ projects: [{ ...p, name, provenance: "user" }] })
            }
          />
          <InlineText
            as="p"
            multiline
            className="mt-0.5 text-muted"
            value={p.description ?? ""}
            editable={textEditable}
            emptyLabel="Add a description"
            placeholder="Description"
            onCommit={(description) =>
              onPatch?.({
                projects: [
                  {
                    ...p,
                    description: description || undefined,
                    provenance: "user",
                  },
                ],
              })
            }
          />
          {p.technologies.length ? (
            <p className="mt-1 text-xs text-muted">
              {p.technologies.join(" · ")}
            </p>
          ) : null}
          {p.highlights.length ? (
            <ul className="mt-1 list-disc space-y-0.5 pl-5">
              {p.highlights.map((h, i) => (
                <li key={i}>
                  <InlineText
                    value={h}
                    editable={textEditable}
                    placeholder="Highlight"
                    onCommit={(next) => {
                      const highlights = [...p.highlights];
                      if (!next.trim()) highlights.splice(i, 1);
                      else highlights[i] = next;
                      onPatch?.({
                        projects: [{ ...p, highlights, provenance: "user" }],
                      });
                    }}
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
