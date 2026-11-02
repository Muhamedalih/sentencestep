"use client";

import Link from "next/link";
import type { Ref } from "react";
import { Check, X } from "lucide-react";

import type { UpgradeMoment } from "@/lib/upgrade-moments/rules";
import type { UpgradeMomentStrings } from "@/lib/upgrade-moments/strings";

/** The calm palette of the card: the lock screen's indigo with real black added, on a dark body. */
const HEADER_BACKGROUND = "linear-gradient(135deg, #1e2067, #1e0b4a)";

/** What a card is drawn with: which moment, and the learner's own week. */
export interface MomentFigures {
  moment: UpgradeMoment;
  lessons: number;
  stories: number;
  streak: number;
}

/**
 * The upgrade card itself, over a dimmed page: only the drawing and its two ways out. The button is a
 * plain link to the plans page (the same page the lock screens lead to) and «لاحقاً», the close
 * button and a tap outside all call `onDismiss`; deciding whether to show it is the dialog's job
 * (see upgrade-moment-dialog.tsx).
 */
export function UpgradeMomentCard({
  figures,
  copy,
  onDismiss,
  onUpgrade,
  buttonRef,
}: {
  figures: MomentFigures;
  copy: UpgradeMomentStrings;
  onDismiss: () => void;
  onUpgrade: () => void;
  buttonRef?: Ref<HTMLAnchorElement>;
}) {
  const text = copy.moments[figures.moment];
  const tiles = [
    { value: figures.streak, label: copy.streakLabel },
    { value: figures.lessons, label: copy.lessonsLabel },
    { value: figures.stories, label: copy.storiesLabel },
  ].filter((tile) => tile.value > 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4"
      onClick={onDismiss}
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
          onClick={onDismiss}
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
              onClick={onUpgrade}
              className="inline-flex h-11 items-center justify-center rounded-[10px] bg-[#3d41a8] px-6 text-sm font-semibold text-white outline-none hover:bg-[#4549b8] focus-visible:ring-2 focus-visible:ring-[#8a8fe8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#171b22]"
            >
              {copy.cta}
            </Link>
            <button
              type="button"
              onClick={onDismiss}
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
