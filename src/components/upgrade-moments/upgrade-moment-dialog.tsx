"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Check, X } from "lucide-react";

import { useFeatures } from "@/components/providers/feature-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { claimUpgradeMoment, trackUpgradeMoment } from "@/lib/upgrade-moments/actions";
import type { ClaimedMoment } from "@/lib/upgrade-moments/actions";
import type { UpgradeMoment } from "@/lib/upgrade-moments/rules";
import { upgradeMomentStrings } from "@/lib/upgrade-moments/strings";

/** The calm palette of the card: the lock screen's indigo with real black added, on a dark body. */
const HEADER_BACKGROUND = "linear-gradient(135deg, #1e2067, #1e0b4a)";

/**
 * The upgrade card at a moment of progress (the "upgradeMoments" permission): the look of the lock
 * screen, drawn over the page once when the learner has just achieved something — the day's tasks,
 * a third day in a row, a story finished outside the tasks. It asks the server first (the once-a-day
 * rule and every other check live there), so it appears only when allowed; «لاحقاً», the close button,
 * Escape and a tap outside all close it, and the close is counted. The lock screens of lessons are
 * not touched by it.
 */
export function UpgradeMomentDialog({
  candidates,
  storyId,
}: {
  candidates: readonly UpgradeMoment[];
  /** For the story card: the story that was just finished (see claimUpgradeMoment). */
  storyId?: string;
}) {
  const open = useFeatures().rollouts.upgradeMoments;
  const { locale } = useLocale();
  const [claimed, setClaimed] = useState<ClaimedMoment | null>(null);
  const key = candidates.join(",");

  useEffect(() => {
    if (!open) return;
    let active = true;
    claimUpgradeMoment(key.split(",") as UpgradeMoment[], storyId)
      .then((result) => {
        if (active && result) setClaimed(result);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [open, key, storyId]);

  const dismiss = useCallback(() => {
    setClaimed((current) => {
      if (current) void trackUpgradeMoment(current.moment, "dismissed");
      return null;
    });
  }, []);

  const buttonRef = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    if (!claimed) return;
    buttonRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [claimed, dismiss]);

  if (!claimed) return null;
  const copy = upgradeMomentStrings(locale);
  const text = copy.moments[claimed.moment];
  const tiles = [
    { value: claimed.streak, label: copy.streakLabel },
    { value: claimed.lessons, label: copy.lessonsLabel },
    { value: claimed.stories, label: copy.storiesLabel },
  ].filter((tile) => tile.value > 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4"
      onClick={dismiss}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-moment-title"
        onClick={(event) => event.stopPropagation()}
        className="relative grid w-full max-w-3xl overflow-hidden rounded-[20px] border border-[#232a36] bg-[#171b22] text-[#e4e7ee] shadow-2xl md:grid-cols-[0.9fr_1.1fr]"
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label={copy.close}
          className="absolute end-3 top-3 z-10 grid size-8 place-items-center rounded-full text-[#b4b8d6] outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-[#8a8fe8] pointer-coarse:size-10"
        >
          <X className="size-4" aria-hidden="true" strokeWidth={1.8} />
        </button>

        <div
          className="relative flex min-h-36 flex-col justify-between gap-6 p-5 md:min-h-full md:p-6"
          style={{ background: HEADER_BACKGROUND }}
        >
          <span
            dir="auto"
            className="w-fit rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-[#dcdcf7]"
          >
            {text.badge}
          </span>
          {tiles.length > 0 && (
            <dl className="flex flex-wrap gap-2.5">
              {tiles.map((tile) => (
                <div
                  key={tile.label}
                  className="min-w-24 flex-1 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5"
                >
                  <dd className="text-2xl font-semibold text-[#f1f2fb] tabular-nums">
                    {tile.value}
                  </dd>
                  <dt dir="auto" className="text-xs text-[#aab0cf]">
                    {tile.label}
                  </dt>
                </div>
              ))}
            </dl>
          )}
        </div>

        <div className="flex flex-col gap-4 p-5 md:p-6">
          <p className="text-[11px] font-medium tracking-[0.16em] text-[#9a9fe0]">{copy.kicker}</p>
          <div className="flex flex-col gap-2">
            <h2
              id="upgrade-moment-title"
              dir="auto"
              className="text-xl leading-snug font-semibold text-balance text-[#f1f2fb]"
            >
              {text.heading}
            </h2>
            <p dir="auto" className="text-sm leading-relaxed text-[#9aa3b6]">
              {text.body}
            </p>
          </div>
          <ul className="flex flex-col gap-2.5">
            {text.benefits.map((benefit) => (
              <li
                key={benefit}
                dir="auto"
                className="flex items-start gap-3 text-sm text-[#cdd2de]"
              >
                <span
                  className="mt-px grid size-5 shrink-0 place-items-center rounded-full bg-[#1c212d] text-[#8a8fe8]"
                  aria-hidden="true"
                >
                  <Check className="size-3" strokeWidth={3} />
                </span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
          <div className="mt-1 flex flex-col gap-2">
            <Link
              ref={buttonRef}
              href="/upgrade"
              dir="auto"
              onClick={() => {
                void trackUpgradeMoment(claimed.moment, "clicked");
              }}
              className="inline-flex h-11 items-center justify-center rounded-[10px] bg-[#3d41a8] px-6 text-sm font-semibold text-white outline-none hover:bg-[#4549b8] focus-visible:ring-2 focus-visible:ring-[#8a8fe8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#171b22]"
            >
              {copy.cta}
            </Link>
            <button
              type="button"
              onClick={dismiss}
              dir="auto"
              className="h-9 rounded-lg text-xs text-[#8b93a3] outline-none hover:text-[#cdd2de] focus-visible:ring-2 focus-visible:ring-[#8a8fe8] pointer-coarse:h-11"
            >
              {copy.later}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
