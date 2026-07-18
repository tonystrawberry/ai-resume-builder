import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AccountMenu } from "@/components/auth/account-menu";

const links = [
  { href: "/resumes", label: "Resumes" },
  { href: "/sharing", label: "Sharing" },
  { href: "/settings", label: "Settings" },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/");

  return (
    <div className="min-h-screen print:min-h-0">
      <header className="border-b border-border/80 bg-card/70 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/resumes" className="font-semibold tracking-tight">
              AI Resume Builder
            </Link>
            <nav className="flex flex-wrap gap-3 text-sm text-muted">
              {links.map((l) => (
                <Link key={l.href} href={l.href} className="hover:text-foreground">
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
          <AccountMenu />
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 print:max-w-none print:p-0">
        {children}
      </main>
    </div>
  );
}
