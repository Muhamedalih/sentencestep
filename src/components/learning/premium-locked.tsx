"use client";

import { useLocale } from "@/components/providers/locale-provider";
import { LessonIllustration } from "@/components/learning/lesson-illustration";
import { PremiumGate } from "@/components/learning/premium-gate";
import type { GateFigures } from "@/lib/stats/content-stats";
import type { LearningMode } from "@/types/content";

/** What a free learner (or a visitor) sees on a lesson that is part of Premium: the lesson's own artwork and teaser beside the offer (see PremiumGate). */
export function PremiumLocked({
  mode,
  lessonId,
  title,
  titleAr,
  supportTitle,
  description,
  supportDescription,
  illustrationUrl,
  fromPrice,
  figures,
}: {
  mode: LearningMode;
  /** This lesson's id: the upgrade page is opened with it, so after paying the learner can go straight back to this lesson (see AFTER_PAYMENT_COOKIE). */
  lessonId: string;
  title: string;
  titleAr: string;
  /** Resolved for the active locale server-side — see LessonUnit.supportTitle's doc comment. Falls back to titleAr only for Arabic (never for Spanish). */
  supportTitle?: string;
  /** The lesson's own one-line description, in English and in the learner's language — a taste of what is behind the lock. */
  description?: string;
  supportDescription?: string;
  illustrationUrl?: string | null;
  /** The cheapest per-month USD price for this visitor's tier, e.g. "$1.17" — see getFromMonthlyPrice. */
  fromPrice: string;
  /** How big the library really is (see getGateFigures); a null figure is simply left out of the sentence. */
  figures: GateFigures;
}) {
  const { t, locale } = useLocale();
  const resolvedSupportTitle = supportTitle ?? (locale === "ar" ? titleAr : undefined);

  return (
    <PremiumGate
      preview={
        <LessonIllustration
          mode={mode}
          lessonId={lessonId}
          title={title}
          illustrationUrl={illustrationUrl}
          className="aspect-auto h-full w-full rounded-none border-0 lg:aspect-auto lg:h-full"
        />
      }
      // The hand-drawn scene is sized for a tall frame and would be cropped in a
      // phone's short banner, so there the banner is the lesson's photo when it
      // has one, and otherwise just the brand's colour wash.
      compactPreview={
        <LessonIllustration
          mode={mode}
          lessonId={lessonId}
          title={title}
          illustrationUrl={illustrationUrl}
          showScene={false}
          className="aspect-auto h-full w-full rounded-none border-0 lg:aspect-auto lg:h-full"
        />
      }
      badge={t.premium.premiumLessonBadge}
      title={title}
      supportTitle={resolvedSupportTitle}
      description={description}
      supportDescription={supportDescription}
      heading={t.premium.gateHeading}
      subheading={t.premium.gateSubheading}
      benefits={[
        figures.lessons
          ? t.premium.gateBenefitLibrary.replace("{count}", figures.lessons)
          : t.premium.gateBenefitLibraryPlain,
        t.premium.gateBenefitMethod,
        t.premium.gateBenefitProgress,
      ]}
      ctaHref={`/upgrade?next=${encodeURIComponent(`/learn/${mode}/${lessonId}`)}`}
      fromPrice={fromPrice}
      backHref={`/learn/${mode}`}
      backLabel={t.premium.backToLessons}
    />
  );
}
