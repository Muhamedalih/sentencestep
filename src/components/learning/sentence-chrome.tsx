"use client";

import type { ReactNode } from "react";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

import { useLocale } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";

/**
 * The per-mode chrome around a sentence, shared by the typing view and the
 * Dictation view so switching Dictation on changes only the text, never the
 * frame it sits in.
 */

/**
 * Stories mode's header row: progress ring + story label + title on the left,
 * and on the right the sentence counter with step-back/step-forward buttons
 * and the rough time left. See TypingSentence's doc comment for what each prop
 * means.
 */
export function StoryHeaderRow({
  storyTitle,
  sentenceNumber,
  totalSentences,
  storyTimeRemainingLabel,
  onGoBack,
  onGoForward,
}: {
  storyTitle?: string;
  sentenceNumber?: number;
  totalSentences?: number;
  storyTimeRemainingLabel?: string;
  onGoBack?: () => void;
  onGoForward?: () => void;
}) {
  const { t } = useLocale();

  return (
    <div className="land-kb-hide mb-3 flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <StoryProgressRing current={sentenceNumber} total={totalSentences} />
        <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold tracking-wide text-[var(--lesson-story-label)] uppercase">
          {t.lesson.story}
        </span>
        {storyTitle && (
          <span className="text-foreground/40 min-w-0 truncate text-xs max-sm:hidden" dir="ltr">
            · {storyTitle}
          </span>
        )}
      </div>
      <div
        className="text-muted-foreground flex shrink-0 items-center gap-1 text-xs font-medium tabular-nums"
        dir="ltr"
      >
        {onGoBack && sentenceNumber != null && sentenceNumber > 1 && (
          <button
            type="button"
            onClick={onGoBack}
            aria-label={t.lesson.previousSentenceButton}
            title={t.lesson.previousSentenceButton}
            className="hover:text-foreground hover:bg-muted -my-1 flex size-5 shrink-0 items-center justify-center rounded-full transition-colors pointer-coarse:-my-3 pointer-coarse:size-11"
          >
            <ChevronLeft className="size-3" aria-hidden="true" />
          </button>
        )}
        {sentenceNumber != null && totalSentences != null && (
          <span>
            {sentenceNumber} / {totalSentences}
          </span>
        )}
        {onGoForward && (
          <button
            type="button"
            onClick={onGoForward}
            aria-label={t.lesson.nextSentenceButton}
            title={t.lesson.nextSentenceButton}
            className="hover:text-foreground hover:bg-muted -my-1 flex size-5 shrink-0 items-center justify-center rounded-full transition-colors pointer-coarse:-my-3 pointer-coarse:size-11"
          >
            <ChevronRight className="size-3" aria-hidden="true" />
          </button>
        )}
        {storyTimeRemainingLabel && <span className="text-foreground/30">·</span>}
        {storyTimeRemainingLabel && <span>{storyTimeRemainingLabel}</span>}
      </div>
    </div>
  );
}

/**
 * Conversation mode's chat bubble: the speaker's badge and the bubble around
 * `children`, aligned left for speaker A and right for the replier B. No
 * enter/exit animation, for the reason given in TypingSentence.
 */
export function ConversationBubble({
  speaker,
  children,
}: {
  speaker?: string;
  children: ReactNode;
}) {
  const isReplier = speaker === "B";

  return (
    <motion.div initial={false} className={cn("flex", isReplier ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "flex max-w-[92%] items-start gap-3 sm:max-w-[75%]",
          isReplier && "flex-row-reverse",
        )}
      >
        <div
          aria-hidden="true"
          className={cn(
            "mt-1 flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
            isReplier
              ? "text-primary-foreground bg-[var(--lesson-speaker)]"
              : "bg-[var(--lesson-secondary)] text-[var(--lesson-speaker)]",
          )}
        >
          {speaker}
        </div>
        <div
          className={cn(
            "border-border min-w-0 rounded-2xl border p-5 sm:p-6",
            isReplier ? "bg-primary/5 rounded-tr-sm" : "bg-card rounded-tl-sm",
          )}
        >
          {children}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Small book icon ringed by this story's overall completion (current
 * sentence / total), Stories mode's header only. Falls back to a plain
 * (un-ringed) icon when either number is missing rather than guessing a
 * percentage — callers that don't pass sentenceNumber/totalSentences get
 * exactly the old bare-icon look.
 */
function StoryProgressRing({ current, total }: { current?: number; total?: number }) {
  if (!current || !total) {
    return <BookOpen className="size-3.5 text-[var(--lesson-story-label)]" aria-hidden="true" />;
  }

  const size = 20;
  const strokeWidth = 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = Math.min(1, current / total);
  const offset = circumference * (1 - percent);

  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-[var(--lesson-story-label)] opacity-20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-[var(--lesson-story-label)] transition-[stroke-dashoffset] duration-500 ease-out"
        />
      </svg>
      <BookOpen className="absolute size-2.5 text-[var(--lesson-story-label)]" aria-hidden="true" />
    </span>
  );
}
