"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Headphones, PenLine, Quote, Type } from "lucide-react";

import type { TodayQuestInfo } from "@/lib/features/quests";

export const TASK_ICONS = {
  listen: Headphones,
  story: PenLine,
  words: Type,
  sentences: Quote,
} as const;

/**
 * The icon of the task in progress, which moves gently and slowly: the headphones float with two
 * soft sound rings, the pen writes, the letters breathe. Nothing moves for a learner who asked for
 * reduced motion. (The same movement as the tasks box of the current Home.)
 */
export function TaskIcon({ kind }: { kind: TodayQuestInfo["kind"] }) {
  const reduced = useReducedMotion();
  const moving = !reduced;
  const Icon = TASK_ICONS[kind];
  const kindMotion =
    kind === "listen"
      ? { y: [0, -2, 0] }
      : kind === "story"
        ? { x: [0, 2.5, 0, 2.5, 0], rotate: [0, -6, 0, -6, 0] }
        : { scale: [1, 1.12, 1] };
  return (
    <span className="roomy:size-10 relative grid size-9 place-items-center" aria-hidden="true">
      {moving &&
        kind === "listen" &&
        [0, 1.2].map((delay) => (
          <motion.span
            key={delay}
            className="border-primary/40 absolute inset-1 rounded-full border"
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", delay }}
          />
        ))}
      <motion.span
        className="grid place-items-center"
        animate={moving ? kindMotion : undefined}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <Icon className="roomy:size-6 size-5" strokeWidth={1.8} />
      </motion.span>
    </span>
  );
}
