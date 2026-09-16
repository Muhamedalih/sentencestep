import Link from "next/link";
import { LogOut } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ManageBillingButton } from "@/components/billing/manage-billing-button";
import { signOut } from "@/lib/supabase/auth-actions";
import { getLearnerLevel, learnerLevelSupportLabel } from "@/lib/progress/learner-level";
import type { StreakState } from "@/lib/progress/types";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { AccessState } from "@/lib/billing/types";

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export function AccountSection({
  t,
  email,
  access,
  memberSince,
  xp,
  streak,
  sessionCount,
  wordsLearnedCount,
}: {
  t: Dictionary;
  email: string;
  access: AccessState;
  /** ISO date string, or null if unavailable — falls back to omitting the row entirely rather than showing a broken date. */
  memberSince: string | null;
  xp: number;
  streak: StreakState | null;
  sessionCount: number;
  wordsLearnedCount: number;
}) {
  const learnerLevel = getLearnerLevel(xp);
  const currentStreak = streak?.currentStreak ?? 0;
  const streakText = (
    currentStreak === 1 ? t.progress.streakDaySingular : t.progress.streakDayPlural
  ).replace("{n}", String(currentStreak));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{t.settings.accountHeading}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <StatRow label={t.auth.emailLabel} value={email} />

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

        {memberSince && (
          <StatRow
            label={t.settings.memberSinceRowLabel}
            value={new Date(memberSince).toLocaleDateString()}
          />
        )}

        <div className="border-border my-1 border-t" />

        <StatRow
          label={t.settings.currentLevelLabel}
          value={learnerLevelSupportLabel(learnerLevel.level.name, t)}
        />
        <StatRow label={t.settings.xpLabel} value={xp} />
        <StatRow label={t.lesson.streakLabel} value={streakText} />
        <StatRow label={t.stats.sessionsLabel} value={sessionCount} />
        <StatRow label={t.settings.wordsLearnedLabel} value={wordsLearnedCount} />

        {/* The account header's own trigger now links straight here instead
            of opening a popover (see AccountMenu) — sign-out used to live
            only in that popover, so it moved here to keep it reachable. */}
        <form action={signOut} className="pt-1">
          <Button type="submit" variant="ghost" size="sm" className="text-danger w-fit">
            <LogOut aria-hidden="true" />
            {t.common.signOut}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
