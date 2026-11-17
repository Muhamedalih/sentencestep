"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BadgeMedal } from "@/components/app/badge-medal";
import { HybridMomentCard } from "@/components/hybrid/hybrid-moment-card";
import { StoryRatingRow } from "@/components/learning/story-rating-row";
import { UpgradeMomentDialog } from "@/components/upgrade-moments/upgrade-moment-dialog";
import { useLocale } from "@/components/providers/locale-provider";
import { BADGE_DEFS } from "@/lib/features/catalog";
import { resolveVocabularySupportText } from "@/lib/content-helpers";
import { learnerLevelSupportLabel, type LearnerLevelProgress } from "@/lib/progress/learner-level";
import type { CompletionSaveStatus } from "@/hooks/use-progress";
import type { RewardEvent } from "@/lib/progress/types";
import type { StoryWordOutcomes } from "@/lib/story-words";
import type { VocabularyItem } from "@/types/content";

export const GREEN = "#3dba5f";
const INK = "#14192b";

export type StoryFinishAction = {
  id: string;
  label: string;
  href?: string;
  onClick?: () => void;
};

/**
 * A story's finish page in the look of the Words round page (permission storyFinish): a big heading,
 * the accuracy and the speed as two large numbers, the story's words as pale cards in a row, one
 * progress bar, and large buttons (the first, white, is the main one). Nothing else is written on it.
 */
export function StoryFinish({
  lessonId,
  heading,
  accuracyPercent,
  wpm,
  vocabulary,
  wordOutcomes,
  learnerLevel,
  xpIntoLevel,
  xpNeededForLevel,
  xpBarFromPercent,
  actions,
  rewards,
  saveStatus,
  onRetrySave,
  hybridStar,
  accuracy,
}: {
  lessonId: string;
  heading: string;
  accuracyPercent: number;
  wpm: number;
  vocabulary: VocabularyItem[];
  wordOutcomes?: StoryWordOutcomes;
  learnerLevel: LearnerLevelProgress;
  xpIntoLevel: number;
  xpNeededForLevel: number | null;
  xpBarFromPercent: number;
  actions: StoryFinishAction[];
  rewards: RewardEvent[];
  saveStatus: CompletionSaveStatus;
  onRetrySave?: () => void;
  hybridStar?: { passages: number; stories: number } | null;
  accuracy: number;
}) {
  const reduced = useReducedMotion();
  const { t, locale, dir } = useLocale();
  const levelPercent = Math.round(learnerLevel.progress * 100);
  const badges = rewards.filter((r) => r.type === "badgeEarned");
  const numberColor = accuracyPercent >= 80 ? GREEN : undefined;

  return (
    <div className="relative flex min-h-[100svh] w-full flex-col bg-black text-white lg:h-full lg:min-h-0 lg:overflow-y-auto">
      <div
        style={{ zoom: 0.85 }}
        className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-9 px-6 py-10 sm:px-10 lg:gap-11"
      >
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-5"
        >
          <h2 className="text-[clamp(2.6rem,6vw,4.5rem)] leading-tight font-extrabold tracking-tight text-balance">
            {heading}
          </h2>
          <div className="flex flex-wrap items-end gap-x-10 gap-y-3" dir="ltr">
            <div className="flex items-end gap-3">
              <span
                style={{ color: numberColor }}
                className="text-[clamp(3.5rem,8vw,6rem)] leading-none font-extrabold tabular-nums"
              >
                {accuracyPercent}%
              </span>
              <span className="text-muted-foreground pb-2 text-xl font-medium tracking-wide uppercase">
                {t.lesson.accuracyLabel}
              </span>
            </div>
            {wpm > 0 && (
              <div className="flex items-end gap-3">
                <span className="text-[clamp(3.5rem,8vw,6rem)] leading-none font-extrabold tabular-nums">
                  {wpm}
                </span>
                <span className="text-muted-foreground pb-2 text-xl font-medium tracking-wide uppercase">
                  {t.lesson.wpmLabel}
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {vocabulary.length > 0 && (
          <motion.ul
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="grid grid-cols-2 gap-4 lg:grid-cols-4"
          >
            {vocabulary.slice(0, 4).map((item) => {
              const outcome = wordOutcomes?.[item.id];
              return (
                <motion.li
                  whileHover={reduced ? undefined : { y: -6, scale: 1.03 }}
                  transition={{ type: "spring", stiffness: 380, damping: 22 }}
                  key={item.id}
                  style={{
                    background: "linear-gradient(160deg, #e1ded6 0%, #f7f4ec 100%)",
                    color: INK,
                  }}
                  className="relative flex min-h-36 flex-col justify-between rounded-3xl p-5 sm:min-h-40 sm:p-6"
                >
                  {outcome && (
                    <span
                      role="img"
                      aria-label={outcome === "first" ? "✓" : "↻"}
                      style={{ color: outcome === "first" ? "#1f8a43" : "#6b6f7d" }}
                      className="absolute end-4 top-4 flex size-6 items-center justify-center rounded-full bg-black/8"
                    >
                      {outcome === "first" ? (
                        <Check className="size-4" aria-hidden="true" />
                      ) : (
                        <RefreshCw className="size-3.5" aria-hidden="true" />
                      )}
                    </span>
                  )}
                  <span dir="ltr" className="text-[clamp(1.5rem,2.4vw,2rem)] font-bold">
                    {item.en}
                  </span>
                  <span dir={dir} className="text-xl" style={{ color: "#5a5f6e" }}>
                    {resolveVocabularySupportText(item, locale)}
                  </span>
                </motion.li>
              );
            })}
          </motion.ul>
        )}

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4 text-lg font-medium">
            <span className="text-muted-foreground">
              {learnerLevelSupportLabel(learnerLevel.level.name, t)}
            </span>
            {xpNeededForLevel !== null && (
              <span dir="ltr" className="text-white tabular-nums">
                <b>{xpIntoLevel}</b> / {xpNeededForLevel} XP
              </span>
            )}
          </div>
          <div
            role="progressbar"
            aria-valuenow={levelPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-2.5 w-full overflow-hidden rounded-full"
            style={{ backgroundColor: "#151515" }}
          >
            <motion.div
              initial={reduced ? { width: `${levelPercent}%` } : { width: `${xpBarFromPercent}%` }}
              animate={{ width: `${levelPercent}%` }}
              transition={reduced ? { duration: 0 } : { duration: 0.9, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ backgroundColor: GREEN }}
            />
          </div>
        </div>

        {saveStatus === "saving" && (
          <div className="flex items-center gap-2 text-sm text-white/50">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            {t.lesson.savingProgress}
          </div>
        )}
        {saveStatus === "error" && (
          <div className="flex items-center gap-3 text-sm text-red-400">
            {t.lesson.saveFailed}
            {onRetrySave && (
              <Button variant="outline" size="sm" onClick={onRetrySave}>
                {t.lesson.retry}
              </Button>
            )}
          </div>
        )}

        {badges.length > 0 && (
          <ul className="flex flex-wrap gap-3">
            {badges.map((reward) => {
              const group = BADGE_DEFS.find((b) => b.id === reward.badgeId)?.group;
              return (
                <li
                  key={reward.badgeId}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-2.5"
                >
                  {group && <BadgeMedal group={group} earned className="size-11" />}
                  <span className="text-base font-semibold" dir={dir}>
                    {t.badges.items[reward.badgeId].name}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-[repeat(auto-fit,minmax(0,1fr))]">
          {actions.map((action, index) => (
            <FinishButton key={action.id} action={action} primary={index === 0}>
              {action.label}
            </FinishButton>
          ))}
        </div>

        {hybridStar && accuracy >= 0.9 && (
          <HybridMomentCard
            moment="star"
            passages={hybridStar.passages}
            stories={hybridStar.stories}
          />
        )}
        <UpgradeMomentDialog candidates={["story"]} storyId={lessonId} />
        <StoryRatingRow
          lessonId={lessonId}
          mode="stories"
          color="rgba(255,255,255,0.55)"
          accentColor={GREEN}
        />
      </div>
    </div>
  );
}

const MotionLink = motion.create(Link);
const SPRING = { type: "spring", stiffness: 420, damping: 24, mass: 0.7 } as const;

export function FinishButton({
  action,
  primary,
  children,
}: {
  action: StoryFinishAction;
  primary: boolean;
  children: ReactNode;
}) {
  const reduced = useReducedMotion();
  const className =
    "flex h-[4.5rem] items-center justify-center rounded-2xl border px-4 text-center text-xl font-semibold sm:h-20 sm:text-2xl " +
    (primary
      ? "border-transparent bg-[#f1f2f6] text-[#12141c]"
      : "border-[#1e1e22] bg-black text-white");
  const hover = primary
    ? {
        backgroundColor: "#ffffff",
        boxShadow: "0 18px 36px -14px rgba(255,255,255,0.45)",
        ...(reduced ? {} : { y: -5, scale: 1.03 }),
      }
    : {
        borderColor: GREEN,
        backgroundColor: "rgba(61,186,95,0.12)",
        ...(reduced ? {} : { y: -5, scale: 1.03 }),
      };
  const tap = reduced ? undefined : { scale: 0.95, y: 0 };
  if (action.href) {
    return (
      <MotionLink
        href={action.href}
        onClick={action.onClick}
        className={className}
        whileHover={hover}
        whileTap={tap}
        transition={SPRING}
      >
        {children}
      </MotionLink>
    );
  }
  return (
    <motion.button
      type="button"
      onClick={action.onClick}
      className={className}
      whileHover={hover}
      whileTap={tap}
      transition={SPRING}
    >
      {children}
    </motion.button>
  );
}
