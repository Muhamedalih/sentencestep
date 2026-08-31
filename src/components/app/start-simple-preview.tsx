"use client";

import { motion } from "framer-motion";
import { Compass, Flame, Sprout, type LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useLocale } from "@/components/providers/locale-provider";
import { fadeInUp, staggerChildren } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { PreviewSentence, Unit } from "@/types/content";

/** One icon per level (by position, not by parsing the title) — a small visual identity cue, not a recolor of the whole card. */
const LEVEL_ICONS: LucideIcon[] = [Sprout, Compass, Flame];

/**
 * The "what does this level feel like" teaser right under the Start Simple
 * hero — 5 standalone example sentences per level (see
 * src/lib/content.ts's getStartSimplePreviews), not lessons. Purely
 * illustrative: nothing here is clickable or tracked as progress.
 */
export function StartSimplePreview({
  levels,
  previews,
}: {
  levels: Unit[];
  previews: Record<number, PreviewSentence[]>;
}) {
  const { locale, dir } = useLocale();

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      variants={staggerChildren}
      className="grid gap-5 sm:grid-cols-3"
    >
      {levels.map((level, levelIndex) => {
        const Icon = LEVEL_ICONS[levelIndex % LEVEL_ICONS.length]!;
        return (
          <motion.div key={level.id} variants={fadeInUp}>
            <Card className="h-full gap-4">
              <CardHeader className="gap-0">
                <div className="mb-1 flex items-center gap-2">
                  <span
                    className={cn(
                      "flex size-7 items-center justify-center rounded-full",
                      "bg-brand-muted text-primary",
                    )}
                  >
                    <Icon className="size-3.5" aria-hidden="true" />
                  </span>
                  <p className="text-muted-foreground text-sm" dir={dir}>
                    {locale === "es" ? level.titleEs : level.titleAr}
                  </p>
                </div>
                <h3 className="text-base font-semibold" dir="ltr">
                  {level.title}
                </h3>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {(previews[level.level] ?? []).map((sentence, index) => (
                  <div key={index} className="flex items-start gap-2.5">
                    <span className="bg-muted text-muted-foreground mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-semibold tabular-nums">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium" dir="ltr">
                        {sentence.en}
                      </p>
                      <p className="text-muted-foreground mt-0.5 text-xs" dir={dir}>
                        {sentence.supportText ?? sentence.en}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
