"use client";

import Link from "next/link";

import { LanguageSwitcher } from "@/components/app/language-switcher";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { MobileNav } from "@/components/marketing/mobile-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/providers/locale-provider";
import { signOut } from "@/lib/supabase/auth-actions";
import type { AccessState } from "@/lib/billing/types";
import type { CurrentUser } from "@/lib/supabase/auth";

/**
 * Split out from SiteHeader (a Server Component, so it can fetch the
 * signed-in user/access state directly) purely so this half can call
 * useLocale() — a client-only hook — for every piece of chrome text.
 */
export function SiteHeaderClient({
  user,
  access,
}: {
  user: CurrentUser | null;
  access: AccessState;
}) {
  const { t } = useLocale();

  const NAV_LINKS = [
    { href: "/#how-it-works", label: t.nav.howItWorks },
    { href: "/#modes", label: t.nav.learningModes },
    { href: "/#free", label: t.nav.freeLessons },
    { href: "/upgrade", label: t.nav.pricing },
  ];

  const authArea = user ? (
    <>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/learn">{t.common.dashboard}</Link>
        </Button>
        <Badge variant={access.isPremium ? "default" : "muted"}>
          {access.isPremium ? t.common.premium : t.common.freePlan}
        </Badge>
      </div>
      <form action={signOut}>
        <Button size="sm" variant="outline" type="submit">
          {t.common.signOut}
        </Button>
      </form>
    </>
  ) : (
    <>
      <Button variant="ghost" size="sm" asChild>
        <Link href="/login">{t.common.signIn}</Link>
      </Button>
      <Button size="sm" asChild>
        <Link href="/learn">{t.common.startLearning}</Link>
      </Button>
    </>
  );

  return (
    <header className="border-border/60 bg-background/80 sticky top-0 z-50 border-b backdrop-blur-md">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
        <Link href="/" aria-label={t.marketing.homeLinkAriaLabel} className="shrink-0">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium md:flex" aria-label="Primary">
          {NAV_LINKS.map((link) =>
            link.href.startsWith("#") ? (
              <a
                key={link.href}
                href={link.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ),
          )}
        </nav>

        <div className="hidden items-center gap-1 md:flex">
          <LanguageSwitcher />
          <ThemeToggle />
          <div className="ms-1 flex items-center gap-2">{authArea}</div>
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <LanguageSwitcher />
          <ThemeToggle />
          <MobileNav links={NAV_LINKS} authArea={authArea} />
        </div>
      </div>
    </header>
  );
}
