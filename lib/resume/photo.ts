import fs from "fs";
import path from "path";

/** Resolve a stored image path/URL into something @react-pdf Image can load. */
export function resolveImageSrcForPdf(imageUrl?: string): string | undefined {
  if (!imageUrl) return undefined;
  if (
    imageUrl.startsWith("data:") ||
    imageUrl.startsWith("http://") ||
    imageUrl.startsWith("https://")
  ) {
    return imageUrl;
  }
  // Strip cache-buster query if present
  const clean = imageUrl.split("?")[0] ?? imageUrl;
  if (clean.startsWith("/uploads/")) {
    const filePath = path.join(process.cwd(), "public", clean);
    if (!fs.existsSync(filePath)) return undefined;
    const buf = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase().replace(".", "") || "jpeg";
    const mime =
      ext === "jpg" || ext === "jpeg"
        ? "jpeg"
        : ext === "png"
          ? "png"
          : ext === "webp"
            ? "webp"
            : "jpeg";
    return `data:image/${mime};base64,${buf.toString("base64")}`;
  }
  return undefined;
}

/** @deprecated use resolveImageSrcForPdf */
export const resolvePhotoSrcForPdf = resolveImageSrcForPdf;
