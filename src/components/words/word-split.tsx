"use client";

import type { ReactNode } from "react";

import { iconForGroup } from "@/components/app/word-group-card";
import { useLocale } from "@/components/providers/locale-provider";
import { WordCoverArt, coverTones } from "@/components/words/word-cover-art";
import { ladderStrings } from "@/lib/word-ladder/strings";

/** What the picture beside a topic's words needs to know about the topic. */
export interface WordSplitTopic {
  title: string;
  supportTitle?: string;
  level: number;
  /** The photo an admin chose for the topic (word_groups.cover_url), or null/absent for its drawing. */
  coverUrl?: string | null;
}

/**
 * The picture beside a topic's words (the wordsSplit permission): the topic's own cover, the same
 * one the Word Lists library shows, as a tall rounded panel in the way a lesson's illustration is.
 * The drawing keeps its whole shape (it stands on the bottom edge, with its own ground colour
 * above it, which is where the topic's level and name go); a photo an admin set is shown whole
 * over a soft, dimmed copy of itself, since a photo is taller than it is wide only by accident.
 */
function WordSplitPicture({ topic }: { topic: WordSplitTopic }) {
  const { locale, dir } = useLocale();
  const s = ladderStrings(locale);
  const tones = coverTones(topic.title, topic.level);
  const photo = Boolean(topic.coverUrl);
  const ink = photo ? "#ffffff" : tones.ink;

  return (
    <div
      className="border-foreground/10 relative h-full overflow-hidden rounded-2xl border shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]"
      style={{ background: photo ? "#15181d" : tones.bg }}
    >
      {topic.coverUrl ? (
        <>
          {/* eslint-disable @next/next/no-img-element -- the admin's own picture, already cropped and compressed by the server (see word-covers-image.ts), so it needs no optimizer. */}
          <img
            src={topic.coverUrl}
            alt=""
            aria-hidden="true"
            decoding="async"
            draggable={false}
            className="absolute inset-0 size-full scale-125 object-cover blur-2xl brightness-[.55]"
          />
          <span className="absolute inset-x-6 bottom-6 block aspect-[4/3] overflow-hidden rounded-xl shadow-lg ring-1 ring-white/15">
            <img
              src={topic.coverUrl}
              alt=""
              decoding="async"
              draggable={false}
              className="absolute inset-0 size-full object-cover"
            />
          </span>
          {/* eslint-enable @next/next/no-img-element */}
        </>
      ) : (
        <WordCoverArt
          title={topic.title}
          level={topic.level}
          Icon={iconForGroup(topic.title)}
          fit="bottom"
        />
      )}
      <div className="relative z-10 flex flex-col gap-1.5 px-7 pt-8 lg:px-9 lg:pt-10">
        <p
          className="text-left text-[12.5px] font-semibold tracking-wide uppercase opacity-70"
          style={{ color: ink }}
          dir="auto"
        >
          {s.level(topic.level)}
        </p>
        <h1
          className="text-[clamp(2rem,1.4rem+1.6vw,2.9rem)] leading-[1.08] font-bold tracking-tight text-balance"
          style={{ color: ink }}
          dir="ltr"
        >
          {topic.title}
        </h1>
        {topic.supportTitle && (
          <p className="text-left text-[22px] opacity-75" style={{ color: ink }} dir={dir}>
            {topic.supportTitle}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * A topic's screens with the picture beside them (the wordsSplit permission), from md: up (a tablet
 * and a laptop): a third of the row is the picture, the rest the words. Below that nothing changes:
 * the children keep the whole screen, as they always had. The picture is mounted once for the whole
 * visit, so it never reloads as the learner goes from the topic's screen into a round and its exam,
 * and it steps aside (the words take the whole row) while the on-screen keyboard is open and on a
 * short landscape phone — see `.words-split` in globals.css.
 */
export function WordSplit({ topic, children }: { topic: WordSplitTopic; children: ReactNode }) {
  return (
    <div className="words-split">
      <div className="compact-hide h-app hidden p-4 pe-0 md:block">
        <WordSplitPicture topic={topic} />
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
