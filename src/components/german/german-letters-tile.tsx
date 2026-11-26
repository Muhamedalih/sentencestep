"use client";

import Link from "next/link";
import { Check } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { GERMAN_ALPHABET } from "@/lib/german-alphabet";
import { germanLettersStrings } from "@/lib/german-letters";
import { useGermanLettersDone } from "@/lib/german-letters-state";

/** Four flat letter blocks, drawn like the topic covers (soft ground, muted colours, no outlines). */
function LettersArt() {
  const blocks = [
    { x: 38, y: 78, r: -8, fill: "#4a5a96", text: "Ä" },
    { x: 118, y: 52, r: 6, fill: "#e07a5f", text: "Ö" },
    { x: 196, y: 84, r: -5, fill: "#81b29a", text: "Ü" },
    { x: 262, y: 58, r: 9, fill: "#c98bab", text: "ß" },
  ];
  return (
    <svg viewBox="0 0 400 300" className="absolute inset-0 size-full" aria-hidden="true">
      <rect width="400" height="300" fill="#e4e0f1" />
      <rect y="214" width="400" height="86" fill="#d3cdea" />
      <circle cx="318" cy="92" r="58" fill="#d9d3ee" />
      {blocks.map((b) => (
        <g key={b.text} transform={`translate(${b.x} ${b.y + 34}) rotate(${b.r} 40 40)`}>
          <rect y="6" width="80" height="84" rx="12" fill="#000" opacity="0.12" />
          <rect width="80" height="84" rx="12" fill={b.fill} />
          <text
            x="40"
            y="62"
            textAnchor="middle"
            fontSize="52"
            fontWeight="700"
            fill="#fbf8f2"
            fontFamily="Arial, Helvetica, sans-serif"
          >
            {b.text}
          </text>
        </g>
      ))}
    </svg>
  );
}

/**
 * The first lesson of the German Words page (permission germanZero), drawn as a full topic card like the
 * others: a cover, the title, the Arabic title and the number of letters. A check on the cover once the
 * letters practice was finished or skipped.
 */
export function GermanLettersTile() {
  const { locale, dir } = useLocale();
  const s = germanLettersStrings(locale);
  const done = useGermanLettersDone();
  return (
    <div className="group relative">
      <Link
        href="/learn/german-alphabet"
        prefetch={false}
        aria-label={s.tileTitle}
        className="focus-visible:ring-ring focus-visible:ring-offset-background block rounded-[14px] outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        <span className="relative block aspect-[4/3] w-full overflow-hidden rounded-[14px] ring-1 ring-black/[0.06] transition-transform duration-[250ms] ring-inset motion-safe:group-hover:-translate-y-[3px] dark:ring-transparent">
          <LettersArt />
          {done && (
            <span
              aria-hidden="true"
              className="absolute top-2 left-2 flex size-7 items-center justify-center rounded-full bg-[#4a5a96] text-white sm:top-2.5 sm:left-2.5"
            >
              <Check className="size-3.5" />
            </span>
          )}
        </span>
        <span className="block pt-3">
          <span className="flex items-baseline justify-between gap-2.5">
            <h3
              className="min-w-0 text-start text-[15.5px] leading-tight font-semibold sm:text-[18px]"
              dir="ltr"
            >
              {s.tileTitle}
            </h3>
            <span className="text-muted-foreground shrink-0 text-[12.5px] sm:text-sm" dir="auto">
              {s.tileCount(GERMAN_ALPHABET.length)}
            </span>
          </span>
          <span
            className="text-muted-foreground mt-0.5 block truncate text-start text-[13px] sm:text-sm"
            dir={dir}
          >
            {s.cardTitle}
          </span>
          {done && (
            <span className="bg-border mt-2.5 block h-1 overflow-hidden rounded-full">
              <span className="block h-full w-full rounded-full bg-[#4a5a96]" />
            </span>
          )}
        </span>
      </Link>
    </div>
  );
}
