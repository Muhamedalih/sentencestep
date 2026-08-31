"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Eye, Keyboard, TrendingUp, Volume2 } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { useLocale } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";

const DEMO_SENTENCE = "I love learning English.";
const MISTAKE_INDEX = 6;
const TYPE_INTERVAL_MS = 130;
const MISTAKE_PAUSE_MS = 550;
const LOOP_PAUSE_MS = 1600;

type LetterState = "pending" | "correct" | "error";

export function TypingDemo() {
  const reducedMotion = useReducedMotion();
  const { t } = useLocale();
  const [typedCount, setTypedCount] = useState(0);
  const [errorAt, setErrorAt] = useState<number | null>(null);

  const STEPS = [
    { icon: Eye, label: t.marketing.demoStepSee },
    { icon: Volume2, label: t.marketing.demoStepHear },
    { icon: Keyboard, label: t.marketing.demoStepType },
    { icon: TrendingUp, label: t.marketing.demoStepProgress },
  ];

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    async function runCycle() {
      for (let i = 1; i <= DEMO_SENTENCE.length; i += 1) {
        if (cancelled) return;

        if (i === MISTAKE_INDEX) {
          setErrorAt(i - 1);
          await wait(MISTAKE_PAUSE_MS);
          if (cancelled) return;
          setErrorAt(null);
        }

        setTypedCount(i);
        await wait(TYPE_INTERVAL_MS);
      }

      if (cancelled) return;
      await wait(LOOP_PAUSE_MS);
      if (cancelled) return;
      setTypedCount(0);
      timeoutId = setTimeout(runCycle, 400);
    }

    function wait(ms: number) {
      return new Promise<void>((resolve) => {
        timeoutId = setTimeout(resolve, ms);
      });
    }

    void runCycle();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, []);

  const percent = Math.round((typedCount / DEMO_SENTENCE.length) * 100);

  return (
    <div className="flex flex-col gap-4">
      <ol className="text-muted-foreground flex items-center justify-between gap-2 text-xs font-medium">
        {STEPS.map(({ icon: Icon, label }, index) => (
          <li key={label} className="flex flex-1 items-center gap-1.5">
            <Icon className="text-primary size-3.5 shrink-0" aria-hidden="true" />
            <span>{label}</span>
            {index < STEPS.length - 1 && (
              <span className="bg-border ms-1 h-px flex-1" aria-hidden="true" />
            )}
          </li>
        ))}
      </ol>

      <div className="bg-card border-border relative overflow-hidden rounded-2xl border p-8 shadow-xl shadow-black/5 sm:p-10">
        <p className="text-muted-foreground mb-6 text-sm font-medium">
          {t.marketing.typeTheSentenceCaption}
        </p>
        <motion.div
          animate={errorAt !== null && !reducedMotion ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
          transition={{ duration: 0.35 }}
          className="font-sans text-2xl leading-relaxed font-medium tracking-wide sm:text-3xl"
          dir="ltr"
        >
          {DEMO_SENTENCE.split("").map((char, index) => {
            const state: LetterState =
              errorAt === index ? "error" : index < typedCount ? "correct" : "pending";

            return (
              <span
                key={index}
                className={cn(
                  "transition-colors duration-150",
                  state === "correct" && "text-foreground",
                  state === "error" && "text-danger",
                  state === "pending" && "text-muted-foreground/40",
                )}
              >
                {char}
              </span>
            );
          })}
          {!reducedMotion && (
            <AnimatePresence>
              <motion.span
                key="caret"
                animate={{ opacity: [1, 1, 0, 0] }}
                transition={{ duration: 1, repeat: Infinity, times: [0, 0.5, 0.5, 1] }}
                className="bg-primary ms-0.5 inline-block h-6 w-0.5 translate-y-0.5 align-middle sm:h-7"
              />
            </AnimatePresence>
          )}
        </motion.div>

        <div className="mt-6">
          <Progress value={percent} />
        </div>
      </div>
    </div>
  );
}
