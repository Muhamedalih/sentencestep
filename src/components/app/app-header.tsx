"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, Flame, Sparkles } from "lucide-react";

import { AccountMenu } from "@/components/app/account-menu";
import { LanguageSwitcher } from "@/components/app/language-switcher";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/providers/locale-provider";
import { useProgress } from "@/hooks/use-progress";
import { cn } from "@/lib/utils";
import type { CurrentUser } from "@/lib/supabase/auth";

/** Duolingo-style always-visible streak/XP pair, centered in the header — see AppHeader's own doc comment for why this replaced empty header space. Renders nothing until progress has actually loaded, never a flashing "0". */
function ProgressHud() {
  const { isLoaded, streak, xp } = useProgress();
  if (!isLoaded) return null;

  return (
    <div className="text-muted-foreground hidden items-center gap-4 text-sm font-semibold sm:flex">
      <span className="inline-flex items-center gap-1.5">
        <Flame
          className={cn(
            "size-4",
            streak.currentStreak > 0 ? "text-accent" : "text-muted-foreground",
          )}
          aria-hidden="true"
        />
        <span className="tabular-nums" dir="ltr">
          {streak.currentStreak}
        </span>
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Sparkles className="size-4" aria-hidden="true" />
        <span className="tabular-nums" dir="ltr">
          {xp}
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
}: {
  user: CurrentUser | null;
  /** This learner's saved-sentence count, for the bookmark icon's badge — 0/undefined renders no badge at all. */
  savedCount?: number;
}) {
  const { t } = useLocale();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 4);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "border-border/60 bg-background/80 sticky top-0 z-50 border-b backdrop-blur-md transition-shadow duration-200",
        scrolled && "shadow-sm shadow-black/5",
      )}
    >
      <div className="grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 sm:px-6">
        <Link
          href="/learn"
          aria-label={t.marketing.dashboardLinkAriaLabel}
          className="justify-self-start"
        >
          <Logo />
        </Link>

        <div className="justify-self-center">{user && <ProgressHud />}</div>

        <div className="flex items-center gap-3 justify-self-end">
          {user ? (
            <>
              {/* Utility cluster first (saved items, language, theme), the
                  account avatar last — the true outer edge, not sandwiched
                  in the middle of the row. Matches how every major app
                  anchors the profile avatar at the corner (Gmail, Notion,
                  Linear, GitHub, Slack, regardless of interface language)
                  — and since this app's chrome direction is deliberately
                  LTR even under Arabic (see locales.ts's dirFor), the far
                  edge here is the physical right side of the screen, which
                  is also where an Arabic reader's eye naturally lands
                  first. One placement, both reasons. */}
              <div className="flex items-center gap-1">
                <div className="relative">
                  {/* Same icon-sm ghost-button treatment as ThemeToggle
                      (32px hit target, 16px icon) — previously just a bare
                      icon with 4px padding, which read as noticeably
                      smaller/lighter-weight than every other control here. */}
                  <Button asChild variant="ghost" size="icon-sm">
                    <Link href="/learn/saved" aria-label={t.nav.mySaves} title={t.nav.mySaves}>
                      {/* Filled + accent-toned once something is actually saved — an
                          outline icon in flat gray read as a dead utility control next
                          to the colored streak/XP pair; matching their treatment gives
                          it the same "this is alive" weight. */}
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
              <div className="bg-border/60 h-6 w-px" aria-hidden="true" />
              <AccountMenu />
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <LanguageSwitcher />
                <ThemeToggle />
              </div>
              <div className="bg-border/60 h-6 w-px" aria-hidden="true" />
              <Link
                href="/login"
                className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
              >
                {t.common.signIn}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
