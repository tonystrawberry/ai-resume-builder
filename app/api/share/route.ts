import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { badRequest, notFound, unauthorized } from "@/lib/api-error";
import { prisma } from "@/lib/db";
import { isResumeLocale } from "@/lib/resume/locales";
import { getOrCreateLocalePresentation } from "@/lib/resume/locale-presentations";
import { masterResumeSchema } from "@/lib/resume/schema";
import { isTemplateId, type TemplateId } from "@/lib/resume/templates";
import { normalizePrimaryColor, DEFAULT_PRIMARY_COLOR } from "@/lib/resume/theme-color";
import { storeSharedResumePdf } from "@/lib/share/pdf-storage";
import { createShareToken } from "@/lib/share/tokens";
import { requestOrigin, sharedLinkToResponse } from "@/lib/share/serialize";
import { getOwnedProfile } from "@/lib/etl/persist";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const url = new URL(req.url);
  const profileId = url.searchParams.get("profileId");

  const where = profileId
    ? { profileId, profile: { userId: session.user.id } }
    : { profile: { userId: session.user.id } };

  const links = await prisma.sharedResumeLink.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { profile: { select: { id: true, title: true } } },
  });

  const origin = requestOrigin(req);
  return NextResponse.json({
    links: links.map((l) => ({
      ...sharedLinkToResponse(l, origin),
      resumeTitle: l.profile.title,
      profileId: l.profile.id,
    })),
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const body = (await req.json().catch(() => ({}))) as {
    profileId?: string;
    locale?: string;
    templateId?: string;
    primaryColor?: string;
    label?: string;
  };

  if (!body.profileId) return badRequest("profileId is required");

  const profile = await getOwnedProfile(session.user.id, body.profileId);
  if (!profile) return notFound("Resume not found");

  const locale = body.locale || profile.selectedLocale || profile.sourceLocale;
  if (!isResumeLocale(locale)) return badRequest("Invalid locale");

  const templateId = (body.templateId || profile.selectedTemplateId) as string;
  if (!isTemplateId(templateId)) return badRequest("Invalid templateId");

  const primaryColor =
    normalizePrimaryColor(body.primaryColor || profile.primaryColor) ??
    DEFAULT_PRIMARY_COLOR;

  const sourceData = masterResumeSchema.parse(profile.data);
  const presentation = await getOrCreateLocalePresentation({
    profileId: profile.id,
    sourceLocale: profile.sourceLocale,
    sourceVersion: profile.version,
    sourceData,
    locale,
  });

  const token = createShareToken();
  const pdfUrl = await storeSharedResumePdf({
    token,
    data: presentation.data,
    templateId: templateId as TemplateId,
    locale,
  });

  const link = await prisma.sharedResumeLink.create({
    data: {
      profileId: profile.id,
      token,
      locale,
      templateId,
      primaryColor,
      data: presentation.data as unknown as Prisma.InputJsonValue,
      pdfUrl,
      sourceVersion: presentation.sourceVersion,
      label: body.label?.trim() || null,
      status: "active",
    },
  });

  return NextResponse.json(
    {
      link: {
        ...sharedLinkToResponse(link, requestOrigin(req)),
        resumeTitle: profile.title,
        profileId: profile.id,
      },
    },
    { status: 201 },
  );
}
