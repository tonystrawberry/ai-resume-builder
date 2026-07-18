import { redirect } from "next/navigation";

/** Legacy /workspace → resume picker */
export default function WorkspaceIndexPage() {
  redirect("/resumes");
}
