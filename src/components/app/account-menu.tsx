"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LogOut, Settings, Zap } from "lucide-react";
import { motion } from "framer-motion";

import { InitialsAvatar } from "@/components/app/initials-avatar";
import { useLocale } from "@/components/providers/locale-provider";
import { useProgress } from "@/hooks/use-progress";
import { signOut } from "@/lib/supabase/auth-actions";
import { getLearnerLevel, learnerLevelSupportLabel } from "@/lib/progress/learner-level";
import { isDailyGoalMet } from "@/lib/progress/daily-goal";
import { Badge } from "@/components/ui/badge";
import type { AccessState } from "@/lib/billing/types";
import type { CurrentUser } from "@/lib/supabase/auth";

/**
 * Header avatar trigger + account popover (header/account-menu redesign,
 * round 2 — see InitialsAvatar's own doc comment for why the earlier
 * animal-sticker picker was removed rather than kept as an option). Same
 * click-outside popover idiom as BookMarkControls (no Radix popover/
 * dropdown primitive exists in this project yet, so this reuses the
 * established pattern rather than introducing one). Only ever rendered for
 * a signed-in user (see AppHeader) — signed-out chrome stays a plain
 * sign-in link, unchanged.
 */
export function AccountMenu({
  user,
  access,
  xp,
}: {
  user: CurrentUser;
  access: AccessState;
  xp: number;
}) {
  const { t, dir } = useLocale();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  // Daily-goal percent for the avatar's progress ring — the one piece of
  // "how am I doing today" info worth surfacing on the avatar itself,
  // without needing to open the menu at all. useProgress() already covers
  // guests too, but AccountMenu never mounts for one (see AppHeader).
  const { isLoaded, dailyProgress } = useProgress();
  const ringPercent =
    isLoaded && dailyProgress.goal > 0
      ? Math.min(100, Math.round((dailyProgress.sentencesCompleted / dailyProgress.goal) * 100))
      : undefined;

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const levelProgress = getLearnerLevel(xp);
  const levelLabel = learnerLevelSupportLabel(levelProgress.level.name, t);
  const goalMet = isLoaded && isDailyGoalMet(dailyProgress);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={t.account.menuLabel}
        aria-expanded={open}
        className="focus-visible:ring-primary rounded-full transition-transform duration-150 hover:scale-105 focus-visible:ring-2 focus-visible:outline-none"
      >
        <InitialsAvatar
          seed={user.id}
          displayName={user.displayName}
          email={user.email}
          className="size-8 text-sm"
          ringPercent={goalMet ? 100 : ringPercent}
        />
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: 4, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          dir={dir}
          className="border-border/60 bg-card absolute end-0 top-full z-50 mt-2 w-72 rounded-xl border p-3 shadow-lg shadow-black/20"
        >
          <div className="flex items-center gap-3 px-1 pb-3">
            <InitialsAvatar
              seed={user.id}
              displayName={user.displayName}
              email={user.email}
              className="size-12 shrink-0 text-lg"
              ringPercent={goalMet ? 100 : ringPercent}
            />
            <div className="min-w-0">
              <p className="text-foreground truncate text-base font-semibold">
                {user.displayName ?? user.email}
              </p>
              <p className="text-muted-foreground truncate text-xs">{user.email}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <Badge variant={access.isPremium ? "default" : "muted"}>
                  {access.isPremium ? t.common.premium : t.common.freePlan}
                </Badge>
                <span className="text-muted-foreground text-xs">{levelLabel}</span>
              </div>
            </div>
          </div>

          {!access.isPremium && (
            <Link
              href="/upgrade"
              onClick={() => setOpen(false)}
              className="from-accent to-accent/70 text-accent-foreground mb-3 flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r px-3 py-2 text-sm font-semibold shadow-sm transition-opacity hover:opacity-90"
            >
              <Zap className="size-4" aria-hidden="true" />
              {t.common.upgrade}
            </Link>
          )}

          <div className="border-border/60 flex flex-col gap-0.5 border-t pt-2">
            <Link
              href="/learn/settings"
              onClick={() => setOpen(false)}
              className="text-foreground hover:bg-muted flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium transition-colors"
            >
              <Settings className="size-4" aria-hidden="true" />
              {t.nav.settings}
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="text-danger hover:bg-muted flex w-full items-center gap-2 rounded-lg px-2 py-2 text-start text-sm font-medium transition-colors"
              >
                <LogOut className="size-4" aria-hidden="true" />
                {t.common.signOut}
              </button>
            </form>
          </div>
        </motion.div>
      )}
    </div>
  );
}
