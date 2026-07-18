import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import {
  badRequest,
  unauthorized,
  upstreamError,
} from "@/lib/api-error";
import { prisma } from "@/lib/db";
import { extractResumeFromLinkedInPayload } from "@/lib/etl/extract-linkedin";
import {
  getLinkedInConnector,
  isValidLinkedInProfileUrl,
  normalizeLinkedInProfileUrl,
} from "@/lib/etl/linkedin";
import {
  createProfile,
  profileToResponse,
  saveMasterResume,
} from "@/lib/etl/persist";
import { createEmptyMasterResume } from "@/lib/resume/empty-profile";
import { mergeMasterResume } from "@/lib/resume/merge";
import { masterResumeSchema } from "@/lib/resume/schema";

/** Apify scrapes can take a few minutes. */
export const maxDuration = 300;

function titleFromLinkedInUrl(url: string) {
  try {
    const path = new URL(url).pathname.replace(/\/+$/, "");
    const slug = path.split("/").filter(Boolean).pop() || "linkedin";
    return `LinkedIn — ${decodeURIComponent(slug)}`;
  } catch {
    return "LinkedIn import";
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const body = (await req.json().catch(() => ({}))) as {
    profileUrl?: string;
    title?: string;
  };

  const rawUrl = body.profileUrl?.trim() || "";
  if (!rawUrl || !isValidLinkedInProfileUrl(rawUrl)) {
    return badRequest(
      "A valid LinkedIn profile URL is required (https://www.linkedin.com/in/...)",
    );
  }

  const profileUrl = normalizeLinkedInProfileUrl(rawUrl);

  let fetched;
  try {
    fetched = await getLinkedInConnector().fetchPersonProfile(profileUrl);
  } catch (e) {
    return upstreamError(
      e instanceof Error ? e.message : "LinkedIn connector failed",
    );
  }

  let incoming;
  try {
    incoming = await extractResumeFromLinkedInPayload(
      fetched.payload,
      fetched.profileUrl,
    );
  } catch (e) {
    return upstreamError(
      e instanceof Error ? e.message : "Failed to extract LinkedIn profile",
    );
  }

  const title =
    body.title?.trim() ||
    (incoming.identity.fullName && incoming.identity.fullName !== "Your Name"
      ? `${incoming.identity.fullName} — LinkedIn`
      : titleFromLinkedInUrl(profileUrl));

  const profile = await createProfile(session.user.id, {
    fullName: incoming.identity.fullName || session.user.name || undefined,
    title,
  });

  const base = masterResumeSchema.parse(
    profile.data ?? createEmptyMasterResume(),
  );
  const { data: merged, conflicts } = mergeMasterResume(base, incoming, {
    incomingSource: "linkedin",
  });

  const updated = await saveMasterResume({
    profileId: profile.id,
    data: merged,
  });

  await prisma.connectedSource.upsert({
    where: {
      userId_provider: {
        userId: session.user.id,
        provider: "linkedin",
      },
    },
    create: {
      userId: session.user.id,
      provider: "linkedin",
      status: "connected",
      externalHandle: profileUrl,
      lastImportAt: new Date(),
      metadata: { lastProfileId: profile.id } as Prisma.InputJsonValue,
    },
    update: {
      status: "connected",
      externalHandle: profileUrl,
      lastImportAt: new Date(),
      lastError: null,
      metadata: { lastProfileId: profile.id } as Prisma.InputJsonValue,
    },
  });

  await prisma.sourceSnapshot.create({
    data: {
      profileId: profile.id,
      provider: "linkedin",
      payload: fetched.payload as Prisma.InputJsonValue,
      normalized: merged as unknown as Prisma.InputJsonValue,
    },
  });

  return NextResponse.json(
    {
      profile: profileToResponse(updated),
      source: fetched.source,
      warnings: [
        ...fetched.warnings,
        ...conflicts.map((c) => `Conflict on ${c}`),
      ],
    },
    { status: 201 },
  );
}
