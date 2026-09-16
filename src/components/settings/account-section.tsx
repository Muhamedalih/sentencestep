"use client";

import Link from "next/link";
import { useActionState } from "react";
import { LogOut } from "lucide-react";

import { InitialsAvatar } from "@/components/app/initials-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ManageBillingButton } from "@/components/billing/manage-billing-button";
import { signOut, updateDisplayNameAction } from "@/lib/supabase/auth-actions";
import type { AuthActionState } from "@/lib/supabase/auth-actions";
import { getLearnerLevel, learnerLevelSupportLabel } from "@/lib/progress/learner-level";
import type { StreakState } from "@/lib/progress/types";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { SupportLocale } from "@/lib/i18n/locales";
import type { AccessState } from "@/lib/billing/types";

const initialNameState: AuthActionState = {};

function StatTile({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-muted flex flex-col items-center gap-1 rounded-lg py-3 text-center">
      <span className="font-mono text-xl leading-none font-extrabold tabular-nums" dir="ltr">
        {value}
      </span>
      <span className="text-muted-foreground text-[11px] font-semibold">{label}</span>
    </div>
  );
}

/**
 * The old separate "الملف الشخصي" (display-name form) and "الحساب" (account
 * overview) tabs merged into one — both were really the same "who am I on
 * this account" concept split across two clicks for no reason. This is now
 * the single Profile tab: identity + stat tiles + plan first (what used to
 * be AccountSection), then the display-name edit form directly below it
 * (what used to be ProfileForm), then sign-out last — one Card so the two
 * pieces read as one coherent section instead of two stacked boxes.
 */
export function AccountSection({
  t,
  locale,
  userId,
  displayName,
  email,
  access,
  memberSince,
  country,
  xp,
  streak,
  sessionCount,
  wordsLearnedCount,
}: {
  t: Dictionary;
  locale: SupportLocale | null;
  userId: string;
  displayName: string | null;
  email: string;
  access: AccessState;
  /** ISO date string, or null if unavailable — falls back to omitting the row entirely rather than showing a broken date. */
  memberSince: string | null;
  /** Lowercase ISO 3166-1 alpha-2 code (see fetchProfileCountry), or null if never chosen. */
  country: string | null;
  xp: number;
  streak: StreakState | null;
  sessionCount: number;
  wordsLearnedCount: number;
}) {
  const learnerLevel = getLearnerLevel(xp);
  const countryName = country
    ? (new Intl.DisplayNames([locale ?? "en"], { type: "region" }).of(country.toUpperCase()) ??
      country.toUpperCase())
    : null;
  const [nameState, nameFormAction, namePending] = useActionState(
    updateDisplayNameAction,
    initialNameState,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{t.settings.profileHeading}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex items-center gap-3.5">
          <InitialsAvatar
            seed={userId}
            displayName={displayName}
            email={email}
            className="size-14 text-lg"
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-lg font-extrabold tracking-tight">
                {displayName || email}
              </span>
              <Badge variant="muted">{learnerLevelSupportLabel(learnerLevel.level.name, t)}</Badge>
            </div>
            <p className="text-muted-foreground truncate text-sm">{email}</p>
            <p className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs">
              {memberSince && (
                <span>
                  {t.settings.memberSinceLabel.replace(
                    "{date}",
                    new Date(memberSince).toLocaleDateString(),
                  )}
                </span>
              )}
              {memberSince && countryName && <span aria-hidden="true">·</span>}
              {countryName && (
                <span className="inline-flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className={`fi fi-${country} !block !h-3 !w-4 rounded-[2px] bg-center`}
                  />
                  {countryName}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatTile value={xp} label={t.settings.xpLabel} />
          <StatTile value={streak?.currentStreak ?? 0} label={t.lesson.streakLabel} />
          <StatTile value={sessionCount} label={t.stats.sessionsLabel} />
          <StatTile value={wordsLearnedCount} label={t.settings.wordsLearnedLabel} />
        </div>

        <div className="border-border flex items-center justify-between gap-4 border-t pt-4 text-sm">
          <span className="text-muted-foreground">{t.settings.planLabel}</span>
          <div className="flex items-center gap-2">
            <Badge variant={access.isPremium ? "default" : "muted"}>
              {access.isPremium ? t.common.premium : t.common.freePlan}
            </Badge>
            {access.isPremium ? (
              <ManageBillingButton />
            ) : (
              <Button asChild size="sm" variant="outline">
                <Link href="/upgrade">{t.common.upgrade}</Link>
              </Button>
            )}
          </div>
        </div>

        <div className="border-border border-t pt-4">
          <h3 className="text-sm font-semibold">{t.settings.displayNameLabel}</h3>
          <p className="text-muted-foreground mt-1 text-sm">{t.settings.profileSubtitle}</p>

          <form action={nameFormAction} className="mt-3 flex flex-col gap-3">
            <Input
              name="displayName"
              type="text"
              autoComplete="name"
              maxLength={50}
              defaultValue={displayName ?? ""}
              aria-invalid={Boolean(nameState?.error)}
              className="max-w-sm"
            />

            {nameState?.error && (
              <p role="alert" className="text-danger text-sm">
                {nameState.error}
              </p>
            )}
            {nameState?.success && <p className="text-success text-sm">{nameState.success}</p>}

            <Button type="submit" disabled={namePending} size="sm" className="w-fit">
              {namePending ? t.settings.savingDisplayName : t.settings.saveDisplayName}
            </Button>
          </form>
        </div>

        {/* The account header's own trigger now links straight here instead
            of opening a popover (see AccountMenu) — sign-out used to live
            only in that popover, so it moved here to keep it reachable. */}
        <form action={signOut} className="border-border border-t pt-4">
          <Button type="submit" variant="ghost" size="sm" className="text-danger w-fit">
            <LogOut aria-hidden="true" />
            {t.common.signOut}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
