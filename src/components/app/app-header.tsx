"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, Flame, Layers, Menu, Trophy, UserRound, X } from "lucide-react";

import { AccountMenu } from "@/components/app/account-menu";
import { LanguageSwitcher } from "@/components/app/language-switcher";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { useFeatures } from "@/components/providers/feature-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { useProgress } from "@/hooks/use-progress";
import { cn } from "@/lib/utils";
import type { CurrentUser } from "@/lib/supabase/auth";
import type { ProgressState } from "@/lib/progress/types";

/** Duolingo-style always-visible streak counter, centered in the header — see AppHeader's own doc comment for why this replaced empty header space. Renders nothing until progress has actually loaded, never a flashing "0". */
function ProgressHud({ initialProgress }: { initialProgress?: ProgressState }) {
  const { isLoaded, streak } = useProgress(initialProgress);
  if (!isLoaded) return null;

  return (
    <div className="text-muted-foreground flex items-center gap-4 text-sm font-semibold">
      <span className="inline-flex items-center gap-1.5 text-base sm:gap-2 sm:text-lg">
        <Flame
          className={cn(
            "size-4 sm:size-5",
            streak.currentStreak > 0 ? "text-accent" : "text-muted-foreground",
          )}
          aria-hidden="true"
        />
        <span className="tabular-nums" dir="ltr">
          {streak.currentStreak}
        </span>
      </span>
    </div>
  );
}

/**
 * Header/account-menu redesign (round 3): the wide empty gap the previous
 * plain logo-left/icons-right layout left on anything but a narrow viewport
 * now holds something real — the learner's own streak/XP, the same "always
 * visible, never buried in a menu" ambient-progress idiom Duolingo's own top
 * bar uses. Right side is a utility cluster (saved items, language, theme)
 * followed by a divider and the account avatar anchoring the true outer
 * edge — not sandwiched in the middle of the row, see that section's own
 * inline comment for why. Gains a soft shadow only once the page has
 * actually scrolled (see useState/useEffect below) instead of a shadow
 * baked in permanently — a flat header at the very top of a page, a
 * "lifted" one once content is sliding underneath it.
 */
export function AppHeader({
  user,
  savedCount,
  initialProgress,
}: {
  user: CurrentUser | null;
  /** This learner's saved-sentence count, for the bookmark icon's badge — 0/undefined renders no badge at all. */
  savedCount?: number;
  /** Already fetched server-side by the layout rendering this header — see ProgressHud/useProgress's own doc comments for why this avoids a client-side flash on every /learn/* page, not just the Home dashboard. */
  initialProgress?: ProgressState;
}) {
  const { t } = useLocale();
  const features = useFeatures();
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
        {features.personalCards.page && (
          <Button asChild variant="ghost" size="icon-sm" className="sm:size-10 sm:[&_svg]:size-5">
            <Link href="/learn/cards" aria-label={t.myCards.navLabel} title={t.myCards.navLabel}>
              <Layers className="text-muted-foreground size-4" aria-hidden="true" />
            </Link>
          </Button>
        )}
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
                  savedCount ? "fill-accent text-accent" : "text-muted-foreground",
                )}
                aria-hidden="true"
              />
            </Link>
          </Button>
          {Boolean(savedCount) && (
            <span
              className="bg-accent text-accent-foreground ring-background pointer-events-none absolute -end-1 -top-1 flex size-4 items-center justify-center rounded-full text-[10px] font-bold ring-2"
              aria-hidden="true"
            >
              {savedCount! > 9 ? "9+" : savedCount}
            </span>
          )}
        </div>
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
      <div className="bg-border/60 hidden h-6 w-px sm:block" aria-hidden="true" />
      <AccountMenu />
    </>
  ) : (
    <>
      <div className="flex items-center gap-1.5">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
      <div className="bg-border/60 hidden h-6 w-px sm:block" aria-hidden="true" />
      <Link
        href="/login"
        className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
      >
        {t.common.signIn}
      </Link>
    </>
  );

  return (
    <header
      className={cn(
        "border-border/60 bg-background/80 sticky top-0 z-50 border-b backdrop-blur-md transition-shadow duration-200",
        scrolled && "shadow-sm shadow-black/5",
      )}
    >
      <div className="grid h-16 grid-cols-[auto_1fr_auto] items-center gap-2 px-3 sm:gap-4 sm:px-6">
        <Link
          href="/learn"
          aria-label={t.marketing.dashboardLinkAriaLabel}
          className="inline-flex min-h-11 items-center justify-self-start"
        >
          {/* Under 340px the wordmark gives way to the logo mark so the streak and buttons still fit. */}
          <Logo className="max-[340px]:[&>span:last-child]:hidden" />
        </Link>

        <div className="justify-self-center">
          {user && <ProgressHud initialProgress={initialProgress} />}
        </div>

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
