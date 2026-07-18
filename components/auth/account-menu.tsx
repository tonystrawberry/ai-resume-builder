"use client";

import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function AccountMenu() {
  const { data } = useSession();
  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-sm text-muted sm:inline">
        {data?.user?.email || data?.user?.name}
      </span>
      <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
        Sign out
      </Button>
    </div>
  );
}
