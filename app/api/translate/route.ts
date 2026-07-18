import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  badRequest,
  notFound,
  unauthorized,
  upstreamError,
} from "@/lib/api-error";
import { prisma } from "@/lib/db";
import { isResumeLocale } from "@/lib/resume/locales";
import { getOrCreateLocalePresentation } from "@/lib/resume/locale-presentations";
import { masterResumeSchema } from "@/lib/resume/schema";
import { getOwnedProfile } from "@/lib/etl/persist";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const body = (await req.json()) as {
    profileId?: string;
    locale?: string;
    force?: boolean;
  };
  if (!body.profileId) return badRequest("profileId is required");
  if (!body.locale) return badRequest("locale is required");
  if (!isResumeLocale(body.locale)) {
    return badRequest(`Unsupported locale: ${body.locale}`);
  }

  const profile = await getOwnedProfile(session.user.id, body.profileId);
  if (!profile) return notFound("Resume not found");

  const sourceData = masterResumeSchema.parse(profile.data);

  try {
    const presentation = await getOrCreateLocalePresentation({
      profileId: profile.id,
      sourceLocale: profile.sourceLocale,
      sourceVersion: profile.version,
      sourceData,
      locale: body.locale,
      force: body.force,
    });

    await prisma.masterResumeProfile.update({
      where: { id: profile.id },
      data: { selectedLocale: body.locale },
    });

    return NextResponse.json({
      locale: presentation.locale,
      sourceVersion: presentation.sourceVersion,
      cached: presentation.cached,
      data: presentation.data,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Translation failed";
    console.error("[translate]", message);
    return upstreamError(message);
  }
}
