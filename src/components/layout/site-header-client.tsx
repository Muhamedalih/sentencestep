"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { LanguageSwitcher } from "@/components/app/language-switcher";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { MobileNav } from "@/components/marketing/mobile-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/providers/locale-provider";
import { signOut } from "@/lib/supabase/auth-actions";
import { hasSupabaseAuthCookieClient } from "@/lib/supabase/has-session-cookie-client";
import type { AccessState } from "@/lib/billing/types";
import type { CurrentUser } from "@/lib/supabase/auth";

/**
 * Split out from SiteHeader (a Server Component, so it can fetch the
 * signed-in user/access state directly) purely so this half can call
 * useLocale() — a client-only hook — for every piece of chrome text.
 *
 * `user`/`access` are always `null`/FREE_ACCESS here in practice: this
 * component is only ever rendered by SiteHeader, which is only ever used by
 * the three static marketing pages (/, /privacy, /terms + locale variants),
 * and SiteHeader deliberately never reads the session cookie server-side
 * (see its own doc comment — doing so would force those pages dynamic
 * again). That's correct for "/" (middleware redirects a signed-in visitor
 * away before this ever renders) but wrong for "/privacy" and "/terms": a
 * signed-in learner who navigates there directly would otherwise see
 * "Sign in" buttons despite already being signed in.
 *
 * `looksSignedIn` fixes that WITHOUT any server round trip: after
 * hydration, it checks for the mere PRESENCE of a Supabase auth cookie
 * client-side (see hasSupabaseAuthCookieClient's own doc comment — same
 * heuristic src/middleware.ts's hasSupabaseAuthCookie uses, just read from
 * document.cookie instead of a NextRequest). This is a cosmetic-only
 * check, never a real auth decision: an expired or forged cookie flips this
 * UI the same as a real session would, which is fine because nothing here
 * is access-gated, only which buttons render. Because it can't know WHO the
 * visitor is or their plan (that would need a real server round trip — the
 * exact latency cost this whole static-page effort exists to avoid), it
 * shows a generic "you're signed in" state (a Dashboard link, no
 * premium/free badge) rather than the fully personalized one SiteHeader
 * renders for a real server-known `user` elsewhere in the app. This causes
 * one brief, one-time flash from signed-out to signed-in chrome for a
 * signed-in visitor landing directly on /privacy or /terms — an accepted,
 * narrowly-scoped trade-off, since today (before this check existed) that
 * case was permanently wrong instead of momentarily wrong.
 */
export function SiteHeaderClient({
  user,
  access,
}: {
  user: CurrentUser | null;
  access: AccessState;
}) {
  const { t } = useLocale();
  const [looksSignedIn, setLooksSignedIn] = useState(false);

  useEffect(() => {
    setLooksSignedIn(hasSupabaseAuthCookieClient());
  }, []);

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
  ) : looksSignedIn ? (
    <>
      <Button variant="ghost" size="sm" asChild>
        <Link href="/learn">{t.common.dashboard}</Link>
      </Button>
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
