import { NextResponse } from "next/server";
import path from "path";
import type { Prisma } from "@prisma/client";
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
import { prisma } from "@/lib/db";
import {
  deleteLocalUploadVariants,
  deleteStoredUpload,
  isBlobStorageConfigured,
  storeUploadedImage,
  uploadCacheBuster,
} from "@/lib/media/storage";
import { blobProfilePhotoPath } from "@/lib/blob/paths";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const PHOTO_EXTENSIONS = ["jpg", "png", "webp"] as const;

function extForMime(type: string): (typeof PHOTO_EXTENSIONS)[number] {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const form = await req.formData();
  const profileId = String(form.get("profileId") || "");
  if (!profileId) return badRequest("profileId is required");

  const file = form.get("photo");
  if (!(file instanceof File)) {
    return badRequest("photo file is required");
  }
  if (!ALLOWED.has(file.type)) {
    return badRequest("Only JPEG, PNG, or WebP images are allowed");
  }
  if (file.size > MAX_BYTES) {
    return unprocessable("Photo must be 2MB or smaller");
  }

  const profile = await getOwnedProfile(session.user.id, profileId);
  if (!profile) return notFound("Resume not found");

  const data = masterResumeSchema.parse(profile.data);
  const ext = extForMime(file.type);
  const storageKey = isBlobStorageConfigured()
    ? blobProfilePhotoPath(profile.id, ext)
    : `uploads/photos/${profile.id}/photo.${ext}`;

  let storedUrl: string;
  try {
    storedUrl = await storeUploadedImage({
      storageKey,
      buffer: Buffer.from(await file.arrayBuffer()),
      contentType: file.type,
      previousUrl: data.identity.photoUrl,
    });
  } catch (e) {
    console.error("[profile/photo] upload failed", e);
    if (!isBlobStorageConfigured()) {
      return serviceUnavailable(
        "Photo storage is not configured. Set BLOB_READ_WRITE_TOKEN on Vercel (Storage → Blob).",
      );
    }
    throw e;
  }

  if (!isBlobStorageConfigured()) {
    const dir = path.join(process.cwd(), "public", "uploads", "photos", profile.id);
    await deleteLocalUploadVariants(dir, "photo", [...PHOTO_EXTENSIONS], ext);
  }

  data.identity.photoUrl = storedUrl.split("?")[0];

  const updated = await saveMasterResume({
    profileId: profile.id,
    data,
  });

  return NextResponse.json({
    profile: profileToResponse(updated),
    photoUrl: uploadCacheBuster(storedUrl),
  });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const url = new URL(req.url);
  const profileId =
    url.searchParams.get("profileId") ||
    String((await req.json().catch(() => ({}))).profileId || "");
  if (!profileId) return badRequest("profileId is required");

  const profile = await getOwnedProfile(session.user.id, profileId);
  if (!profile) return notFound("Resume not found");

  const data = masterResumeSchema.parse(profile.data);
  await deleteStoredUpload(data.identity.photoUrl);

  if (!isBlobStorageConfigured()) {
    const dir = path.join(process.cwd(), "public", "uploads", "photos", profile.id);
    await deleteLocalUploadVariants(dir, "photo", [...PHOTO_EXTENSIONS]);
  }

  delete data.identity.photoUrl;

  const updated = await prisma.masterResumeProfile.update({
    where: { id: profile.id },
    data: {
      data: data as unknown as Prisma.InputJsonValue,
      version: { increment: 1 },
    },
  });

  return NextResponse.json({ profile: profileToResponse(updated) });
}
