import { Flame, GraduationCap } from "lucide-react";

import { Card } from "@/components/ui/card";
import { getUnits } from "@/lib/content-helpers";
import type { Dictionary } from "@/lib/i18n/dictionary/types";
import type { SupportLocale } from "@/lib/i18n/locales";
import { difficultyForLevel, tierLabel, tierSupportLabel } from "@/lib/levels";

export function ProgressSection({ t, locale }: { t: Dictionary; locale: SupportLocale | null }) {
  const units = getUnits("normal");

  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {t.marketing.progressHeading}
        </h2>
        <p className="text-muted-foreground mt-3 text-lg text-balance">
          {t.marketing.progressSubtitle}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {units.map((unit) => {
          const tierText = locale
            ? tierSupportLabel(difficultyForLevel(unit.level), locale)
            : tierLabel(difficultyForLevel(unit.level)).label;
          return (
            <Card key={unit.id} className="gap-0 rounded-2xl p-6">
              <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                {tierText}
              </span>
              <h3 className="mt-1 font-semibold tracking-tight">
                {locale === "ar" ? unit.titleAr : locale === "es" ? unit.titleEs : unit.title}
              </h3>
              <p className="text-muted-foreground mt-2 text-sm">
                {locale === "ar"
                  ? unit.descriptionAr
                  : locale === "es"
                    ? unit.descriptionEs
                    : unit.description}
              </p>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6 items-start rounded-2xl p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-accent/15 text-accent flex size-10 shrink-0 items-center justify-center rounded-lg">
            <Flame className="size-5" aria-hidden="true" />
          </div>
          <div>
            <p className="font-medium">{t.marketing.dailyStreaksTitle}</p>
            <p className="text-muted-foreground text-sm">{t.marketing.dailyStreaksBody}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-brand-muted text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
            <GraduationCap className="size-5" aria-hidden="true" />
          </div>
          <div>
            <p className="font-medium">{t.marketing.perLessonAccuracyTitle}</p>
            <p className="text-muted-foreground text-sm">{t.marketing.perLessonAccuracyBody}</p>
          </div>
        </div>
      </Card>
    </section>
  );
}
