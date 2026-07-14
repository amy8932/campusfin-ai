import Link from "next/link";
import { requireFounderAccess } from "@/lib/founder/access";

export default async function FounderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireFounderAccess();

  return (
    <div className="min-h-full bg-zinc-50/80 dark:bg-background">
      <header className="border-b border-border/80 bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link
              href="/founder"
              className="text-sm font-semibold tracking-tight"
            >
              CampusFin Founder
            </Link>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              Product analytics · read-only
            </span>
          </div>
          <Link
            href="/dashboard"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Merchant view
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
