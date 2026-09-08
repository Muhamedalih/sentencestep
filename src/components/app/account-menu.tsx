"use client";

import Link from "next/link";

import { InitialsAvatar } from "@/components/app/initials-avatar";
import { useLocale } from "@/components/providers/locale-provider";
import type { CurrentUser } from "@/lib/supabase/auth";

/**
 * Header account trigger — a plain link straight to /learn/settings, not a
 * popover (header/account-menu redesign, round 4): Settings used to be
 * reachable only by opening this menu first and clicking through, so
 * collapsing "open menu → click Settings" into one click is a strict win,
 * not a shortcut that hides anything — nothing else lived in that popover
 * that isn't reachable from Settings itself now (plan/upgrade is
 * AccountSection, sign-out moved there too, see that component).
 *
 * The avatar renders square (rounded-lg override on InitialsAvatar's own
 * rounded-full default) with no progress ring, matching the "a squared
 * button, not another circle" shape the user asked for.
 */
export function AccountMenu({ user }: { user: CurrentUser }) {
  const { t } = useLocale();

  return (
    <Link
      href="/learn/settings"
      className="border-border/60 bg-card/60 hover:bg-card flex items-center gap-2.5 rounded-lg border py-1.5 ps-1.5 pe-4 transition-all duration-200 ease-out hover:-translate-y-px hover:shadow-md"
    >
      <InitialsAvatar
        seed={user.id}
        displayName={user.displayName}
        email={user.email}
        className="size-8 rounded-lg text-sm"
      />
      {/* Visible on the header itself from `sm` up; screen-reader-only
          below that (the icon-only mobile header has no room for it), so
          the link's accessible name always includes this text. */}
      <span className="sr-only text-sm font-semibold sm:not-sr-only">
        {t.account.manageAccountLabel}
      </span>
    </Link>
  );
}
