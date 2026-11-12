"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

import { useFeatures } from "@/components/providers/feature-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { CountUp } from "@/components/words/count-up";
import { useWordProgress } from "@/hooks/use-word-progress";
import { SPINE_TEXT, spineColor } from "@/lib/words-banner/colors";
import { wordsBannerStrings } from "@/lib/words-banner/strings";
import { summarizeBanner, type BannerTopic } from "@/lib/words-banner/summary";
import { cn } from "@/lib/utils";
import type { WordGroupSummary } from "@/types/word-lists";

/** The banner's three fixed colours (it is the same in both themes): the band, its cream, and the dark green on the cream. */
const BAND = "bg-[#1f4a39] text-[#f1efe6]";

const EASE = [0.22, 1, 0.36, 1] as const;

/** A book's height: 120 px for a topic just begun up to 170 px for a finished one. */
const spineHeight = (ratio: number) => 120 + 50 * ratio;

/**
 * The banner at the top of the Words page (the wordsBanner permission), a deep green band: the
 * number of words the learner has learned, how many topics are going and one button on the left, a
 * shelf of books on the right. Each book is a topic the learner has begun, in the colour of its
 * cover, as tall as they have got in it (120 to 170 px) with its English title along the spine; the
 * one studied last leans. A book opens its topic. The button asks for the words waiting for review
 * (with how many) and, when none wait, picks up the last topic, or starts the first one for a
 * learner who has not begun; a learner who has not begun sees three dotted places on the shelf.
 *
 * On entering, the number counts up and the books rise one after another, the leaning one settling
 * last; a book lifts a little under the pointer. All of it stops for a learner who asked for
 * reduced motion. It replaces the review card at the top of the page, so the page gains no element.
 * Below 1280 px it stacks (number, button, shelf) and the shelf shows six books and the leaning one.
 *
 * The learner's progress is read in the browser (a guest's lives there, a signed-in learner's comes
 * from their account), so until it is read the band is drawn empty at its full height: the page
 * never jumps and never flashes a beginner's banner at someone who has begun.
 */
export function WordsBanner({
  groups,
  isPremiumUser,
  reviewCount,
  reviewHref,
  className,
}: {
  groups: WordGroupSummary[];
  isPremiumUser: boolean;
  /** How many words wait for review; 0 turns the button into "pick up where you left off". */
  reviewCount: number;
  /** Where the review button goes. */
  reviewHref: string;
  className?: string;
}) {
  const { locale } = useLocale();
  const s = wordsBannerStrings(locale);
  const { rollouts } = useFeatures();
  const { isLoaded, completedWordIds } = useWordProgress();
  const reducedMotion = useReducedMotion() ?? false;

  const summary = useMemo(
    () => summarizeBanner(groups, completedWordIds, isPremiumUser),
    [groups, completedWordIds, isPremiumUser],
  );

  const shell = cn("relative overflow-hidden rounded-[18px] xl:min-h-[196px]", BAND, className);
  if (!isLoaded)
    return <section aria-hidden="true" className={cn(shell, "max-xl:min-h-[380px]")} />;

  const topicHref = (id: string) =>
    rollouts.wordLadder ? `/learn/word-lists/${id}` : `/learn/word-lists/${id}/words`;

  const cta =
    reviewCount > 0
      ? { label: s.review, href: reviewHref, badge: reviewCount }
      : summary.leanId
        ? { label: s.resume, href: topicHref(summary.leanId), badge: 0 }
        : summary.startId
          ? { label: s.start, href: topicHref(summary.startId), badge: 0 }
          : null;

  return (
    <section
      aria-label={s.sectionLabel}
      dir="ltr"
      className={cn(
        shell,
        "flex flex-col gap-[18px] pt-[22px] pl-5 xl:flex-row xl:items-center xl:gap-7 xl:py-0 xl:pl-[34px]",
      )}
    >
      <div className="grid shrink-0 justify-items-start gap-3.5">
        <p className="flex items-baseline gap-3">
          <CountUp
            value={summary.learned}
            durationMs={1000}
            className="text-[60px] leading-none font-extrabold tracking-[-0.03em] xl:text-[76px]"
          />
          <span className="text-[17px] font-semibold" dir="auto">
            {s.learned}
          </span>
        </p>
        <span
          className="rounded-lg bg-white/10 px-3 py-[5px] text-[13.5px] font-semibold text-[#c2e5d1]"
          dir="auto"
        >
          {s.going(summary.going)}
        </span>
      </div>

      {cta && (
        <Link
          href={cta.href}
          prefetch={false}
          className="me-5 rounded-xl bg-[#f3efe3] px-[26px] py-[13px] text-center text-base font-bold whitespace-nowrap text-[#17261e] shadow-[0_2px_0_rgba(0,0,0,0.18)] outline-none focus-visible:ring-2 focus-visible:ring-[#f3efe3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1f4a39] xl:ms-auto xl:me-1"
        >
          <span dir="auto">{cta.label}</span>
          {cta.badge > 0 && (
            <b className="ms-2 rounded-full bg-[#1f4a39] px-[9px] py-px text-[13.5px] font-extrabold text-[#f1efe6]">
              {cta.badge}
            </b>
          )}
        </Link>
      )}

      <div
        role="list"
        aria-label={s.shelfLabel}
        className="flex items-end gap-1.5 self-stretch overflow-hidden pt-1.5 pr-5 xl:ms-auto xl:pt-6 xl:pr-[34px] xl:pl-[18px] max-xl:[&>*:not(.lean):nth-child(n+7)]:hidden"
      >
        {summary.shelf.length === 0
          ? [0.2, 0.5, 0.2].map((ratio, index) => (
              <Book key={index} index={index} ratio={ratio} reducedMotion={reducedMotion} />
            ))
          : summary.shelf.map((topic, index) => (
              <Book
                key={topic.id}
                index={index}
                topic={topic}
                lean={topic.id === summary.leanId}
                href={topicHref(topic.id)}
                label={s.spineTitle(topic.supportTitle, topic.done, topic.total)}
                reducedMotion={reducedMotion}
              />
            ))}
      </div>

      <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[3px] bg-black/[0.22]" />
    </section>
  );
}

/**
 * One book on the shelf, or (with no topic) one of the three dotted places of a shelf with no book
 * yet. It rises from below one after another by its place; the leaning one rises with the others and
 * then tips over to the right.
 */
function Book({
  index,
  ratio,
  topic,
  lean = false,
  href,
  label,
  reducedMotion,
}: {
  index: number;
  ratio?: number;
  topic?: BannerTopic;
  lean?: boolean;
  href?: string;
  label?: string;
  reducedMotion: boolean;
}) {
  const height = spineHeight(topic ? topic.ratio : (ratio ?? 0));
  const delay = index * 0.07 + (lean ? 0.42 : topic ? 0.28 : 0.3);
  const rise = { duration: 0.75, ease: EASE, delay };
  return (
    <motion.div
      role="listitem"
      className={cn("relative w-9 shrink-0 rounded-t-[3px]", lean && "lean ms-2 me-[18px]")}
      style={{
        height,
        originX: 0,
        originY: 1,
        ...(topic
          ? { background: spineColor(topic.title, topic.level), color: SPINE_TEXT }
          : { border: "1.5px dashed rgba(241,239,230,0.28)" }),
      }}
      initial={reducedMotion ? false : { opacity: 0, y: 52, rotate: 0 }}
      animate={{ opacity: 1, y: 0, rotate: lean ? 12 : 0 }}
      transition={
        lean
          ? {
              opacity: { duration: 0.4, delay },
              y: rise,
              rotate: { duration: 0.45, ease: EASE, delay: delay + 0.5 },
            }
          : { opacity: { duration: 0.4, delay }, y: rise }
      }
      whileHover={
        reducedMotion || !topic ? undefined : { y: lean ? -6 : -9, filter: "brightness(1.08)" }
      }
    >
      {topic && href && (
        <Link
          href={href}
          prefetch={false}
          title={label}
          aria-label={label}
          className="absolute inset-0 flex items-center justify-center rounded-t-[3px] outline-none before:absolute before:inset-x-0 before:top-3.5 before:h-[5px] before:bg-white/40 after:absolute after:inset-x-0 after:bottom-3.5 after:h-[5px] after:bg-white/40 focus-visible:ring-2 focus-visible:ring-[#f3efe3]"
        >
          <span
            dir="ltr"
            className="rotate-180 py-[22px] text-[12.5px] font-bold tracking-[0.01em] whitespace-nowrap [writing-mode:vertical-rl]"
          >
            {topic.title}
          </span>
        </Link>
      )}
    </motion.div>
  );
}
