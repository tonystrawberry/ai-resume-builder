import type { MasterResume } from "@/lib/resume/schema";

export type ResumePatchFn = (patch: Partial<MasterResume>) => void | Promise<void>;

export type ResumePreviewProps = {
  data: MasterResume;
  locale?: string;
  profileId?: string;
  /** Photo / logo uploads */
  editable?: boolean;
  /** Click-to-edit text on the canvas (source locale only). */
  textEditable?: boolean;
  onMediaChanged?: () => void;
  onPatch?: ResumePatchFn;
};
