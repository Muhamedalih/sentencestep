"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Eye, Keyboard, TrendingUp, Volume2 } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { useGetStartedStep } from "@/components/providers/get-started-step-provider";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * story-1's ("A New Neighbor") second sentence, copied verbatim from
 * src/data/lessons/stories.ts as a hardcoded illustrative example rather
 * than imported from that file: it's the full 62-story local seed (the
 * no-Supabase fallback), and pulling it into this always-mounted marketing
 * component would drag its entire contents into the homepage's first-load
 * bundle for the sake of one sentence.
 */
const DEMO_SENTENCE = "She opened her door and saw boxes everywhere in the hallway";
const DEMO_TRANSLATION = "فتحت بابها ورأت صناديق في كل مكان في الممر.";

const TYPE_INTERVAL_MS = 200;
const REST_FRACTION = 0.42;
const LOOP_PAUSE_MS = 2400;
const RESTART_DELAY_MS = 900;

/**
 * The new first step of the homepage's "get started" flow, mounted right
 * before FirstTimeLanguagePicker in root-html-shell.tsx — see that
 * component's own doc comment for how `introContinued` (GetStartedStepProvider)
 * hands off to it. Gated purely on `!locale`, the same as
 * FirstTimeLanguagePicker itself: no isMarketingHomePath check, so a
 * first-time visitor sees it on top of whatever page they land on, not just
 * the homepage. `t` here resolves through LocaleProvider's browser-language
 * detection (see that component's own doc comment) — English until it
 * resolves, then whichever SupportLocale the visitor's browser reports, all
 * before `locale` itself is ever set.
 *
 * The demo card is a static, hardcoded illustration (DEMO_SENTENCE above),
 * not a live excerpt of the real onboarding lesson — its letter-by-letter
 * color transition purely mirrors TypingDemo's (src/components/marketing/
 * typing-demo.tsx) pending/correct treatment at a larger, Stories-mode-style
 * scale (font-serif, matching src/components/learning/typing-sentence.tsx's
 * Stories rendering) so a first-time visitor immediately recognizes the same
 * visual language once they reach a real lesson.
 */
export function IntroLanding() {
  const { t } = useLocale();
  const { introContinued, setIntroContinued } = useGetStartedStep();
  const reducedMotion = useReducedMotion();
  const restState = Math.round(DEMO_SENTENCE.length * REST_FRACTION);
  const [typed, setTyped] = useState(restState);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (reducedMotion) return;

    function tick() {
      setTyped((current) => {
        const next = current + 1;
        if (next > DEMO_SENTENCE.length) {
          timerRef.current = setTimeout(() => {
            setTyped(0);
            timerRef.current = setTimeout(tick, RESTART_DELAY_MS);
          }, LOOP_PAUSE_MS);
          return current;
        }
        timerRef.current = setTimeout(tick, TYPE_INTERVAL_MS);
        return next;
      });
    }

    timerRef.current = setTimeout(tick, RESTART_DELAY_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [reducedMotion]);

  if (introContinued) return null;

  const percent = Math.max(6, Math.round((typed / DEMO_SENTENCE.length) * 100));
  const steps = [
    [Eye, t.marketing.demoStepSee] as const,
    [Volume2, t.marketing.demoStepHear] as const,
    [Keyboard, t.marketing.demoStepType] as const,
    [TrendingUp, t.marketing.demoStepProgress] as const,
  ];

  return (
    <div
      className="bg-background fixed inset-0 z-100 flex flex-col p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`${t.hero.headingPrefix} ${t.hero.headingEmphasis}`}
    >
      <div className="flex items-center justify-between">
        <Logo />
        <span className="text-muted-foreground text-sm font-medium">
          {t.introLanding.noAccountNote}
        </span>
      </div>

      <div className="flex flex-1 items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="grid w-full max-w-6xl items-center gap-16 lg:grid-cols-2"
        >
          <div className="flex flex-col items-start gap-6">
            <span className="bg-brand-muted text-primary rounded-full px-4 py-1.5 text-base font-medium">
              {t.introLanding.eyebrow}
            </span>
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              {t.hero.headingPrefix} <span className="text-primary">{t.hero.headingEmphasis}</span>
            </h1>
            <p className="text-muted-foreground max-w-lg text-lg text-balance">
              {t.introLanding.subtitle}
            </p>

            <div className="flex flex-wrap gap-6">
              {steps.map(([Icon, label], index) => (
                <span
                  key={index}
                  className="text-muted-foreground flex items-center gap-2 text-base font-medium"
                >
                  <Icon aria-hidden="true" className="text-primary size-5" />
                  {label}
                </span>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-4">
              <Button
                size="lg"
                className="h-14 px-10 text-lg"
                onClick={() => setIntroContinued(true)}
              >
                {t.firstTimePicker.confirm}
              </Button>
              <span className="text-muted-foreground text-base">{t.introLanding.nextHint}</span>
            </div>
          </div>

          <div className="border-border bg-card overflow-hidden rounded-2xl border">
            <div className="bg-border h-[3px]">
              <div className="bg-primary h-full w-[18%]" />
            </div>
            <div className="p-8 sm:p-10">
              <div className="mb-6 flex items-center justify-between gap-3">
                <span className="text-muted-foreground text-sm font-semibold">
                  {t.introLanding.demoBadge}
                </span>
                <span className="text-muted-foreground text-sm font-medium" dir="ltr">
                  2 / 11
                </span>
              </div>

              <p dir="ltr" className="font-serif text-3xl leading-snug font-semibold sm:text-4xl">
                {DEMO_SENTENCE.split("").map((char, index) => (
                  <span
                    key={index}
                    className={cn(
                      "transition-colors duration-300",
                      index < typed ? "text-foreground" : "text-muted-foreground/40",
                    )}
                  >
                    {char}
                  </span>
                ))}
              </p>
              <div className="bg-border mt-4 h-0.5 w-16 overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full transition-[width] duration-150"
                  style={{ width: `${percent}%` }}
                />
              </div>

              <p className="text-muted-foreground mt-5 text-base" dir="rtl">
                {DEMO_TRANSLATION}
              </p>

              <div className="border-border mt-6 flex items-center justify-between gap-3 border-t pt-5">
                <span className="text-muted-foreground flex items-center gap-2 text-sm">
                  <span className="bg-success size-1.5 rounded-full" aria-hidden="true" />
                  {t.introLanding.demoLiveNote}
                </span>
                <span className="text-muted-foreground text-sm font-medium" dir="ltr">
                  100% {t.lesson.accuracyLabel}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
