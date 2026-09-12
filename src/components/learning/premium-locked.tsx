"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Lock, MessagesSquare, Sparkles } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/billing/pricing";
import { popIn } from "@/lib/motion";
import type { LearningMode } from "@/types/content";

const BENEFIT_ICONS = [BookOpen, MessagesSquare, Sparkles];

export function PremiumLocked({
  mode,
  title,
  titleAr,
  supportTitle,
}: {
  mode: LearningMode;
  title: string;
  titleAr: string;
  /** Resolved for the active locale server-side — see LessonUnit.supportTitle's doc comment. Falls back to titleAr only for Arabic (never for Spanish). */
  supportTitle?: string;
}) {
  const { t, dir, locale } = useLocale();
  const resolvedSupportTitle = supportTitle ?? (locale === "ar" ? titleAr : undefined);

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
          <Badge variant="muted">{t.premium.premiumLessonBadge}</Badge>
        </div>

        <div>
          <h1 className="text-xl font-semibold tracking-tight" dir="ltr">
            {title}
          </h1>
          {resolvedSupportTitle && (
            <p className="text-muted-foreground mt-1" dir={dir}>
              {resolvedSupportTitle}
            </p>
          )}
        </div>

        <p className="text-muted-foreground max-w-sm text-sm">{t.premium.lockedBody}</p>
      </div>

      <div className="flex w-full flex-col items-center gap-3 sm:w-56 sm:shrink-0">
        <Button asChild size="lg" className="w-full">
          <Link href="/upgrade">{t.premium.upgradeCta.replace("{price}", formatPrice())}</Link>
        </Button>
        <p className="text-muted-foreground text-xs">{t.premium.priceAnchorCaption}</p>

        <ul className="flex w-full flex-col gap-2" dir="ltr">
          {t.premium.lockedBenefits.map((text, index) => {
            const Icon = BENEFIT_ICONS[index % BENEFIT_ICONS.length]!;
            return (
              <li key={text} className="text-muted-foreground flex items-center gap-2 text-xs">
                <Icon className="text-primary size-3.5 shrink-0" aria-hidden="true" />
                <span>{text}</span>
              </li>
            );
          })}
        </ul>

        <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
          <Link href={`/learn/${mode}`}>{t.premium.backToLessons}</Link>
        </Button>
      </div>
    </motion.div>
  );
}
