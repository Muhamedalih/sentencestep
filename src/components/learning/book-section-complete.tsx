"use client";

import { motion } from "framer-motion";
import { BookOpenCheck, Sparkles } from "lucide-react";

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
 *
 * Reader feedback (2026-09-11): redesigned to actually read as "a part of a
 * book was just finished" — a checked-open-book icon instead of a generic
 * party-popper, and a small chapter-divider ornament (a classic printed-book
 * convention for "this section ends here") — rather than more celebratory
 * decoration. The XP pill moved off `--accent` (a warm gold/amber this app
 * avoids as an accent color) onto the brand/primary indigo already used for
 * every other highlighted number in the app (see Progress, primary buttons).
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
      className="border-border/60 bg-card flex w-full max-w-md flex-col items-center gap-5 rounded-3xl border p-12 text-center shadow-sm"
    >
      <div className="from-primary/20 to-primary/5 text-primary flex size-16 items-center justify-center rounded-full bg-gradient-to-b">
        <BookOpenCheck className="size-8" aria-hidden="true" strokeWidth={1.75} />
      </div>
      <div
        aria-hidden="true"
        className="text-border flex items-center gap-2 text-xs tracking-[0.3em]"
      >
        <span className="bg-border h-px w-8" />
        <span className="bg-border size-1 rounded-full" />
        <span className="bg-border h-px w-8" />
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
        <div className="border-primary/30 bg-primary/10 text-primary flex items-center gap-1.5 rounded-lg border px-4 py-2.5 text-sm font-medium">
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
