import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { badRequest, notFound, unauthorized } from "@/lib/api-error";
import { prisma } from "@/lib/db";
import { isTemplateId } from "@/lib/resume/templates";
import {
  isValidPrimaryColor,
  normalizePrimaryColor,
} from "@/lib/resume/theme-color";
import { getOwnedProfile, profileToResponse } from "@/lib/etl/persist";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const body = (await req.json()) as {
    profileId?: string;
    selectedTemplateId?: string;
    selectedLocale?: string;
    primaryColor?: string;
  };

  if (!body.profileId) return badRequest("profileId is required");

  const profile = await getOwnedProfile(session.user.id, body.profileId);
  if (!profile) return notFound("Resume not found");

  if (body.selectedTemplateId && !isTemplateId(body.selectedTemplateId)) {
    return badRequest("Invalid templateId");
  }

  let primaryColor: string | undefined;
  if (body.primaryColor !== undefined) {
    const normalized = normalizePrimaryColor(body.primaryColor);
    if (!normalized || !isValidPrimaryColor(normalized)) {
      return badRequest("Invalid primaryColor");
    }
    primaryColor = normalized;
  }

  const updated = await prisma.masterResumeProfile.update({
    where: { id: profile.id },
    data: {
      ...(body.selectedTemplateId
        ? { selectedTemplateId: body.selectedTemplateId }
        : {}),
      ...(body.selectedLocale ? { selectedLocale: body.selectedLocale } : {}),
      ...(primaryColor ? { primaryColor } : {}),
    },
  });

  const localePresentation =
    updated.selectedLocale !== updated.sourceLocale
      ? await prisma.localePresentation.findUnique({
          where: {
            profileId_locale: {
              profileId: updated.id,
              locale: updated.selectedLocale,
            },
          },
        })
      : null;

  return NextResponse.json({
    profile: profileToResponse(updated),
    localePresentation: localePresentation
      ? {
          locale: localePresentation.locale,
          sourceVersion: localePresentation.sourceVersion,
          data: localePresentation.data,
        }
      : null,
  });
}
