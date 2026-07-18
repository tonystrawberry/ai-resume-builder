import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { badRequest, notFound, unauthorized } from "@/lib/api-error";
import { prisma } from "@/lib/db";
import {
  getOwnedProfile,
  profileToResponse,
} from "@/lib/etl/persist";
import { deleteSharedResumePdf } from "@/lib/share/pdf-storage";

type Params = { params: Promise<{ profileId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const { profileId } = await params;
  const profile = await getOwnedProfile(session.user.id, profileId);
  if (!profile) return notFound("Resume not found");

  return NextResponse.json({ profile: profileToResponse(profile) });
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const { profileId } = await params;
  const profile = await getOwnedProfile(session.user.id, profileId);
  if (!profile) return notFound("Resume not found");

  const body = (await req.json().catch(() => ({}))) as { title?: string };
  if (typeof body.title !== "string" || !body.title.trim()) {
    return badRequest("title is required");
  }

  const updated = await prisma.masterResumeProfile.update({
    where: { id: profile.id },
    data: { title: body.title.trim() },
  });

  return NextResponse.json({ profile: profileToResponse(updated) });
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const { profileId } = await params;
  const profile = await getOwnedProfile(session.user.id, profileId);
  if (!profile) return notFound("Resume not found");

  const links = await prisma.sharedResumeLink.findMany({
    where: { profileId: profile.id },
    select: { pdfUrl: true },
  });
  await Promise.all(links.map((l) => deleteSharedResumePdf(l.pdfUrl)));

  await prisma.masterResumeProfile.delete({ where: { id: profile.id } });
  return NextResponse.json({ ok: true });
}
