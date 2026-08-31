"use client";

import { motion } from "framer-motion";
import { PartyPopper, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/providers/locale-provider";
import { popIn } from "@/lib/motion";

/**
 * The short, satisfying transition shown when a section's last sentence is
 * completed — Section 12 of the spec is explicit this should be brief, not
 * elaborate gamification. `xpEarned` is 0 for a guest (see
 * BookReadingSession — guests never earn XP, matching Continue Reading's
 * existing signed-in-only scope) and simply hidden in that case, same
 * convention as LessonCompletion's own `xpEarned > 0` guard.
 */
export function BookSectionComplete({
  sectionTitle,
  xpEarned,
  onContinue,
}: {
  sectionTitle: string;
  xpEarned: number;
  onContinue: () => void;
}) {
  const { t, dir } = useLocale();

  return (
    <motion.div
      variants={popIn}
      initial="hidden"
      animate="visible"
      className="border-border bg-card flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border p-12 text-center"
    >
      <div className="bg-success/15 text-success flex size-14 items-center justify-center rounded-full">
        <PartyPopper className="size-7" aria-hidden="true" />
      </div>
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          {t.bookLibrary.sectionCompleteHeading}
        </h2>
        <p className="text-muted-foreground mt-1" dir={dir}>
          {sectionTitle}
        </p>
        <p className="text-muted-foreground mt-1">{t.bookLibrary.sectionCompleteBody}</p>
      </div>
      {xpEarned > 0 && (
        <div className="border-accent/40 bg-accent/10 text-accent-foreground flex items-center gap-1.5 rounded-lg border px-4 py-2.5 text-sm font-medium">
          <Sparkles className="size-4 shrink-0" aria-hidden="true" />+{xpEarned}{" "}
          {t.lesson.xpEarnedLabel}
        </div>
      )}
      <Button onClick={onContinue} size="lg">
        {t.bookLibrary.continueToNextSection}
      </Button>
    </motion.div>
  );
}
