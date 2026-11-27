"use client";

import { HomeVideoNew } from "@/components/app/home-video-new";
import { useFeatures } from "@/components/providers/feature-provider";
import { useLocale } from "@/components/providers/locale-provider";
import type { PassagesHomeData } from "@/lib/passages/home-card";
import type { VideoCardData } from "@/lib/video-dictation/content";

import { CategoryCard } from "./category-card";
import { homeCardColors } from "./palette";
import { homeCardsStrings } from "./strings";
import { useGreyHome } from "./use-grey-home";
import { YouTubeTag } from "./youtube-mark";

/** The Passages card of the Home cards: the passage to read next (the one in progress, or the first not started). */
export function PassagesSectionCard({
  data,
  index,
  className,
}: {
  data: PassagesHomeData;
  index: number;
  className?: string;
}) {
  const { t, locale } = useLocale();
  const s = homeCardsStrings(locale);
  const grey = useGreyHome();
  const { passage } = data;
  return (
    <CategoryCard
      colors={homeCardColors(grey, "passages")}
      art="sheet"
      kind={s.passagesKind}
      title={t.nav.passages}
      line={s.passagesLine}
      nextLabel={s.next}
      nextTitle={passage.title}
      nextTitleExtra={locale === "ar" ? passage.titleAr : undefined}
      cta={data.mode === "continue" ? t.passages.continue : t.passages.homeStart}
      href={`/learn/passages/${passage.id}`}
      index={index}
      className={className}
    />
  );
}

/** The Video card of the Home cards: the first video of the library as it is arranged. A real page load, like the menu item. */
export function VideoSectionCard({
  card,
  heading,
  cta,
  index,
  wide = false,
}: {
  card: VideoCardData;
  heading: string;
  cta: string;
  index: number;
  /** The Video row of the words-first Home: the card is a whole row with a large player. */
  wide?: boolean;
}) {
  const { locale } = useLocale();
  const { rollouts } = useFeatures();
  const s = homeCardsStrings(locale);
  const grey = useGreyHome();
  // The calm look: the Video row is 20% shorter (19.2rem instead of 24rem) and its player is drawn smaller to fit.
  const short = wide && rollouts.homeCalm;
  return (
    <CategoryCard
      colors={homeCardColors(grey, "video")}
      art="frame"
      kind={s.videoKind}
      title={heading}
      line={s.videoLine}
      nextLabel={s.next}
      nextTitle={card.title}
      cta={cta}
      href={`/learn/video/${card.id}`}
      plain
      badge={
        <>
          <HomeVideoNew />
          <YouTubeTag />
        </>
      }
      index={index}
      wide={wide}
      short={short}
      className={wide ? (short ? "lg:min-h-[19.2rem]" : "lg:min-h-[24rem]") : undefined}
    />
  );
}
