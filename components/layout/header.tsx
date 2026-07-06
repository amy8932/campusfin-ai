import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="text-xl">CampusFin AI</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            登录
          </Link>
          <Button render={<Link href="/signup" />}>免费开始</Button>
        </nav>
      </div>
    </header>
  );
}
