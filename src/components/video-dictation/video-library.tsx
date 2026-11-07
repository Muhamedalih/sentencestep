import type { SupportLocale } from "@/lib/i18n/locales";
import type { VideoSection } from "@/lib/video-dictation/arrange";
import type { VideoCardData } from "@/lib/video-dictation/content";
import { videoStrings } from "@/lib/video-dictation/strings";

import { VideoCard } from "./video-card";
import { LibraryHeader, SectionBlock, VideoGrid } from "./video-library-parts";
import { ShelvesLibrary } from "./video-shelves";

/**
 * The videos prepared for Video dictation, in sections by kind (comedy first until an Admin arranges
 * them): each section is a grid of cards, the easiest first. A section with no video for this viewer is
 * not shown. This is the learners' page, plain server markup; the Admin gets VideoLibraryAdmin, which
 * draws the same thing and adds the arrange mode.
 */
export function VideoLibrary({
  sections,
  cards,
  locale,
  shelves = false,
}: {
  sections: readonly VideoSection[];
  cards: Readonly<Record<string, VideoCardData>>;
  locale: SupportLocale | null;
  /** The "videoShelves" permission: the shelves look (see ShelvesLibrary). */
  shelves?: boolean;
}) {
  const strings = videoStrings(locale);
  if (shelves) return <ShelvesLibrary sections={sections} cards={cards} strings={strings} />;
  const shown = sections.filter((section) => section.ids.length > 0);
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <LibraryHeader strings={strings} />
      {shown.length === 0 ? (
        <p className="text-muted-foreground" dir="auto">
          {strings.libraryEmpty}
        </p>
      ) : (
        <div className="space-y-8 sm:space-y-10">
          {shown.map((section) => (
            <SectionBlock
              key={section.kind}
              title={strings.kinds[section.kind]}
              count={section.ids.length}
            >
              <VideoGrid>
                {section.ids.map((id) => {
                  const card = cards[id];
                  return card ? (
                    <li key={id} className="flex">
                      <VideoCard card={card} strings={strings} />
                    </li>
                  ) : null;
                })}
              </VideoGrid>
            </SectionBlock>
          ))}
        </div>
      )}
    </div>
  );
}
