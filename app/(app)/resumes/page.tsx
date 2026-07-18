import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { listProfiles, profileListItem } from "@/lib/etl/persist";
import { ResumesClient } from "./resumes-client";

export default async function ResumesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const profiles = await listProfiles(session.user.id);

  return (
    <ResumesClient
      initialResumes={profiles.map(profileListItem)}
      defaultFullName={session.user.name || "Your Name"}
    />
  );
}
