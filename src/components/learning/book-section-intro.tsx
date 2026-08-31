"use client";

import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/providers/locale-provider";
import { popIn } from "@/lib/motion";
import type { BookSectionWithSentences } from "@/types/library";

/**
 * Shown once, right before a section's first sentence — Section 19 of the
 * spec ("before starting a section, the user should understand what
 * they're about to read... keep it simple"). Only shown when the reader is
 * actually at a section's start (a fresh book, or one just advanced into) —
 * resuming mid-section skips straight to the sentence itself (see
 * BookReadingSession), since there's nothing to "begin" there.
 */
export function BookSectionIntro({
  section,
  onBegin,
}: {
  section: BookSectionWithSentences;
  onBegin: () => void;
}) {
  const { t, dir } = useLocale();

  return (
    <motion.div
      variants={popIn}
      initial="hidden"
      animate="visible"
      className="border-border bg-card flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border p-12 text-center"
    >
      <div className="bg-brand-muted text-primary flex size-14 items-center justify-center rounded-full">
        <BookOpen className="size-7" aria-hidden="true" />
      </div>
      <div>
        <h2 className="text-2xl font-semibold tracking-tight" dir={dir}>
          {section.supportTitle ?? section.title}
        </h2>
        {(section.supportDescription ?? section.description) && (
          <p className="text-muted-foreground mt-2" dir={dir}>
            {section.supportDescription ?? section.description}
          </p>
        )}
      </div>
      <p className="text-muted-foreground text-sm">
        {section.sentences.length} {t.bookLibrary.sentences}
      </p>
      <Button onClick={onBegin} size="lg">
        {t.bookLibrary.beginSection}
      </Button>
    </motion.div>
  );
}
