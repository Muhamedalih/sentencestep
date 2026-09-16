import Link from "next/link";
import { LogOut } from "lucide-react";

import { InitialsAvatar } from "@/components/app/initials-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ManageBillingButton } from "@/components/billing/manage-billing-button";
import { signOut } from "@/lib/supabase/auth-actions";
import { getLearnerLevel, learnerLevelSupportLabel } from "@/lib/progress/learner-level";
import type { StreakState } from "@/lib/progress/types";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { SupportLocale } from "@/lib/i18n/locales";
import type { AccessState } from "@/lib/billing/types";

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{t.settings.accountHeading}</CardTitle>
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

        <div className="border-border border-t pt-4">
          <div className="flex items-center justify-between gap-4 text-sm">
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
        </div>

        {/* The account header's own trigger now links straight here instead
            of opening a popover (see AccountMenu) — sign-out used to live
            only in that popover, so it moved here to keep it reachable. */}
        <form action={signOut} className="-mt-1">
          <Button type="submit" variant="ghost" size="sm" className="text-danger w-fit">
            <LogOut aria-hidden="true" />
            {t.common.signOut}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
