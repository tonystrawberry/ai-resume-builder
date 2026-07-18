import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import {
  badRequest,
  notFound,
  unauthorized,
  unprocessable,
} from "@/lib/api-error";
import { getOwnedProfile, profileToResponse, saveMasterResume } from "@/lib/etl/persist";
import { masterResumeSchema } from "@/lib/resume/schema";
import { prisma } from "@/lib/db";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

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

  const ext =
    file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const dir = path.join(process.cwd(), "public", "uploads", "photos", profile.id);
  await fs.mkdir(dir, { recursive: true });

  const filename = `photo.${ext}`;
  const abs = path.join(dir, filename);
  await fs.writeFile(abs, Buffer.from(await file.arrayBuffer()));

  for (const other of ["jpg", "png", "webp"]) {
    if (other === ext) continue;
    await fs.unlink(path.join(dir, `photo.${other}`)).catch(() => undefined);
  }

  const photoUrl = `/uploads/photos/${profile.id}/${filename}?v=${Date.now()}`;
  const data = masterResumeSchema.parse(profile.data);
  data.identity.photoUrl = photoUrl.split("?")[0];

  const updated = await saveMasterResume({
    profileId: profile.id,
    data,
  });

  return NextResponse.json({
    profile: profileToResponse(updated),
    photoUrl,
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

  const dir = path.join(process.cwd(), "public", "uploads", "photos", profile.id);
  for (const ext of ["jpg", "png", "webp"]) {
    await fs.unlink(path.join(dir, `photo.${ext}`)).catch(() => undefined);
  }

  const data = masterResumeSchema.parse(profile.data);
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
