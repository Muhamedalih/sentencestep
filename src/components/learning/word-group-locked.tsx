"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Lock, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/providers/locale-provider";
import { formatPrice } from "@/lib/billing/pricing";
import { popIn } from "@/lib/motion";

/**
 * Word Lists' own locked-group state — not a reuse of PremiumLocked, which
 * is typed to a LearningMode ("Back to lessons" → /learn/{mode}) that Word
 * Lists isn't one of. Same visual language and copy pattern, deliberately
 * kept as its own small component rather than widening PremiumLocked's
 * props for a single extra caller.
 */
export function WordGroupLocked({
  title,
  supportTitle,
}: {
  title: string;
  /** Never falls back to the Arabic column for Spanish — see types/content.ts's Sentence.supportText doc comment for the same rule applied everywhere else. */
  supportTitle?: string;
}) {
  const { dir, t } = useLocale();

  return (
    <motion.div
      variants={popIn}
      initial="hidden"
      animate="visible"
      className="border-border bg-card relative flex flex-col items-center gap-6 overflow-hidden rounded-2xl border p-8 text-center shadow-sm sm:flex-row sm:items-center sm:gap-8 sm:p-10 sm:text-start"
    >
      <div className="bg-brand absolute inset-x-0 top-0 h-[3px] opacity-60" aria-hidden="true" />

      <div className="flex flex-col items-center gap-4 sm:flex-1 sm:items-start">
        <div className="flex items-center gap-3">
          <div className="bg-brand-muted text-primary flex size-11 shrink-0 items-center justify-center rounded-full">
            <Lock className="size-5" aria-hidden="true" />
          </div>
          <Badge variant="muted">{t.wordLists.lockedBadge}</Badge>
        </div>

        <div>
          <h1 className="text-xl font-semibold tracking-tight" dir="ltr">
            {title}
          </h1>
          {supportTitle && (
            <p className="text-muted-foreground mt-1" dir={dir}>
              {supportTitle}
            </p>
          )}
        </div>

        <p className="text-muted-foreground max-w-sm text-sm">{t.wordLists.lockedBody}</p>
      </div>

      <div className="flex w-full flex-col items-center gap-3 sm:w-56 sm:shrink-0">
        <Button asChild size="lg" className="w-full">
          <Link href="/upgrade">{t.premium.upgradeCta.replace("{price}", formatPrice())}</Link>
        </Button>
        <p className="text-muted-foreground text-xs">{t.premium.priceAnchorCaption}</p>

        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <Sparkles className="text-primary size-3.5 shrink-0" aria-hidden="true" />
          <span>{t.wordLists.wordsAndHintDetail}</span>
        </div>

        <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
          <Link href="/learn/word-lists">{t.wordLists.backToWordLists}</Link>
        </Button>
      </div>
    </motion.div>
  );
}
