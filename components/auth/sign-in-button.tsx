"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function SignInButton() {
  return (
    <Button
      size="lg"
      onClick={() => signIn("github", { callbackUrl: "/resumes" })}
    >
      Continue with GitHub
    </Button>
  );
}
