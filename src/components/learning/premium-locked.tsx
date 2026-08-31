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
      className="border-border bg-card flex flex-col items-center gap-5 rounded-2xl border p-10 text-center shadow-sm sm:p-12"
    >
      <div className="bg-brand-muted text-primary flex size-14 items-center justify-center rounded-full">
        <Lock className="size-7" aria-hidden="true" />
      </div>

      <div>
        <Badge variant="muted" className="mb-3">
          {t.premium.premiumLessonBadge}
        </Badge>
        <h1 className="text-2xl font-semibold tracking-tight" dir="ltr">
          {title}
        </h1>
        {resolvedSupportTitle && (
          <p className="text-muted-foreground mt-1" dir={dir}>
            {resolvedSupportTitle}
          </p>
        )}
      </div>

      <p className="text-muted-foreground max-w-sm text-sm">{t.premium.lockedBody}</p>

      <ul className="flex w-full max-w-xs flex-col gap-2.5 text-left" dir="ltr">
        {t.premium.lockedBenefits.map((text, index) => {
          const Icon = BENEFIT_ICONS[index % BENEFIT_ICONS.length]!;
          return (
            <li key={text} className="text-foreground flex items-start gap-2.5 text-sm">
              <Icon className="text-primary mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{text}</span>
            </li>
          );
        })}
      </ul>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <Button variant="outline" asChild>
          <Link href={`/learn/${mode}`}>{t.premium.backToLessons}</Link>
        </Button>
        <Button asChild>
          <Link href="/upgrade">{t.premium.upgradeCta.replace("{price}", formatPrice())}</Link>
        </Button>
      </div>
    </motion.div>
  );
}
