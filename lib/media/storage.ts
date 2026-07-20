import fs from "fs/promises";
import path from "path";
import { del, put } from "@vercel/blob";

/**
 * Single Vercel Blob store (`BLOB_READ_WRITE_TOKEN`) for all file uploads.
 * Categories are separated by path prefix — see `lib/blob/paths.ts`.
 */
export function isBlobStorageConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function isRemoteUrl(url: string): boolean {
  return (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("blob:")
  );
}

/** Delete a previously stored upload (Blob URL or local `/uploads/...` path). */
export async function deleteStoredUpload(url: string | null | undefined) {
  if (!url) return;
  const clean = url.split("?")[0] ?? url;

  if (isRemoteUrl(clean)) {
    if (!isBlobStorageConfigured()) return;
    try {
      await del(clean);
    } catch (e) {
      console.warn("[media] failed to delete blob", e);
    }
    return;
  }

  if (clean.startsWith("/uploads/")) {
    const abs = path.join(process.cwd(), "public", clean.slice(1));
    await fs.unlink(abs).catch(() => undefined);
  }
}

/** Remove alternate local extensions for the same logical file (dev disk only). */
export async function deleteLocalUploadVariants(
  dir: string,
  basename: string,
  extensions: string[],
  keepExt?: string,
) {
  if (isBlobStorageConfigured()) return;
  for (const ext of extensions) {
    if (keepExt && ext === keepExt) continue;
    await fs.unlink(path.join(dir, `${basename}.${ext}`)).catch(() => undefined);
  }
}

/**
 * Store an uploaded image. Uses Vercel Blob when `BLOB_READ_WRITE_TOKEN` is set;
 * otherwise writes under `public/` for local dev.
 */
export async function storeUploadedImage(params: {
  /** Blob pathname — use helpers from `lib/blob/paths.ts` (e.g. `images/photos/...`) */
  storageKey: string;
  buffer: Buffer;
  contentType: string;
  previousUrl?: string | null;
}): Promise<string> {
  if (params.previousUrl) {
    await deleteStoredUpload(params.previousUrl);
  }

  if (isBlobStorageConfigured()) {
    const blob = await put(params.storageKey, params.buffer, {
      access: "public",
      contentType: params.contentType,
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    return blob.url;
  }

  const rel = params.storageKey.replace(/^\/+/, "");
  const abs = path.join(process.cwd(), "public", rel);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, params.buffer);
  return `/${rel}`;
}

export function uploadCacheBuster(url: string): string {
  const base = url.split("?")[0] ?? url;
  return `${base}?v=${Date.now()}`;
}
