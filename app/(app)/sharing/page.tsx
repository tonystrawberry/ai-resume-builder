import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { sharedLinkToResponse } from "@/lib/share/serialize";
import { SharingClient } from "./sharing-client";

export default async function SharingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const links = await prisma.sharedResumeLink.findMany({
    where: { profile: { userId: session.user.id } },
    orderBy: { createdAt: "desc" },
    include: { profile: { select: { id: true, title: true } } },
  });

  return (
    <SharingClient
      initialLinks={links.map((l) => ({
        ...sharedLinkToResponse(l),
        resumeTitle: l.profile.title,
        profileId: l.profile.id,
      }))}
    />
  );
}
