import Link from "next/link";

import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="border-border/60 bg-background/80 sticky top-0 z-50 border-b backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" aria-label="Looma home">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium md:flex" aria-label="Primary">
          <a
            href="#modes"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Learning modes
          </a>
          <a href="#free" className="text-muted-foreground hover:text-foreground transition-colors">
            Free lessons
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
            Sign in
          </Button>
          <Button size="sm">Start learning</Button>
        </div>
      </div>
    </header>
  );
}
