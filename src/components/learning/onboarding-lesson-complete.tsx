"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GraduationCap } from "lucide-react";
import { motion } from "framer-motion";

import { useLocale } from "@/components/providers/locale-provider";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { getOnboardingCardSettings } from "@/lib/admin/onboarding-card-queries";
import type { OnboardingCardSettings } from "@/lib/admin/onboarding-card-settings";

/**
 * The real, final step of the get-started flow — shown instead of the
 * ordinary LessonCompletion the moment a first-time learner finishes their
 * opening lesson (see lesson-session.tsx's isOpeningLesson branch), never
 * for any other lesson. Deliberately not LessonCompletion's stats/rewards
 * recap (accuracy, WPM, XP): this is the one moment to make the pitch for
 * *why* SentenceStep specifically, before handing them off to the ordinary
 * dashboard for good — bookends OnboardingIntroCard's "Your English
 * Journey Starts Here" from three steps ago, now confirmed rather than
 * promised.
 *
 * Same full-page-takeover shell and image-fetch pattern as
 * OnboardingIntroCard (see that component's own doc comment for why
 * settings are fetched client-side rather than threaded through the root
 * layout), reusing the exact same admin-configured image — no separate
 * upload control for this screen, since it's the same "opening experience"
 * an admin already pictures with one image via /admin/onboarding-card.
 * "Continue" always goes to /learn (the dashboard), never a next-lesson
 * link — the ordinary catalog is where every subsequent lesson choice
 * belongs, not this one-time screen.
 */
export function OnboardingLessonComplete() {
  const { t, dir } = useLocale();
  const [settings, setSettings] = useState<OnboardingCardSettings | null>(null);

  useEffect(() => {
    let cancelled = false;
    getOnboardingCardSettings().then((result) => {
      if (!cancelled) setSettings(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const points = [
    { title: t.onboardingComplete.point1Title, body: t.onboardingComplete.point1Body },
    { title: t.onboardingComplete.point2Title, body: t.onboardingComplete.point2Body },
    { title: t.onboardingComplete.point3Title, body: t.onboardingComplete.point3Body },
    { title: t.onboardingComplete.point4Title, body: t.onboardingComplete.point4Body },
  ];

  return (
    <div
      className="bg-background fixed inset-0 z-100 flex flex-col overflow-y-auto p-6"
      role="dialog"
      aria-modal="true"
      aria-label={t.onboardingComplete.headline}
    >
      <div className="flex shrink-0 items-center justify-between">
        <Logo />
      </div>

      <div className="flex flex-1 items-center justify-center py-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          dir={dir}
          className="grid w-full max-w-5xl items-center gap-12 lg:grid-cols-2"
        >
          <div className="flex flex-col gap-8">
            <div>
              <p className="text-primary text-sm font-semibold">{t.onboardingComplete.eyebrow}</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                {t.onboardingComplete.headline}
              </h1>
            </div>

            <div className="flex flex-col gap-5">
              {points.map((point) => (
                <div key={point.title}>
                  <h2 className="font-semibold">{point.title}</h2>
                  <p className="text-muted-foreground mt-1 text-sm text-balance">{point.body}</p>
                </div>
              ))}
            </div>

            <Button size="lg" asChild className="w-fit">
              <Link href="/learn">{t.onboardingComplete.cta}</Link>
            </Button>
          </div>

          <div className="border-border bg-card mx-auto aspect-[4/3] w-full max-w-md overflow-hidden rounded-2xl border">
            {settings?.completionImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- admin-provided Supabase Storage URL, same choice as OnboardingIntroCard's image
              <img
                src={settings.completionImageUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="from-brand-muted to-muted flex h-full w-full items-center justify-center bg-gradient-to-br">
                <GraduationCap className="text-muted-foreground/50 size-16" aria-hidden="true" />
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
