import { auth } from "@/lib/auth";
import {
  badRequest,
  notFound,
  unauthorized,
  unprocessable,
} from "@/lib/api-error";
import { prisma } from "@/lib/db";
import { masterResumeSchema } from "@/lib/resume/schema";
import { hasCriticalGaps } from "@/lib/resume/completeness";
import { isTemplateId, type TemplateId } from "@/lib/resume/templates";
import { renderResumePdf } from "@/lib/pdf/render";
import { getOwnedProfile } from "@/lib/etl/persist";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const body = (await req.json().catch(() => ({}))) as {
    profileId?: string;
    templateId?: string;
    locale?: string;
    acknowledgeIncomplete?: boolean;
  };

  if (!body.profileId) return badRequest("profileId is required");

  const profile = await getOwnedProfile(session.user.id, body.profileId);
  if (!profile) return notFound("Resume not found");

  const templateId = (body.templateId ||
    profile.selectedTemplateId) as string;
  if (!isTemplateId(templateId)) return badRequest("Invalid templateId");

  const locale = body.locale || profile.selectedLocale;
  let data = masterResumeSchema.parse(profile.data);

  if (locale !== profile.sourceLocale) {
    const presentation = await prisma.localePresentation.findUnique({
      where: {
        profileId_locale: { profileId: profile.id, locale },
      },
    });
    if (presentation) {
      data = masterResumeSchema.parse(presentation.data);
    }
  }

  if (hasCriticalGaps(data) && !body.acknowledgeIncomplete) {
    return unprocessable(
      "Critical sections incomplete. Set acknowledgeIncomplete=true to export anyway.",
      { gaps: data.meta.gaps.filter((g) => g.severity === "critical") },
    );
  }

  const buffer = await renderResumePdf(data, templateId as TemplateId, locale);

  await prisma.exportArtifact.create({
    data: {
      profileId: profile.id,
      templateId,
      locale,
      format: "pdf",
    },
  });

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="resume-${locale}.pdf"`,
    },
  });
}
