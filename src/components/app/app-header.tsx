import Link from "next/link";

import { Logo } from "@/components/layout/logo";

export function AppHeader() {
  return (
    <header className="border-border/60 bg-background/80 sticky top-0 z-50 border-b backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <Link href="/learn" aria-label="Looma dashboard">
          <Logo />
        </Link>
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
        >
          Exit to home
        </Link>
      </div>
    </header>
  );
}
