"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { Star } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { nextReviewIndex, textDirection, type ReviewItem } from "@/lib/feedback/reviews-display";
import { cn } from "@/lib/utils";

/** A card arrives from below, sharpening out of a soft blur on a spring, and leaves upward a touch quicker. */
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.96, filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 240, damping: 24, mass: 0.9 },
  },
  exit: {
    opacity: 0,
    y: -24,
    scale: 0.97,
    filter: "blur(8px)",
    transition: { duration: 0.26, ease: [0.4, 0, 1, 1] },
  },
};

/** The stars pop in one after another as their card settles. */
const starsVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055, delayChildren: 0.12 } },
};
const starVariants: Variants = {
  hidden: { opacity: 0, scale: 0.2, rotate: -28 },
  show: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: { type: "spring", stiffness: 520, damping: 15 },
  },
};

const STAR_GLOW = "drop-shadow-[0_0_3px_color-mix(in_oklab,var(--accent)_30%,transparent)]";

function StarRow({ value, animated }: { value: number; animated: boolean }) {
  const stars = [1, 2, 3, 4, 5].map((i) => (
    <Star
      key={i}
      className={cn(
        "size-5",
        i <= value
          ? cn("text-accent fill-accent", STAR_GLOW)
          : "text-muted-foreground/30 fill-transparent",
      )}
    />
  ));

  if (!animated) return <span className="inline-flex items-center gap-1">{stars}</span>;

  return (
    <motion.span variants={starsVariants} className="inline-flex items-center gap-1">
      {stars.map((star) => (
        <motion.span key={star.key} variants={starVariants} className="inline-flex">
          {star}
        </motion.span>
      ))}
    </motion.span>
  );
}

function ReviewBody({
  item,
  byline,
  animated,
}: {
  item: ReviewItem;
  byline: string;
  animated: boolean;
}) {
  return (
    // The whole rating reads the way the learner's words do, so the stars sit on the same side as them.
    <div dir={textDirection(item.comment)} className="flex flex-col gap-2">
      <div className="flex items-center gap-2.5">
        <StarRow value={item.rating} animated={animated} />
        <span className="text-foreground text-sm font-semibold tabular-nums" dir="ltr">
          {item.rating.toFixed(1)}
        </span>
        <span className="text-muted-foreground ms-auto truncate text-xs">{byline}</span>
      </div>
      <blockquote className="text-foreground line-clamp-3 text-[15px] leading-relaxed font-medium text-pretty sm:text-base">
        {item.comment}
      </blockquote>
    </div>
  );
}

/**
 * A compact box of what real learners wrote, one rating at a time, kept quiet so
 * the stars and the words are what the eye lands on. The card in front is always
 * the current one, with two more peeking out behind it like a stack; every few
 * seconds it lifts away and the next rises into its place, its stars popping in
 * one by one. Each rating stays for its own number of seconds
 * (set in Admin > Ratings, or picked by the length of the comment), then it goes
 * round again. Hovering or focusing the box, or leaving the tab, holds the
 * current one. For visitors who ask their device for less motion nothing moves
 * by itself: the first rating is shown and the dots below step through the rest.
 *
 * The words are the learners' own, in whatever language they wrote them, so each
 * reads in its own direction (dir="auto"). All the ratings are also laid out,
 * invisibly, in one grid cell so the box is always as tall as the tallest
 * comment and the page never jumps as they change.
 */
export function LearnerReviews({
  items,
  className,
}: {
  items: readonly ReviewItem[];
  className?: string;
}) {
  const { t } = useLocale();
  const reducedMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const [held, setHeld] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);

  const rotating = !reducedMotion && items.length > 1;

  useEffect(() => {
    const onVisibility = () => setTabHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    if (!rotating || held || tabHidden) return;
    const seconds = items[active]?.seconds ?? 2;
    const timer = window.setTimeout(
      () => setActive((current) => nextReviewIndex(current, items.length)),
      seconds * 1000,
    );
    return () => window.clearTimeout(timer);
  }, [rotating, held, tabHidden, active, items]);

  if (items.length === 0) return null;
  const current = items[active % items.length]!;
  const byline = t.marketing.reviewsByline;

  return (
    <section
      aria-label={t.marketing.reviewsHeading}
      className={cn("relative mb-3", className)}
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={() => setHeld(false)}
    >
      {/* Two more cards peeking out from under the box: the stack. Only their lower edges show, so nothing busy shows through the glass. */}
      <div
        aria-hidden="true"
        className="border-border/50 absolute inset-x-3 -bottom-1.5 h-4 rounded-b-2xl border-x border-b"
      />
      <div
        aria-hidden="true"
        className="border-border/30 absolute inset-x-6 -bottom-3 h-4 rounded-b-2xl border-x border-b"
      />

      {/* Semi-transparent, frosted: the page shows faintly through it. */}
      <div className="border-border/60 bg-card/50 relative overflow-hidden rounded-2xl border px-5 py-4 backdrop-blur-md">
        <div
          aria-hidden="true"
          className="from-primary/5 pointer-events-none absolute inset-0 bg-gradient-to-br via-transparent to-transparent"
        />

        <div className="relative flex items-center justify-between gap-3">
          <h2 className="text-muted-foreground min-w-0 truncate text-xs font-medium">
            {t.marketing.reviewsHeading}
          </h2>

          {items.length > 1 && (
            <div className="flex shrink-0 items-center">
              {items.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActive(index)}
                  aria-label={t.marketing.reviewDotLabel.replace("{n}", String(index + 1))}
                  aria-current={index === active}
                  className="group flex h-4 items-center px-[2.5px]"
                >
                  <span
                    className={cn(
                      "block h-1.5 rounded-full transition-all duration-300",
                      index === active
                        ? "bg-primary w-4"
                        : "bg-muted-foreground/25 group-hover:bg-muted-foreground/50 w-1.5",
                    )}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative mt-3">
          {/* Every rating, laid on top of each other and hidden: sets the height. */}
          <div aria-hidden="true" className="invisible grid">
            {items.map((item) => (
              <div key={item.id} className="col-start-1 row-start-1">
                <ReviewBody item={item} byline={byline} animated={false} />
              </div>
            ))}
          </div>

          {rotating ? (
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={current.id}
                variants={cardVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                className="absolute inset-0"
              >
                <ReviewBody item={current} byline={byline} animated />
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="absolute inset-0">
              <ReviewBody item={current} byline={byline} animated={false} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
