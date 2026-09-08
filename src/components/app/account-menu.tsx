"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";

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
export function AccountMenu() {
  const { t } = useLocale();

  return (
    <Link
      href="/learn/settings"
      className="border-border/60 bg-card/60 hover:bg-card hover:border-border group inline-flex items-center gap-1 rounded-lg border px-4 py-2 text-sm font-semibold transition-all duration-300 ease-out hover:-translate-y-px hover:shadow-md"
    >
      {t.account.manageAccountLabel}
      <ChevronLeft
        className="size-3.5 transition-transform duration-300 ease-out group-hover:-translate-x-0.5"
        aria-hidden="true"
      />
    </Link>
  );
}
