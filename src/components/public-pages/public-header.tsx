import Link from "next/link";

import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";

/**
 * The top bar of the public pages. The structure is left to right like the rest of the site and the
 * Arabic text inside it reads right to left. The link into the app has no prefetch: it sits under a
 * different root layout, and a prefetch would ask the server for a page nobody has opened.
 */
export function PublicHeader({ locale }: { locale: string }) {
  return (
    <header className="border-border/60 border-b">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href={`/${locale}`} className="shrink-0" aria-label="SentenceStep">
          <Logo />
        </Link>
        <nav className="flex items-center gap-1 sm:gap-3" aria-label="التنقل">
          <Link
            href={`/${locale}/grammar`}
            className="text-muted-foreground hover:text-foreground px-2 text-sm"
            dir="rtl"
          >
            القواعد
          </Link>
          <Link
            href={`/${locale}/about`}
            className="text-muted-foreground hover:text-foreground hidden px-2 text-sm sm:inline"
            dir="rtl"
          >
            عن SentenceStep
          </Link>
          <ThemeToggle />
          <Button size="sm" asChild>
            <Link href="/learn" prefetch={false} dir="rtl">
              ابدأ مجاناً
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
