"use client";

import { HomeVideoNew } from "@/components/app/home-video-new";
import { useLocale } from "@/components/providers/locale-provider";
import type { PassagesHomeData } from "@/lib/passages/home-card";
import type { VideoCardData } from "@/lib/video-dictation/content";

import { CategoryCard } from "./category-card";
import { HOME_CARD_COLORS } from "./palette";
import { homeCardsStrings } from "./strings";
import { YouTubeTag } from "./youtube-mark";

/** The Passages card of the Home cards: the passage to read next (the one in progress, or the first not started). */
export function PassagesSectionCard({ data, index }: { data: PassagesHomeData; index: number }) {
  const { t, locale } = useLocale();
  const s = homeCardsStrings(locale);
  const { passage } = data;
  return (
    <CategoryCard
      colors={HOME_CARD_COLORS.passages}
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
    />
  );
}

/** The Video card of the Home cards: the first video of the library as it is arranged. A real page load, like the menu item. */
export function VideoSectionCard({
  card,
  heading,
  cta,
  index,
}: {
  card: VideoCardData;
  heading: string;
  cta: string;
  index: number;
}) {
  const { locale } = useLocale();
  const s = homeCardsStrings(locale);
  return (
    <CategoryCard
      colors={HOME_CARD_COLORS.video}
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
    />
  );
}
