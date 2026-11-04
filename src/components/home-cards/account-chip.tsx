"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

import { InitialsAvatar } from "@/components/app/initials-avatar";
import { useLocale } from "@/components/providers/locale-provider";
import type { CurrentUser } from "@/lib/supabase/auth";

/**
 * The header's account button when the Home cards are open ("homeCards"): the learner's Google
 * picture, or their letter on their own colour when there is none, beside «Manage account» and their
 * name. It is one link, to the same settings page the plain "Manage account" button opens. A picture
 * that fails to load (offline, a removed photo) falls back to the letter.
 */
export function AccountChip({ user }: { user: CurrentUser }) {
  const { t, dir } = useLocale();
  const [pictureFailed, setPictureFailed] = useState(false);
  const name = user.displayName?.trim() || user.email.split("@")[0] || user.email;

  return (
    <Link
      href="/learn/settings"
      aria-label={`${t.account.manageAccountLabel}: ${name}`}
      className="hover:bg-muted/70 focus-visible:ring-ring flex items-center gap-2.5 rounded-2xl py-1.5 ps-1.5 pe-2.5 transition-colors outline-none focus-visible:ring-2"
    >
      {user.avatarUrl && !pictureFailed ? (
        // eslint-disable-next-line @next/next/no-img-element -- a Google profile picture drawn once at 40px; next/image would need Google's host listed for nothing
        <img
          src={user.avatarUrl}
          alt=""
          width={40}
          height={40}
          referrerPolicy="no-referrer"
          onError={() => setPictureFailed(true)}
          className="size-10 shrink-0 rounded-full object-cover"
        />
      ) : (
        <InitialsAvatar
          seed={user.id}
          displayName={user.displayName}
          email={user.email}
          className="size-10 shrink-0 text-base"
        />
      )}
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="text-muted-foreground text-[11.5px] font-medium" dir={dir}>
          {t.account.manageAccountLabel}
        </span>
        <span dir="ltr" className="max-w-44 truncate text-[15px] font-bold tracking-tight">
          {name}
        </span>
      </span>
      <ChevronDown className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
    </Link>
  );
}
