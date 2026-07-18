"use client";

import type { MasterResume } from "@/lib/resume/schema";
import type { TemplateId } from "@/lib/resume/templates";
import type { ResumePatchFn } from "@/templates/shared/preview-props";
import { A4PreviewShell } from "@/components/preview/a4-preview-shell";
import { ClassicPreview } from "@/templates/classic/preview";
import { ModernPreview } from "@/templates/modern/preview";

export function ResumeFrame({
  data,
  templateId,
  locale = "en",
  profileId,
  editable = false,
  textEditable = false,
  onMediaChanged,
  onPatch,
}: {
  data: MasterResume;
  templateId: TemplateId;
  locale?: string;
  profileId?: string;
  editable?: boolean;
  textEditable?: boolean;
  onMediaChanged?: () => void;
  onPatch?: ResumePatchFn;
}) {
  const previewProps = {
    data,
    locale,
    profileId,
    editable,
    textEditable,
    onMediaChanged,
    onPatch,
  };

  return (
    <A4PreviewShell>
      {templateId === "modern" ? (
        <ModernPreview {...previewProps} />
      ) : (
        <ClassicPreview {...previewProps} />
      )}
    </A4PreviewShell>
  );
}
