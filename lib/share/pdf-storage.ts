import { del, put } from "@vercel/blob";
import type { MasterResume } from "@/lib/resume/schema";
import type { TemplateId } from "@/lib/resume/templates";
import { renderResumePdf } from "@/lib/pdf/render";

export function isBlobStorageConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function sharePdfPath(token: string): string {
  return `shares/${token}/resume.pdf`;
}

/**
 * Render + upload a shared resume PDF to Vercel Blob.
 * Returns null when Blob is not configured (local/dev fallback = on-demand render).
 */
export async function storeSharedResumePdf(params: {
  token: string;
  data: MasterResume;
  templateId: TemplateId;
  locale: string;
  previousPdfUrl?: string | null;
}): Promise<string | null> {
  if (!isBlobStorageConfigured()) return null;

  const buffer = await renderResumePdf(
    params.data,
    params.templateId,
    params.locale,
  );

  if (params.previousPdfUrl) {
    await deleteSharedResumePdf(params.previousPdfUrl);
  }

  const blob = await put(sharePdfPath(params.token), buffer, {
    access: "public",
    contentType: "application/pdf",
    addRandomSuffix: false,
    allowOverwrite: true,
  });

  return blob.url;
}

export async function deleteSharedResumePdf(pdfUrl: string | null | undefined) {
  if (!pdfUrl || !isBlobStorageConfigured()) return;
  try {
    await del(pdfUrl);
  } catch (e) {
    console.warn("[share/pdf] failed to delete blob", e);
  }
}
