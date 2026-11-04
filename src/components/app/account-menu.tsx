"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { AccountChip } from "@/components/home-cards/account-chip";
import { useFeatures } from "@/components/providers/feature-provider";
import { useLocale } from "@/components/providers/locale-provider";
import type { CurrentUser } from "@/lib/supabase/auth";

/**
 * Header account trigger — a plain link straight to /learn/settings, not a
 * popover (header/account-menu redesign, round 5): Settings used to be
 * reachable only by opening a menu first and clicking through, so
 * collapsing "open menu → click Settings" into one click is a strict win,
 * not a shortcut that hides anything — nothing else lived in that popover
 * that isn't reachable from Settings itself now (plan/upgrade is
 * AccountSection, sign-out moved there too, see that component).
 *
 * Text-only by design (round 5 dropped the avatar/initial entirely, per
 * explicit feedback that even a squared avatar still read as "a circle in
 * the corner") — just the label, a bordered box, and a light hover lift +
 * shadow + sliding chevron for a premium feel without any bouncy motion.
 */
export function AccountMenu({ user }: { user?: CurrentUser | null }) {
  const { t } = useLocale();
  const { rollouts } = useFeatures();

  // The Home cards permission: the learner's Google picture (or letter) beside their name replaces the plain button.
  if (rollouts.homeCards && user) return <AccountChip user={user} />;

  return (
    <Link
      href="/learn/settings"
      className="border-border/60 bg-card/60 hover:bg-card hover:border-border group inline-flex items-center gap-1 rounded-lg border px-4 py-2 text-sm font-semibold transition-all duration-300 ease-out hover:-translate-y-px hover:shadow-md sm:px-5 sm:py-2.5 sm:text-base pointer-coarse:py-3"
    >
      {t.account.manageAccountLabel}
      <ChevronLeft
        className="size-3.5 transition-transform duration-300 ease-out group-hover:-translate-x-0.5 sm:size-4"
        aria-hidden="true"
      />
    </Link>
  );
}
