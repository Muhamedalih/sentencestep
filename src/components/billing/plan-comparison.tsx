import { Check } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Dictionary } from "@/lib/i18n/dictionary";

/**
 * The /upgrade page's Free-vs-Premium feature table. Every row reflects a
 * real, currently-enforced access boundary — Beginner-level lessons vs every
 * level (see src/lib/progress/level.ts / lesson.isFree, gated server-side in
 * recordCompletionAction) and the one free starter word list vs the full set
 * (src/data/word-lists/*.ts's isFree flags) — nothing here is aspirational
 * copy. Streak/XP/daily goal are listed as included on BOTH sides
 * deliberately: Phase 2 explicitly keeps Premium framed as unlocking
 * content, not gamification.
 */
export function PlanComparison({ t }: { t: Dictionary }) {
  const rows: { feature: string; free: string; premium: string }[] = [
    {
      feature: t.nav.normalLessons,
      free: t.premium.freeLevelAccess,
      premium: t.premium.premiumLevelAccess,
    },
    {
      feature: t.nav.stories,
      free: t.premium.freeLevelAccess,
      premium: t.premium.premiumLevelAccess,
    },
    {
      feature: t.nav.conversation,
      free: t.premium.freeLevelAccess,
      premium: t.premium.premiumLevelAccess,
    },
    {
      feature: t.nav.wordLists,
      free: t.premium.freeWordListsAccess,
      premium: t.premium.premiumWordListsAccess,
    },
    {
      feature: t.lesson.streakLabel,
      free: t.premium.includedLabel,
      premium: t.premium.includedLabel,
    },
    {
      feature: t.lesson.xpEarnedLabel,
      free: t.premium.includedLabel,
      premium: t.premium.includedLabel,
    },
    {
      feature: t.lesson.dailyGoalLabel,
      free: t.premium.includedLabel,
      premium: t.premium.includedLabel,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{t.premium.comparisonHeading}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[26rem] border-collapse text-sm">
            <thead>
              <tr className="border-border border-b text-start">
                <th className="text-muted-foreground px-2 py-2 text-start font-medium">
                  {t.premium.featureColumnHeading}
                </th>
                <th className="text-muted-foreground px-2 py-2 text-start font-medium">
                  {t.common.freePlan}
                </th>
                <th className="text-primary px-2 py-2 text-start font-medium">
                  {t.common.premium}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.feature} className="border-border/60 border-b last:border-0">
                  <td className="px-2 py-2.5 font-medium">{row.feature}</td>
                  <td className="text-muted-foreground px-2 py-2.5">{row.free}</td>
                  <td className="px-2 py-2.5">
                    <span className="text-foreground inline-flex items-center gap-1.5">
                      <Check className="text-success size-4 shrink-0" aria-hidden="true" />
                      {row.premium}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
