import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { badRequest, notFound, unauthorized } from "@/lib/api-error";
import { prisma } from "@/lib/db";
import { getOrCreateLocalePresentation } from "@/lib/resume/locale-presentations";
import { masterResumeSchema } from "@/lib/resume/schema";
import { isTemplateId, type TemplateId } from "@/lib/resume/templates";
import { normalizePrimaryColor, DEFAULT_PRIMARY_COLOR } from "@/lib/resume/theme-color";
import {
  deleteSharedResumePdf,
  storeSharedResumePdf,
} from "@/lib/share/pdf-storage";
import { requestOrigin, sharedLinkToResponse } from "@/lib/share/serialize";

type Params = { params: Promise<{ id: string }> };

async function getOwnedLink(userId: string, id: string) {
  const row = await prisma.sharedResumeLink.findFirst({
    where: { id, profile: { userId } },
    include: { profile: true },
  });
  if (!row) return null;
  const { profile, ...link } = row;
  return { profile, link };
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const { id } = await params;
  const owned = await getOwnedLink(session.user.id, id);
  if (!owned) return notFound("Share link not found");

  const body = (await req.json().catch(() => ({}))) as {
    action?: "revoke" | "refresh" | "reactivate";
    label?: string | null;
  };

  if (!body.action && body.label === undefined) {
    return badRequest("action or label is required");
  }

  let link = owned.link;

  if (body.action === "revoke") {
    link = await prisma.sharedResumeLink.update({
      where: { id: link.id },
      data: { status: "revoked", revokedAt: new Date() },
    });
  } else if (body.action === "reactivate") {
    link = await prisma.sharedResumeLink.update({
      where: { id: link.id },
      data: { status: "active", revokedAt: null },
    });
  } else if (body.action === "refresh") {
    const sourceData = masterResumeSchema.parse(owned.profile.data);
    const presentation = await getOrCreateLocalePresentation({
      profileId: owned.profile.id,
      sourceLocale: owned.profile.sourceLocale,
      sourceVersion: owned.profile.version,
      sourceData,
      locale: link.locale,
    });
    const templateId = isTemplateId(owned.profile.selectedTemplateId)
      ? (owned.profile.selectedTemplateId as TemplateId)
      : (link.templateId as TemplateId);

    const pdfUrl = await storeSharedResumePdf({
      token: link.token,
      data: presentation.data,
      templateId,
      locale: link.locale,
      previousPdfUrl: link.pdfUrl,
    });

    link = await prisma.sharedResumeLink.update({
      where: { id: link.id },
      data: {
        data: presentation.data as unknown as Prisma.InputJsonValue,
        pdfUrl,
        sourceVersion: presentation.sourceVersion,
        templateId,
        primaryColor:
          normalizePrimaryColor(owned.profile.primaryColor) ??
          DEFAULT_PRIMARY_COLOR,
        status: "active",
        revokedAt: null,
      },
    });
  }

  if (body.label !== undefined) {
    link = await prisma.sharedResumeLink.update({
      where: { id: link.id },
      data: { label: body.label?.trim() || null },
    });
  }

  return NextResponse.json({
    link: sharedLinkToResponse(link, requestOrigin(req)),
  });
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const { id } = await params;
  const owned = await getOwnedLink(session.user.id, id);
  if (!owned) return notFound("Share link not found");

  await deleteSharedResumePdf(owned.link.pdfUrl);
  await prisma.sharedResumeLink.delete({ where: { id: owned.link.id } });
  return NextResponse.json({ ok: true });
}
