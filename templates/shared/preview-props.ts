import type { ResumePatch } from "@/lib/resume/schema";

export type ResumePatchFn = (patch: ResumePatch) => void | Promise<void>;

export type ResumePreviewProps = {
  data: import("@/lib/resume/schema").MasterResume;
  locale?: string;
  profileId?: string;
  /** Photo / logo uploads */
  editable?: boolean;
  /** Click-to-edit text on the canvas (source locale only). */
  textEditable?: boolean;
  /** CSS-blur personal identity + developed app/project names. */
  privacyMode?: boolean;
  onMediaChanged?: () => void;
  onPatch?: ResumePatchFn;
};
