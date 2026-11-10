"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

import { ReturnCard } from "@/components/learning/return-card";
import { useReturnPlan } from "@/components/learning/use-return-plan";
import type { ReturnPlanData } from "@/components/learning/use-return-plan";
import { Logo } from "@/components/layout/logo";
import { useAuthUserId } from "@/components/providers/auth-user-provider";
import { useFeatures } from "@/components/providers/feature-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { fetchReturnHookAction } from "@/lib/return-loop/actions";
import { takeReturnMarker } from "@/lib/return-loop/marker";
import { LESSON_MINUTES } from "@/lib/session-end/summary";

/**
 * The page a guest sees once, the first time Home opens after they signed up in the browser where
 * they finished the opening lesson (the sign-up page left a note, see marker.ts): "your progress is
 * saved", tomorrow's lesson by name, and the return loop's ask. Most new accounts are made on the
 * page right after the first lesson, and that page cannot ask for a reminder because the account
 * does not exist yet; this is the first moment it can, and nothing is added to Home itself. It
 * reads the note from this browser only (no request until it finds one), removes it, and is gone
 * after "Continue". Mounted for every /learn page; acts only on Home.
 */
export function ReturnWelcome() {
  const userId = useAuthUserId();
  const features = useFeatures();
  const pathname = usePathname();
  const { t } = useLocale();
  const [data, setData] = useState<ReturnPlanData | null>(null);
  const [minutes, setMinutes] = useState(LESSON_MINUTES);
  const [open, setOpen] = useState(false);
  const plan = useReturnPlan("welcome", data);
  const enabled = !!userId && features.rollouts.returnLoop;
  // The note is read and removed once; a second run of this effect (React's development double run, a
  // re-render with the same answer) must neither find it again nor drop the answer of the first.
  const started = useRef(false);

  useEffect(() => {
    if (!enabled || pathname !== "/learn" || started.current) return;
    let marker = null;
    try {
      marker = takeReturnMarker(window.localStorage, Date.now());
    } catch {
      marker = null;
    }
    if (!marker) return;
    started.current = true;
    fetchReturnHookAction({ mode: marker.mode, lessonId: marker.lessonId })
      .then((hook) => {
        if (!hook.enabled) return;
        setMinutes(hook.minutes);
        setData({ canEmail: hook.canEmail, vapidPublicKey: hook.vapidPublicKey, next: hook.next });
        setOpen(true);
      })
      .catch(() => {});
  }, [enabled, pathname]);

  if (!open || !plan) return null;
  const copy = t.returnLoop;
  return (
    <div
      className="bg-background fixed inset-0 z-100 flex flex-col overflow-y-auto p-6"
      role="dialog"
      aria-modal="true"
      aria-label={copy.welcomeHeadline}
    >
      <div className="flex shrink-0 items-center justify-between">
        <Logo />
      </div>
      <div className="flex flex-1 items-center justify-center py-8 [@media(max-height:720px)]:py-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex w-full max-w-sm flex-col items-center text-center"
        >
          <span className="border-primary/40 text-primary flex size-12 items-center justify-center rounded-full border">
            <Check aria-hidden="true" className="size-6" />
          </span>
          <p dir="auto" className="text-primary mt-4 text-sm font-medium">
            {copy.welcomeEyebrow}
          </p>
          <h1 dir="auto" className="mt-1.5 text-2xl font-semibold tracking-tight text-balance">
            {copy.welcomeHeadline}
          </h1>
          <ReturnCard
            plan={plan}
            nextTitle={data?.next?.title ?? null}
            minutes={minutes}
            className="mt-6"
          />
          <Button size="lg" className="mt-8 h-12 w-full" onClick={() => setOpen(false)}>
            {copy.welcomeContinue}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
