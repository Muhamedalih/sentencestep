"use client";

import Link from "next/link";
import { Check, Headphones, Play } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { passagesBannerStrings } from "@/lib/passages/banner-strings";
import { passageStatus } from "@/lib/passages/progress";
import type { PassageProgress, PassageSummary } from "@/lib/passages/types";
import { cn } from "@/lib/utils";

/** The seven sound bars' heights (px): the middle-left one is the brightest. */
const WAVE_HEIGHTS = [16, 30, 46, 26, 40, 20, 34] as const;

/** The three questions drawn on the paper: the option each one has ticked and when (seconds) the tick lands. */
const QUESTIONS = [
  { n: 1, picked: 1, delay: 0.7 },
  { n: 2, picked: 0, delay: 1.5 },
  { n: 3, picked: 2, delay: 2.3 },
] as const;

/**
 * The banner at the top of the Passages list (the passagesBanner permission), the approved mock-up
 * of 2026-11-16: a deep petrol band that says what the section is, in one line ("Listen, then test
 * yourself"), with the test style it follows, one button, and on the other side the section drawn
 * as a picture: headphones, a sound wave that breathes, and an exam paper whose answers tick in one
 * by one. It replaces the page's own heading (the headline becomes the page's main heading, and the
 * section's name stays for screen readers).
 *
 * The button goes to the passage "Up next" points at: "Keep listening" once the learner has begun,
 * "Start listening" before, and, when every passage is finished, "Listen again" on the first one.
 * Below 768 px the picture is left out and the band is the text and the button.
 */
export function PassagesBanner({
  passages,
  progress,
  upNextId,
  title,
}: {
  passages: PassageSummary[];
  progress: PassageProgress[];
  /** The passage to point at, or null once everything is done. */
  upNextId: string | null;
  /** The section's name ("Passages"), kept for screen readers in front of the headline. */
  title: string;
}) {
  const { locale } = useLocale();
  const s = passagesBannerStrings(locale);

  const progressById = new Map(progress.map((entry) => [entry.passageId, entry]));
  const begun = passages.some(
    (passage) => passageStatus(progressById.get(passage.id), passage.sectionCount) !== "new",
  );
  const targetId = upNextId ?? passages[0]?.id ?? null;
  const label = upNextId ? (begun ? s.resume : s.start) : s.again;

  return (
    <section
      aria-label={s.sectionLabel}
      dir="ltr"
      className="relative mb-9 flex min-h-[196px] items-center justify-between gap-6 overflow-hidden rounded-[18px] border border-white/[0.08] bg-[#12404a] px-6 py-7 text-white sm:px-[34px] sm:py-[30px]"
    >
      <div className="max-w-[250px] shrink-0 md:w-[250px]">
        {/* The band stays left-to-right in Arabic too (the app's chrome does); each line is read in its own direction but sits on the left. */}
        <p className="mb-3 flex items-center gap-[7px] text-xs text-[#9fd8cd]">
          <Headphones aria-hidden="true" className="size-[15px] shrink-0" />
          <span dir="auto">{s.kicker}</span>
        </p>
        <h1
          className="mb-1.5 text-left text-[26px] leading-tight font-medium text-white"
          dir="auto"
        >
          <span className="sr-only">{title}: </span>
          {s.headline}
        </h1>
        <p className="mb-[18px] text-left text-[13px] text-white/65" dir="auto">
          {s.sub}
        </p>
        {targetId && (
          <Link
            href={`/learn/passages/${targetId}`}
            prefetch={false}
            className="inline-flex items-center gap-2 rounded-xl bg-[#f6f4ee] px-[18px] py-[9px] text-[13px] font-medium text-[#12404a] outline-none focus-visible:ring-2 focus-visible:ring-[#f6f4ee] focus-visible:ring-offset-2 focus-visible:ring-offset-[#12404a]"
          >
            <Play aria-hidden="true" className="size-3.5 fill-current" />
            <span dir="auto">{label}</span>
          </Link>
        )}
      </div>

      <div aria-hidden="true" className="relative hidden h-[164px] w-[340px] shrink-0 md:block">
        <svg
          className="pbn-float absolute top-[38px] left-0"
          width="84"
          height="84"
          viewBox="0 0 100 100"
        >
          <path
            d="M20 60V50a30 30 0 0 1 60 0v10"
            fill="none"
            stroke="#f6f4ee"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          <rect x="11" y="57" width="15" height="27" rx="7.5" fill="#f6f4ee" />
          <rect x="74" y="57" width="15" height="27" rx="7.5" fill="#f6f4ee" />
        </svg>

        <div className="absolute top-[52px] left-[86px] flex h-[60px] items-center gap-[5px]">
          {WAVE_HEIGHTS.map((height, index) => (
            <i
              key={index}
              className={cn(
                "pbn-wave block w-[3px] rounded-sm",
                index === 2 ? "bg-[#f6f4ee]" : "bg-[#9fd8cd]",
              )}
              style={{ height, animationDelay: `${(index * 0.28).toFixed(2)}s` }}
            />
          ))}
        </div>

        <div className="pbn-paper absolute top-0 right-0 box-border h-[164px] w-[186px] rounded-[14px] bg-[#f6f4ee] px-4 py-[15px] text-[#12404a] shadow-[0_12px_28px_rgba(0,0,0,0.22)]">
          <div className="flex items-center justify-between text-[11px] font-medium">
            <span>Listening · Part 2</span>
            <span className="pbn-done inline-flex items-center gap-1 text-[#1f7a55]">
              <Check className="size-3" />3 / 3
            </span>
          </div>
          <div className="mt-[9px] mb-1 h-[3px] overflow-hidden rounded-sm bg-[#dedacd]">
            <b className="pbn-fill block h-[3px] w-full bg-[#12404a]" />
          </div>
          {QUESTIONS.map((question) => (
            <div key={question.n} className="mt-[11px] flex items-center gap-[7px]">
              <em className="w-3 text-[11px] text-[#8a897f] not-italic">{question.n}</em>
              {[0, 1, 2].map((option) => (
                <span
                  key={option}
                  className="relative box-border size-[19px] rounded-full border-[1.5px] border-[#c9c5b8]"
                >
                  {option === question.picked && (
                    <span
                      className="pbn-pick absolute -inset-[1.5px] flex items-center justify-center rounded-full bg-[#12404a]"
                      style={{ animationDelay: `${question.delay}s` }}
                    >
                      <Check className="size-[11px] text-white" strokeWidth={3} />
                    </span>
                  )}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
