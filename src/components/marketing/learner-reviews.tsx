"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { GraduationCap, Quote, Star } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { nextReviewIndex, type ReviewItem } from "@/lib/feedback/reviews-display";
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

const STAR_GLOW = "drop-shadow-[0_0_6px_color-mix(in_oklab,var(--accent)_65%,transparent)]";

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

function ReviewBody({ item, animated }: { item: ReviewItem; animated: boolean }) {
  return (
    // dir="auto": the stars sit on the same side as the learner's own words, in whatever language they wrote.
    <div dir="auto" className="flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <StarRow value={item.rating} animated={animated} />
        <span className="text-foreground/80 text-sm font-semibold tabular-nums" dir="ltr">
          {item.rating.toFixed(1)}
        </span>
      </div>
      <blockquote
        dir="auto"
        className="line-clamp-4 text-[15px] leading-relaxed font-medium text-pretty sm:text-base"
      >
        {item.comment}
      </blockquote>
    </div>
  );
}

/**
 * A premium box of what real learners wrote, one rating at a time. The card in
 * front is always the current one, with two more peeking out behind it like a
 * stack; every few seconds it lifts away and the next rises into its place, its
 * stars popping in one by one. Each rating stays for its own number of seconds
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

  return (
    <section
      aria-label={t.marketing.reviewsHeading}
      className={cn("relative mb-4", className)}
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={() => setHeld(false)}
    >
      {/* Two more cards peeking out from behind: the stack. */}
      <div
        aria-hidden="true"
        className="border-border/70 bg-card/60 absolute inset-x-4 top-4 -bottom-2 rounded-3xl border"
      />
      <div
        aria-hidden="true"
        className="border-border/50 bg-card/30 absolute inset-x-8 top-8 -bottom-4 rounded-3xl border"
      />

      <div className="border-primary/20 bg-card shadow-primary/10 relative overflow-hidden rounded-3xl border p-5 shadow-xl">
        {/* A tint across the card (over a solid base, so the stack behind never shows through), a soft glow in the corner, and a quotation mark as the ornament. */}
        <div
          aria-hidden="true"
          className="from-primary/10 pointer-events-none absolute inset-0 bg-gradient-to-br via-transparent to-transparent"
        />
        <div
          aria-hidden="true"
          className="bg-primary/20 pointer-events-none absolute -end-10 -top-10 size-36 rounded-full blur-3xl"
        />
        <Quote
          aria-hidden="true"
          strokeWidth={0}
          className="text-primary/15 pointer-events-none absolute end-4 top-3 size-16 rotate-180 fill-current rtl:rotate-0"
        />

        <div className="relative flex items-center gap-2.5">
          <span className="from-primary to-accent text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br shadow-md">
            <Quote aria-hidden="true" className="size-4 fill-current" />
          </span>
          <h2 className="text-sm font-semibold tracking-tight">{t.marketing.reviewsHeading}</h2>
        </div>

        <div className="relative mt-4">
          {/* Every rating, laid on top of each other and hidden: sets the height. */}
          <div aria-hidden="true" className="invisible grid">
            {items.map((item) => (
              <div key={item.id} className="col-start-1 row-start-1">
                <ReviewBody item={item} animated={false} />
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
                <ReviewBody item={current} animated />
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="absolute inset-0">
              <ReviewBody item={current} animated={false} />
            </div>
          )}
        </div>

        <div className="relative mt-4 flex items-center justify-between gap-3 border-t border-current/10 pt-3.5">
          <span className="text-muted-foreground flex min-w-0 items-center gap-2 text-xs font-medium">
            <span className="bg-primary/10 text-primary flex size-6 shrink-0 items-center justify-center rounded-full">
              <GraduationCap aria-hidden="true" className="size-3.5" />
            </span>
            <span className="truncate">{t.marketing.reviewsByline}</span>
          </span>

          {items.length > 1 && (
            <div className="flex shrink-0 items-center">
              {items.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActive(index)}
                  aria-label={t.marketing.reviewDotLabel.replace("{n}", String(index + 1))}
                  aria-current={index === active}
                  className="group flex h-5 items-center px-[3px]"
                >
                  <span
                    className={cn(
                      "block h-1.5 rounded-full transition-all duration-300",
                      index === active
                        ? "bg-primary w-5"
                        : "bg-muted-foreground/30 group-hover:bg-muted-foreground/60 w-1.5",
                    )}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
