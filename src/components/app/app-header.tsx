"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, Menu, Trophy, UserRound, X } from "lucide-react";

import { AccountMenu } from "@/components/app/account-menu";
import { LanguageSwitcher } from "@/components/app/language-switcher";
import { LearnLanguageChip } from "@/components/app/learn-language-chip";
import type { TargetLanguage } from "@/lib/learn-language";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { useFeatures } from "@/components/providers/feature-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";
import type { CurrentUser } from "@/lib/supabase/auth";

/**
 * The calm top bar, the same for every account: no line under it, no streak flame (the streak
 * stays in Home's week dots), the saved-items count as a small dot, the flags bare, no divider, and
 * (from md:) the logo lives at the top of the side menu (see LearnSidebar) instead of here. Right
 * side is a utility cluster (saved items, language, theme) followed by the account button
 * anchoring the true outer edge — not sandwiched in the middle of the row, see that section's own
 * inline comment for why. Gains a soft shadow only once the page has actually scrolled (see
 * useState/useEffect below) instead of a shadow baked in permanently — a flat header at the very
 * top of a page, a "lifted" one once content is sliding underneath it.
 */
export function AppHeader({
  user,
  savedCount,
  learnLanguage,
}: {
  user: CurrentUser | null;
  /** The learning-language chip (permission germanTrack, Admins): the current language, or undefined for no chip. */
  learnLanguage?: TargetLanguage;
  /** This learner's saved-sentence count, for the bookmark icon's badge — 0/undefined renders no badge at all. */
  savedCount?: number;
}) {
  const { t } = useLocale();
  const features = useFeatures();
  // The Home polish permission: the saved-items bookmark uses the brand colour, not the amber accent.
  const polish = features.rollouts.homePolish;
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 4);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Below sm: the utility cluster moves off the compact logo-only top bar
  // and into this dropdown panel instead of fighting for space beside it
  // (see the mobile-nav report's "compact top bar + menu" recommendation).
  // Same cluster markup as the sm:+ inline row, just rendered once here and
  // reused via `utilityCluster` below so the two placements can't drift.
  const utilityCluster = user ? (
    <>
      <div className="flex items-center gap-1">
        {features.badges.enabled && (
          <Button asChild variant="ghost" size="icon-sm" className="sm:size-10 sm:[&_svg]:size-5">
            <Link
              href="/learn/achievements"
              aria-label={t.badges.navLabel}
              title={t.badges.navLabel}
            >
              <Trophy className="text-muted-foreground size-4" aria-hidden="true" />
            </Link>
          </Button>
        )}
        <div className="relative">
          <Button asChild variant="ghost" size="icon-sm" className="sm:size-10 sm:[&_svg]:size-5">
            <Link href="/learn/saved" aria-label={t.nav.mySaves} title={t.nav.mySaves}>
              <Bookmark
                className={cn(
                  "size-4",
                  savedCount && !polish ? "fill-accent text-accent" : "text-muted-foreground",
                )}
                aria-hidden="true"
              />
            </Link>
          </Button>
          {Boolean(savedCount) && (
            <span
              className="pointer-events-none absolute end-0.5 top-0.5 size-2 rounded-full bg-[#e4607a]"
              aria-hidden="true"
            />
          )}
        </div>
        {learnLanguage && <LearnLanguageChip current={learnLanguage} />}
        <LanguageSwitcher bare />
        <ThemeToggle />
      </div>
      <AccountMenu user={user} />
    </>
  ) : (
    <>
      <div className="flex items-center gap-1.5">
        {learnLanguage && <LearnLanguageChip current={learnLanguage} />}
        <LanguageSwitcher bare />
        <ThemeToggle />
      </div>
      <div className="bg-border/60 hidden h-6 w-px sm:block" aria-hidden="true" />
      <Link
        href="/login"
        className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors pointer-coarse:flex pointer-coarse:min-h-11 pointer-coarse:items-center"
      >
        {t.common.signIn}
      </Link>
    </>
  );

  return (
    <header
      className={cn(
        "bg-background sticky top-0 z-50 transition-shadow duration-200",
        scrolled && "shadow-sm shadow-black/5",
      )}
    >
      <div className="grid h-16 grid-cols-[auto_1fr_auto] items-center gap-2 px-3 sm:gap-4 sm:px-6 md:h-[4.75rem] md:px-12">
        <Link
          href="/learn"
          aria-label={t.marketing.dashboardLinkAriaLabel}
          className="inline-flex min-h-11 items-center justify-self-start max-[340px]:min-w-11 md:hidden"
        >
          {/* Under 340px the wordmark gives way to the logo mark so the buttons still fit. */}
          <Logo className="max-[340px]:[&>span:last-child]:hidden" />
        </Link>

        {/* The middle column stays: it pushes the right-hand cluster to the far edge. */}
        <div />

        <div className="flex items-center gap-2 justify-self-end sm:gap-3">
          {/* Matches how every major app anchors the profile avatar at the
              corner (Gmail, Notion, Linear, GitHub, Slack) — and since this
              app's chrome direction is deliberately LTR even under Arabic
              (see locales.ts's dirFor), the far edge here is the physical
              right side of the screen either way. */}
          <div className="hidden items-center gap-2 sm:flex sm:gap-3">{utilityCluster}</div>
          {user && (
            <Button asChild variant="ghost" size="icon-sm" className="sm:hidden">
              <Link
                href="/learn/settings"
                aria-label={t.account.manageAccountLabel}
                title={t.account.manageAccountLabel}
              >
                <UserRound aria-hidden="true" />
              </Link>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            className="sm:hidden"
            aria-label={menuOpen ? t.marketing.closeMenu : t.marketing.openMenu}
            aria-expanded={menuOpen}
            aria-controls="app-header-menu"
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            {menuOpen ? (
              <X className="size-4" aria-hidden="true" />
            ) : (
              <Menu className="size-4" aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>

      {menuOpen && (
        <div
          id="app-header-menu"
          className="border-border/60 bg-background flex flex-wrap items-center gap-3 border-t px-3 py-3 sm:hidden"
        >
          {utilityCluster}
        </div>
      )}
    </header>
  );
}
