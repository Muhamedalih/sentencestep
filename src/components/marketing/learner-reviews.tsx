"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Star } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { nextReviewIndex, type ReviewItem } from "@/lib/feedback/reviews-display";
import { cn } from "@/lib/utils";

function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-hidden="true">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            "size-3.5",
            i <= value ? "text-accent fill-current" : "text-muted-foreground/30",
          )}
        />
      ))}
    </span>
  );
}

/**
 * A small box of what real learners wrote, one rating at a time: each fades in,
 * stays for its own number of seconds (set per rating in Admin > Ratings, or
 * picked by the length of the comment), then gives way to the next, round and
 * round. Hovering or focusing the box holds the current one, so it can be read
 * in peace. For visitors who ask their device for less motion nothing rotates:
 * every rating is simply listed.
 *
 * All the ratings sit stacked in one grid cell, so the box is always as tall as
 * the tallest comment and the page never jumps as they change. The words are the
 * learners' own, in whatever language they wrote them, so each reads in its own
 * direction (dir="auto").
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

  const rotating = !reducedMotion && items.length > 1;

  useEffect(() => {
    if (!rotating || held) return;
    const seconds = items[active]?.seconds ?? 2;
    const timer = window.setTimeout(
      () => setActive((current) => nextReviewIndex(current, items.length)),
      seconds * 1000,
    );
    return () => window.clearTimeout(timer);
  }, [rotating, held, active, items]);

  if (items.length === 0) return null;

  return (
    <section
      aria-label={t.marketing.reviewsHeading}
      className={cn("border-border bg-card rounded-2xl border p-4", className)}
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={() => setHeld(false)}
    >
      <h2 className="text-sm font-semibold">{t.marketing.reviewsHeading}</h2>

      {rotating ? (
        <>
          <div className="mt-3 grid">
            {items.map((item, index) => {
              const shown = index === active;
              return (
                <figure
                  key={item.id}
                  aria-hidden={!shown}
                  className={cn(
                    "col-start-1 row-start-1 flex flex-col gap-1.5 transition-[opacity,transform] motion-reduce:transition-none",
                    shown
                      ? "translate-y-0 opacity-100 delay-150 duration-300"
                      : "pointer-events-none translate-y-1 opacity-0 duration-150",
                  )}
                >
                  <Stars value={item.rating} />
                  <blockquote dir="auto" className="line-clamp-4 text-sm leading-relaxed">
                    {item.comment}
                  </blockquote>
                </figure>
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-center gap-1">
            {items.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActive(index)}
                aria-label={t.marketing.reviewDotLabel.replace("{n}", String(index + 1))}
                aria-current={index === active}
                className="group flex size-5 items-center justify-center"
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full transition-colors",
                    index === active
                      ? "bg-primary"
                      : "bg-muted-foreground/30 group-hover:bg-muted-foreground/60",
                  )}
                />
              </button>
            ))}
          </div>
        </>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {items.map((item) => (
            <li key={item.id} className="flex flex-col gap-1.5">
              <Stars value={item.rating} />
              <blockquote dir="auto" className="text-sm leading-relaxed">
                {item.comment}
              </blockquote>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
