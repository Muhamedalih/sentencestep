"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@/lib/utils";

const DEMO_SENTENCE = "I love learning English.";
const MISTAKE_INDEX = 6;
const TYPE_INTERVAL_MS = 130;
const MISTAKE_PAUSE_MS = 550;
const LOOP_PAUSE_MS = 1600;

type LetterState = "pending" | "correct" | "error";

export function TypingDemo() {
  const [typedCount, setTypedCount] = useState(0);
  const [errorAt, setErrorAt] = useState<number | null>(null);

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

  return (
    <div className="bg-card border-border relative overflow-hidden rounded-2xl border p-8 shadow-xl shadow-black/5 sm:p-10">
      <p className="text-muted-foreground mb-6 text-sm font-medium">Type the sentence</p>
      <motion.div
        animate={errorAt !== null ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
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
                state === "correct" && "text-success",
                state === "error" && "text-danger",
                state === "pending" && "text-muted-foreground/40",
              )}
            >
              {char}
            </span>
          );
        })}
        <AnimatePresence>
          <motion.span
            key="caret"
            animate={{ opacity: [1, 1, 0, 0] }}
            transition={{ duration: 1, repeat: Infinity, times: [0, 0.5, 0.5, 1] }}
            className="bg-primary ms-0.5 inline-block h-6 w-0.5 translate-y-0.5 align-middle sm:h-7"
          />
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
