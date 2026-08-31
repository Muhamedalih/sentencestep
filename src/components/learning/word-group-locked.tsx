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
      className="border-border bg-card flex flex-col items-center gap-5 rounded-2xl border p-10 text-center shadow-sm sm:p-12"
    >
      <div className="bg-brand-muted text-primary flex size-14 items-center justify-center rounded-full">
        <Lock className="size-7" aria-hidden="true" />
      </div>

      <div>
        <Badge variant="muted" className="mb-3">
          {t.wordLists.lockedBadge}
        </Badge>
        <h1 className="text-2xl font-semibold tracking-tight" dir="ltr">
          {title}
        </h1>
        {supportTitle && (
          <p className="text-muted-foreground mt-1" dir={dir}>
            {supportTitle}
          </p>
        )}
      </div>

      <p className="text-muted-foreground max-w-sm text-sm">{t.wordLists.lockedBody}</p>

      <div className="text-foreground flex items-center gap-2 text-sm">
        <Sparkles className="text-primary size-4 shrink-0" aria-hidden="true" />
        <span>{t.wordLists.wordsAndHintDetail}</span>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <Button variant="outline" asChild>
          <Link href="/learn/word-lists">{t.wordLists.backToWordLists}</Link>
        </Button>
        <Button asChild>
          <Link href="/upgrade">{t.premium.upgradeCta.replace("{price}", formatPrice())}</Link>
        </Button>
      </div>
    </motion.div>
  );
}
