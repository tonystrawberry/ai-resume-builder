import { NextResponse } from "next/server";
import path from "path";
import { auth } from "@/lib/auth";
import {
  badRequest,
  notFound,
  serviceUnavailable,
  unauthorized,
  unprocessable,
} from "@/lib/api-error";
import { getOwnedProfile, profileToResponse, saveMasterResume } from "@/lib/etl/persist";
import { masterResumeSchema } from "@/lib/resume/schema";
import {
  findLogoSectionItem,
  isLogoSection,
  type LogoSection,
} from "@/lib/resume/logo-sections";
import {
  deleteLocalUploadVariants,
  deleteStoredUpload,
  isBlobStorageConfigured,
  storeUploadedImage,
  uploadCacheBuster,
} from "@/lib/media/storage";
import { blobEntryLogoPath } from "@/lib/blob/paths";

const MAX_BYTES = 1 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/svg+xml"]);
const LOGO_EXTENSIONS = ["jpg", "png", "webp", "svg"] as const;

function safeItemId(id: string) {
  return id.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);
}

function extForMime(type: string): (typeof LOGO_EXTENSIONS)[number] {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/svg+xml") return "svg";
  return "jpg";
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const form = await req.formData();
  const profileId = String(form.get("profileId") || "");
  const section = String(form.get("section") || "");
  const itemId = String(form.get("itemId") || "");
  const file = form.get("logo");

  if (!profileId) return badRequest("profileId is required");
  if (!isLogoSection(section)) {
    return badRequest(
      "section must be experience, education, certifications, or projects",
    );
  }
  if (!itemId) return badRequest("itemId is required");
  if (!(file instanceof File)) return badRequest("logo file is required");
  if (!ALLOWED.has(file.type)) {
    return badRequest("Only JPEG, PNG, WebP, or SVG logos are allowed");
  }
  if (file.size > MAX_BYTES) {
    return unprocessable("Logo must be 1MB or smaller");
  }

  const profile = await getOwnedProfile(session.user.id, profileId);
  if (!profile) return notFound("Resume not found");

  const data = masterResumeSchema.parse(profile.data);
  const item = findLogoSectionItem(data, section as LogoSection, itemId);
  if (!item) return notFound("Item not found on profile");

  const ext = extForMime(file.type);
  const base = `${section}_${safeItemId(itemId)}`;
  const filename = `${base}.${ext}`;
  const storageKey = isBlobStorageConfigured()
    ? blobEntryLogoPath(profile.id, filename)
    : `uploads/logos/${profile.id}/${filename}`;

  let storedUrl: string;
  try {
    storedUrl = await storeUploadedImage({
      storageKey,
      buffer: Buffer.from(await file.arrayBuffer()),
      contentType: file.type,
      previousUrl: item.logoUrl,
    });
  } catch (e) {
    console.error("[profile/logo] upload failed", e);
    if (!isBlobStorageConfigured()) {
      return serviceUnavailable(
        "Logo storage is not configured. Set BLOB_READ_WRITE_TOKEN on Vercel (Storage → Blob).",
      );
    }
    throw e;
  }

  if (!isBlobStorageConfigured()) {
    const dir = path.join(process.cwd(), "public", "uploads", "logos", profile.id);
    await deleteLocalUploadVariants(dir, base, [...LOGO_EXTENSIONS], ext);
  }

  item.logoUrl = storedUrl.split("?")[0];

  const updated = await saveMasterResume({ profileId: profile.id, data });
  return NextResponse.json({
    profile: profileToResponse(updated),
    logoUrl: uploadCacheBuster(storedUrl),
  });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get("profileId") || "";
  const section = searchParams.get("section") || "";
  const itemId = searchParams.get("itemId") || "";
  if (!profileId) return badRequest("profileId is required");
  if (!isLogoSection(section)) {
    return badRequest(
      "section must be experience, education, certifications, or projects",
    );
  }
  if (!itemId) return badRequest("itemId is required");

  const profile = await getOwnedProfile(session.user.id, profileId);
  if (!profile) return notFound("Resume not found");

  const data = masterResumeSchema.parse(profile.data);
  const item = findLogoSectionItem(data, section as LogoSection, itemId);
  if (!item) return notFound("Item not found on profile");

  await deleteStoredUpload(item.logoUrl);

  if (!isBlobStorageConfigured()) {
    const dir = path.join(process.cwd(), "public", "uploads", "logos", profile.id);
    const base = `${section}_${safeItemId(itemId)}`;
    await deleteLocalUploadVariants(dir, base, [...LOGO_EXTENSIONS]);
  }

  delete item.logoUrl;

  const updated = await saveMasterResume({ profileId: profile.id, data });
  return NextResponse.json({ profile: profileToResponse(updated) });
}
