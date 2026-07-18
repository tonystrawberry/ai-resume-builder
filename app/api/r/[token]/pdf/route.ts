import { NextResponse } from "next/server";
import { notFound } from "@/lib/api-error";
import { prisma } from "@/lib/db";
import { masterResumeSchema } from "@/lib/resume/schema";
import { isTemplateId, type TemplateId } from "@/lib/resume/templates";
import { renderResumePdf } from "@/lib/pdf/render";

type Params = { params: Promise<{ token: string }> };

/** Public PDF for an active share — prefer Blob URL, else render on demand. */
export async function GET(_req: Request, { params }: Params) {
  const { token } = await params;
  const link = await prisma.sharedResumeLink.findUnique({
    where: { token },
  });
  if (!link || link.status !== "active") return notFound("Share link not found");

  await prisma.sharedResumeLink.update({
    where: { id: link.id },
    data: { viewCount: { increment: 1 } },
  });

  if (link.pdfUrl) {
    return NextResponse.redirect(link.pdfUrl, 302);
  }

  const data = masterResumeSchema.parse(link.data);
  const templateId = isTemplateId(link.templateId)
    ? (link.templateId as TemplateId)
    : "classic";

  const buffer = await renderResumePdf(data, templateId, link.locale);

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="resume-${link.locale}.pdf"`,
      "Cache-Control": "public, max-age=60",
    },
  });
}
