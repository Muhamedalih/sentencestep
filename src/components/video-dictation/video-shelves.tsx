import Link from "next/link";
import type { ReactNode } from "react";

import type { VideoSection } from "@/lib/video-dictation/arrange";
import type { VideoCardData } from "@/lib/video-dictation/content";
import { formatClipLength, shelfThumbnailUrl } from "@/lib/video-dictation/format";
import { fill } from "@/lib/video-dictation/strings";
import type { VideoStrings } from "@/lib/video-dictation/strings";

import { VideoCard } from "./video-card";
import { ShelfSection } from "./video-shelf-section";

/**
 * The library in the shelves look (the "videoShelves" permission, the approved mock-up of 2026-11-07):
 * a header with a small «فيديو» over one line that says why to watch, then one sliding row per section,
 * each with its own name and line. The sections and their order are the ones the page arranged (the
 * Admin's saved arrangement, or easiest first); an empty section is not shown. Shared by the learners'
 * page and the Admin's (which passes its arrange button as `action`).
 */
export function ShelvesLibrary({
  sections,
  cards,
  strings,
  action,
  status,
}: {
  sections: readonly VideoSection[];
  cards: Readonly<Record<string, VideoCardData>>;
  strings: VideoStrings;
  action?: ReactNode;
  /** A line under the header (the Admin's "saved" message). */
  status?: ReactNode;
}) {
  const shown = sections
    .map((section) => ({
      kind: section.kind,
      cards: section.ids.flatMap((id) => (cards[id] ? [cards[id]] : [])),
    }))
    .filter((section) => section.cards.length > 0);
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <ShelvesHeader strings={strings} action={action} />
      {status}
      {shown.length === 0 ? (
        <p className="text-muted-foreground" dir="auto">
          {strings.libraryEmpty}
        </p>
      ) : (
        <div className="space-y-8 sm:space-y-10">
          {shown.map((section) => (
            <ShelfSection
              key={section.kind}
              name={strings.shelfKinds[section.kind].name}
              line={strings.shelfKinds[section.kind].line}
              count={section.cards.length}
              wide={section.cards.every((card) => !card.vertical)}
              labels={{
                showAll: strings.shelfShowAll,
                showLess: strings.shelfShowLess,
                previous: strings.shelfPrevious,
                next: strings.shelfNext,
              }}
              phone={
                <ul className="flex flex-col gap-3">
                  {section.cards.map((card) => (
                    <li key={card.id} className="flex">
                      <VideoCard card={card} strings={strings} />
                    </li>
                  ))}
                </ul>
              }
            >
              {section.cards.map((card) => (
                <li key={card.id} className="min-w-0 snap-start">
                  <ShelfCard card={card} strings={strings} />
                </li>
              ))}
            </ShelfSection>
          ))}
        </div>
      )}
    </div>
  );
}

/** «فيديو» small and in the brand colour, the line that says why, and the short explanation under it; the Admin's button sits on the other side. */
function ShelvesHeader({ strings, action }: { strings: VideoStrings; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col-reverse gap-4 sm:mb-8 sm:flex-row sm:items-end sm:gap-6">
      {action}
      <div className="min-w-0 flex-1 text-right">
        <div className="text-brand inline-flex items-center gap-1.5 text-sm font-semibold">
          <span dir="auto">{strings.shelfEyebrow}</span>
          <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5 fill-current">
            <path d="M7 4v16l13-8z" />
          </svg>
        </div>
        <h1
          className="mt-1.5 text-2xl leading-[1.25] font-bold tracking-[-0.01em] sm:text-[30px]"
          dir="auto"
        >
          {strings.shelfTitle}
        </h1>
        <p className="text-muted-foreground mt-1 text-base" dir="auto">
          {strings.shelfSubtitle}
        </p>
      </div>
    </div>
  );
}

/**
 * One video on a shelf: its picture (tall for a Short, which shows the Short's own frame; 16:9 for a
 * wide video), the level and length on it, then the title and "channel · n sentences" under it, with no
 * box around it. The whole card is the link. The picture is YouTube's, never stored here.
 */
function ShelfCard({ card, strings }: { card: VideoCardData; strings: VideoStrings }) {
  return (
    <Link href={`/learn/video/${card.id}`} className="group block min-w-0 outline-none">
      <div
        className={
          (card.vertical ? "aspect-[9/16]" : "aspect-video") +
          " bg-muted group-focus-visible:outline-ring relative overflow-hidden rounded-[14px] group-focus-visible:outline-2 group-focus-visible:-outline-offset-2"
        }
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- YouTube's own thumbnail, served by YouTube and never stored here */}
        <img
          src={shelfThumbnailUrl(card.youtubeId, card.vertical)}
          alt=""
          width={card.vertical ? 480 : 320}
          height={card.vertical ? 360 : 180}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.03]"
        />
        <span className="absolute top-2 left-2 rounded-[6px] bg-black/62 px-[7px] py-px text-[11.5px] font-semibold tracking-[0.02em] text-white">
          {card.level}
        </span>
        <span className="absolute right-2 bottom-2 rounded-[6px] bg-black/72 px-1.5 py-px text-xs font-medium text-white tabular-nums">
          {formatClipLength(card.clipSeconds)}
        </span>
      </div>
      <p className="mt-2.5 line-clamp-2 text-[14.5px] leading-[1.35] font-semibold" dir="ltr">
        {card.title}
      </p>
      <p
        className="text-muted-foreground mt-[3px] flex gap-1.5 overflow-hidden text-[12.5px] whitespace-nowrap"
        dir="ltr"
      >
        <span className="min-w-0 truncate">{card.channel}</span>
        <span className="shrink-0" aria-hidden="true">
          ·
        </span>
        <span className="shrink-0" dir="auto">
          {fill(strings.sentenceCount, { n: card.sentenceCount })}
        </span>
      </p>
    </Link>
  );
}
