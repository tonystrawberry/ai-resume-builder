import { redirect } from "next/navigation";

/** Legacy route — start from the resume list. */
export default function OnboardingPage() {
  redirect("/resumes");
}
