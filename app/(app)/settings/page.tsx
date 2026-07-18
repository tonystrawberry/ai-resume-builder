import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { AccountMenu } from "@/components/auth/account-menu";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-2 text-muted">
          Manage your account. Upload photos and logos on each resume preview.
        </p>
      </div>
      <Card>
        <h2 className="text-lg font-medium">Account</h2>
        <p className="mt-1 text-sm text-muted">
          Signed in as {session.user.email || session.user.name}
        </p>
        <div className="mt-4">
          <AccountMenu />
        </div>
      </Card>
    </div>
  );
}
