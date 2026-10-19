"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { popIn } from "@/lib/motion";
import type { PreviewLine } from "@/lib/supabase/queries/locked-preview";

export type LockedPreviewKind = "lesson" | "story" | "passage" | "words";

/**
 * A short look at something that is part of Premium — the first few sentences of a lesson or
 * story, lines of a passage or words of a list — shown instead of the full lock when someone
 * taps it inside the app. What is behind the lock is something they have now seen, the rest is
 * one calm card with one button, and the way back is always there. The offer itself (price,
 * plans) is one tap further, on the upgrade page the button opens.
 *
 * The lines come from the server, already cut to the few that are shown (see
 * PREVIEW_LINE_COUNT); nothing here can show more.
 *
 * The button names what it is — unlocking, from the smallest real payment — so nobody taps it
 * expecting the next lines for free and lands on a price they did not expect.
 */
export function LockedPreview({
  kind,
  title,
  supportTitle,
  lines,
  fromPrice,
  ctaHref,
  backHref,
}: {
  kind: LockedPreviewKind;
  title: string;
  /** The title in the learner's language, when there is one. */
  supportTitle?: string;
  lines: PreviewLine[];
  /** The smallest single payment for this visitor's tier, e.g. "$2" (see getFromPaymentPrice). */
  fromPrice: string;
  ctaHref: string;
  backHref: string;
}) {
  const { t } = useLocale();
  const copy = {
    lesson: {
      title: t.freePath.previewLessonTitle,
      rest: t.freePath.previewLessonRest,
      cta: t.freePath.previewLessonCta,
    },
    story: {
      title: t.freePath.previewStoryTitle,
      rest: t.freePath.previewStoryRest,
      cta: t.freePath.previewStoryCta,
    },
    passage: {
      title: t.freePath.previewPassageTitle,
      rest: t.freePath.previewPassageRest,
      cta: t.freePath.previewPassageCta,
    },
    words: {
      title: t.freePath.previewWordsTitle,
      rest: t.freePath.previewWordsRest,
      cta: t.freePath.previewWordsCta,
    },
  }[kind];
  const isWords = kind === "words";
  // The amount is one slot in the sentence, so each language puts it where its grammar wants it.
  const [ctaBefore = "", ctaAfter = ""] = copy.cta.split("{amount}");

  return (
    <motion.section
      variants={popIn}
      initial="hidden"
      animate="visible"
      aria-label={title}
      className="mx-auto flex w-full max-w-lg flex-col gap-3"
    >
      <div>
        <h1 dir="ltr" className="text-xl leading-snug font-semibold tracking-tight">
          {title}
        </h1>
        {supportTitle && (
          <p dir="auto" className="text-muted-foreground mt-0.5 text-left text-sm">
            {supportTitle}
          </p>
        )}
      </div>

      <ol className="flex flex-col gap-2.5">
        {lines.map((line) => (
          <li key={line.id} className="border-border bg-card rounded-xl border px-3.5 py-3">
            <p
              dir="ltr"
              className={isWords ? "text-base font-semibold" : "text-sm leading-relaxed"}
            >
              {line.en}
            </p>
            {line.support && (
              <p dir="auto" className="text-muted-foreground mt-0.5 text-xs">
                {line.support}
              </p>
            )}
          </li>
        ))}
      </ol>

      <div className="border-border bg-brand-muted/40 flex flex-col items-center gap-1 rounded-xl border border-dashed p-4 text-center">
        <p dir="auto" className="text-sm font-medium">
          {copy.title.replace("{n}", String(lines.length))}
        </p>
        <p dir="auto" className="text-muted-foreground mb-2 text-xs">
          {copy.rest}
        </p>
        <Button asChild className="w-full">
          <Link href={ctaHref} dir="auto">
            <span>
              {ctaBefore}
              <span dir="ltr">{fromPrice}</span>
              {ctaAfter}
            </span>
          </Link>
        </Button>
        <Link
          href={backHref}
          dir="auto"
          className="text-muted-foreground hover:text-foreground mt-1 min-h-11 rounded-md px-3 py-2 text-xs underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          {t.freePath.previewBack}
        </Link>
      </div>
    </motion.section>
  );
}
