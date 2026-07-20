/**
 * Path prefixes inside the single Vercel Blob store (`BLOB_READ_WRITE_TOKEN`).
 * All uploads share one store — categories are separated by top-level prefix only.
 */
export const BLOB_PREFIX = {
  /** Shared / exported resume PDFs */
  resume: "resume",
  /** Profile photos and entry logos */
  images: "images",
} as const;

/** `resume/shares/{token}/resume.pdf` */
export function blobResumeSharePath(token: string): string {
  return `${BLOB_PREFIX.resume}/shares/${token}/resume.pdf`;
}

/** `images/photos/{profileId}/photo.{ext}` */
export function blobProfilePhotoPath(profileId: string, ext: string): string {
  return `${BLOB_PREFIX.images}/photos/${profileId}/photo.${ext}`;
}

/** `images/logos/{profileId}/{filename}` */
export function blobEntryLogoPath(profileId: string, filename: string): string {
  return `${BLOB_PREFIX.images}/logos/${profileId}/${filename}`;
}
