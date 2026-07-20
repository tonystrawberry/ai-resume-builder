import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { badRequest, notFound, unauthorized } from "@/lib/api-error";
import { prisma } from "@/lib/db";
import {
  ensureJobPostingParsed,
  normalizeJobUrl,
} from "@/lib/applications/job-posting";

type Params = { params: Promise<{ applicationId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();
  const { applicationId } = await params;

  const app = await prisma.jobApplication.findFirst({
    where: { id: applicationId, userId: session.user.id },
    select: {
      jobUrl: true,
      jobPostingText: true,
      jobPostingParsedUrl: true,
      jobPostingParsedAt: true,
    },
  });
  if (!app) return notFound("Application not found");

  return NextResponse.json({
    jobUrl: app.jobUrl,
    jobPostingText: app.jobPostingText,
    jobPostingParsedUrl: app.jobPostingParsedUrl,
    jobPostingParsedAt: app.jobPostingParsedAt?.toISOString() ?? null,
    status: postingStatus(app),
  });
}

export async function POST(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();
  const { applicationId } = await params;

  const app = await prisma.jobApplication.findFirst({
    where: { id: applicationId, userId: session.user.id },
    select: { id: true, jobUrl: true },
  });
  if (!app) return notFound("Application not found");
  if (!app.jobUrl?.trim()) {
    return badRequest("Add a job posting URL before parsing");
  }
  if (!normalizeJobUrl(app.jobUrl)) {
    return badRequest("Job posting URL is not valid or not allowed");
  }

  const body = (await req.json().catch(() => ({}))) as { force?: boolean };
  if (body.force) {
    await prisma.jobApplication.update({
      where: { id: app.id },
      data: {
        jobPostingText: null,
        jobPostingParsedUrl: null,
        jobPostingParsedAt: null,
      },
    });
  }

  const result = await ensureJobPostingParsed(app.id);
  const updated = await prisma.jobApplication.findUniqueOrThrow({
    where: { id: app.id },
    select: {
      jobUrl: true,
      jobPostingText: true,
      jobPostingParsedUrl: true,
      jobPostingParsedAt: true,
    },
  });

  if (result.error && !updated.jobPostingText) {
    return NextResponse.json(
      {
        error: { message: result.error },
        status: "failed",
        jobPostingText: null,
        jobPostingParsedAt: null,
      },
      { status: 422 },
    );
  }

  return NextResponse.json({
    jobUrl: updated.jobUrl,
    jobPostingText: updated.jobPostingText,
    jobPostingParsedUrl: updated.jobPostingParsedUrl,
    jobPostingParsedAt: updated.jobPostingParsedAt?.toISOString() ?? null,
    status: postingStatus(updated),
    parsed: result.parsed,
  });
}

function postingStatus(app: {
  jobUrl: string | null;
  jobPostingText: string | null;
  jobPostingParsedUrl: string | null;
}): "missing_url" | "pending" | "ready" | "stale" {
  if (!app.jobUrl?.trim()) return "missing_url";
  if (!app.jobPostingText) return "pending";
  const current = normalizeJobUrl(app.jobUrl);
  if (
    current &&
    app.jobPostingParsedUrl &&
    current !== app.jobPostingParsedUrl
  ) {
    return "stale";
  }
  return "ready";
}
