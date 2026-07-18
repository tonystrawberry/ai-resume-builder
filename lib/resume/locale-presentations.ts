import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { MasterResume } from "@/lib/resume/schema";
import { masterResumeSchema } from "@/lib/resume/schema";
import { translateMasterResume } from "@/lib/ai/translate";

/**
 * Locale presentations are stored separately from the master resume.
 *
 * - MasterResumeProfile.data  → source locale only (usually EN). Never overwritten by translation.
 * - LocalePresentation(locale) → one row per locale (ja, fr, …). Updating JA never touches FR.
 */
export async function getOrCreateLocalePresentation(params: {
  profileId: string;
  sourceLocale: string;
  sourceVersion: number;
  sourceData: MasterResume;
  locale: string;
  force?: boolean;
}): Promise<{
  locale: string;
  sourceVersion: number;
  cached: boolean;
  data: MasterResume;
}> {
  const { profileId, sourceLocale, sourceVersion, sourceData, locale, force } =
    params;

  // Source language always comes from the master profile — never from LocalePresentation.
  if (locale === sourceLocale) {
    return {
      locale,
      sourceVersion,
      cached: true,
      data: sourceData,
    };
  }

  const existing = await prisma.localePresentation.findUnique({
    where: {
      profileId_locale: { profileId, locale },
    },
  });

  if (!force && existing && existing.sourceVersion === sourceVersion) {
    return {
      locale: existing.locale,
      sourceVersion: existing.sourceVersion,
      cached: true,
      data: masterResumeSchema.parse(existing.data),
    };
  }

  const translated = await translateMasterResume(sourceData, locale);

  // Upsert ONLY this locale row — sibling locales (e.g. fr vs ja) are untouched.
  const presentation = await prisma.localePresentation.upsert({
    where: {
      profileId_locale: { profileId, locale },
    },
    create: {
      profileId,
      locale,
      data: translated as unknown as Prisma.InputJsonValue,
      sourceVersion,
    },
    update: {
      data: translated as unknown as Prisma.InputJsonValue,
      sourceVersion,
    },
  });

  return {
    locale: presentation.locale,
    sourceVersion: presentation.sourceVersion,
    cached: false,
    data: masterResumeSchema.parse(presentation.data),
  };
}
