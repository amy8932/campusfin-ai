import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { href: "/dashboard", label: "Today", labelZh: "今日" },
  { href: "/dashboard/record", label: "Daily Check-in", labelZh: "经营打卡" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/dashboard" className="font-semibold">
            CampusFin AI
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {user.email}
            </span>
            <form action="/auth/signout" method="post">
              <Button type="submit" variant="outline" size="sm">
                Log out
              </Button>
            </form>
          </div>
        </div>
        <nav className="container mx-auto flex gap-4 px-4 pb-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
              <span className="hidden sm:inline"> / {item.labelZh}</span>
            </Link>
          ))}
        </nav>
        <Separator />
      </header>
      <main className="container mx-auto flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
