"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * One section of the library in the shelves look (the "videoShelves" permission): its name, count and one
 * line, then ONE row of cards that slides sideways (arrows, a swipe or the trackpad), as YouTube lists
 * its Shorts. «عرض الكل» opens the whole section in place as a grid, «عرض أقل» closes it; the arrows and
 * the button show only when the row holds more than it can show. Below 640 px the row is not used: the
 * section shows `phone`, the list of rows the library always had there.
 */
export function ShelfSection({
  name,
  line,
  count,
  wide,
  labels,
  phone,
  children,
}: {
  name: string;
  line: string;
  count: number;
  /** Every video of the section is wide (16:9): fewer, wider cards per row. */
  wide: boolean;
  labels: { showAll: string; showLess: string; previous: string; next: string };
  /** The section as the phone shows it (below 640 px). */
  phone: ReactNode;
  /** The cards, one <li> each. */
  children: ReactNode;
}) {
  const shelf = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [edges, setEdges] = useState({ more: false, atStart: true, atEnd: true });

  // What the row holds beyond what it shows, and where it is scrolled to. Read from the DOM, so it is
  // right at every width (3, 4 or 5 cards a row); a hidden row (on a phone) reads as "nothing more".
  const measure = useCallback(() => {
    const el = shelf.current;
    if (!el || open) return;
    const max = el.scrollWidth - el.clientWidth;
    const next = { more: max > 1, atStart: el.scrollLeft <= 1, atEnd: el.scrollLeft >= max - 1 };
    setEdges((current) =>
      current.more === next.more && current.atStart === next.atStart && current.atEnd === next.atEnd
        ? current
        : next,
    );
  }, [open]);

  useEffect(() => {
    const el = shelf.current;
    if (!el) return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    el.addEventListener("scroll", measure, { passive: true });
    return () => {
      observer.disconnect();
      el.removeEventListener("scroll", measure);
    };
  }, [measure]);

  function slide(direction: 1 | -1) {
    const el = shelf.current;
    if (!el) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // One row's width plus the gap: the next cards land exactly where these were.
    el.scrollBy({ left: direction * (el.clientWidth + 16), behavior: still ? "auto" : "smooth" });
  }

  const roundButton =
    "border-border bg-card text-foreground hover:bg-muted focus-visible:ring-ring grid size-[34px] place-items-center rounded-full border transition-colors outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-35";

  return (
    <section>
      <div className="mb-4 flex items-end gap-4">
        {(edges.more || open) && (
          <div className="flex shrink-0 items-center gap-2 max-sm:hidden">
            {!open && (
              <>
                <button
                  type="button"
                  className={roundButton}
                  onClick={() => slide(-1)}
                  disabled={edges.atStart}
                  aria-label={`${labels.previous}: ${name}`}
                >
                  <ChevronLeft aria-hidden="true" className="size-4" strokeWidth={2.2} />
                </button>
                <button
                  type="button"
                  className={roundButton}
                  onClick={() => slide(1)}
                  disabled={edges.atEnd}
                  aria-label={`${labels.next}: ${name}`}
                >
                  <ChevronRight aria-hidden="true" className="size-4" strokeWidth={2.2} />
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setOpen((current) => !current)}
              aria-expanded={open}
              className="text-brand focus-visible:ring-ring mr-1.5 rounded-md text-sm font-semibold outline-none hover:underline focus-visible:ring-2"
            >
              <span dir="auto">{open ? labels.showLess : labels.showAll}</span>
            </button>
          </div>
        )}
        <div className="min-w-0 flex-1 text-right">
          <h2 className="text-xl leading-[1.3] font-bold" dir="auto">
            {name}
            <span className="text-muted-foreground mr-2 text-sm font-medium tabular-nums">
              {count}
            </span>
          </h2>
          <p className="text-muted-foreground mt-0.5 text-sm" dir="auto">
            {line}
          </p>
        </div>
      </div>
      <div className="sm:hidden">{phone}</div>
      <ul
        ref={shelf}
        dir="ltr"
        className={cn(
          "grid gap-4 max-sm:hidden",
          open
            ? wide
              ? "grid-cols-2 gap-y-6 xl:grid-cols-3"
              : "grid-cols-3 gap-y-6 lg:grid-cols-4 xl:grid-cols-5"
            : cn(
                "snap-x snap-mandatory [scrollbar-width:none] grid-flow-col overflow-x-auto overscroll-x-contain [&::-webkit-scrollbar]:hidden",
                wide
                  ? "auto-cols-[calc((100%-1rem)/2)] xl:auto-cols-[calc((100%-2rem)/3)]"
                  : "auto-cols-[calc((100%-2rem)/3)] lg:auto-cols-[calc((100%-3rem)/4)] xl:auto-cols-[calc((100%-4rem)/5)]",
              ),
        )}
      >
        {children}
      </ul>
    </section>
  );
}
