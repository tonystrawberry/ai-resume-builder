import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SignInButton } from "@/components/auth/sign-in-button";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) {
    redirect("/resumes");
  }

  return (
    <main className="relative mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">
        AI Resume Builder
      </p>
      <h1 className="mt-4 max-w-2xl text-5xl font-semibold tracking-tight sm:text-6xl">
        Build your resume in a conversation
      </h1>
      <p className="mt-5 max-w-xl text-lg text-muted">
        Chat with an AI coach to capture your experience, achievements, and
        metrics — then export a polished PDF.
      </p>
      <div className="mt-8">
        <SignInButton />
      </div>
    </main>
  );
}
