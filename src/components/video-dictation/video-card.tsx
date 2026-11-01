import Link from "next/link";

import type { VideoCardData } from "@/lib/video-dictation/content";
import { formatClipLength, thumbnailUrl } from "@/lib/video-dictation/format";
import { fill } from "@/lib/video-dictation/strings";
import type { VideoStrings } from "@/lib/video-dictation/strings";

/**
 * One video of the library: the picture YouTube serves for it (its length in the corner), the title and
 * channel, its level and how many sentences. The whole card is the link. From sm: up it stands in the
 * grid (picture on top); on a phone it is the row the library always had (picture at the side, the
 * length beside the chips). Nothing is stored by the site: the thumbnail is an image on i.ytimg.com.
 */
export function VideoCard({ card, strings }: { card: VideoCardData; strings: VideoStrings }) {
  const length = formatClipLength(card.clipSeconds);
  return (
    <Link
      href={`/learn/video/${card.id}`}
      className="group border-border bg-card focus-visible:ring-ring focus-visible:ring-offset-background flex h-full w-full flex-col overflow-hidden rounded-2xl border transition-[transform,box-shadow] duration-300 outline-none hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-offset-2 max-sm:flex-row max-sm:items-center max-sm:gap-4 max-sm:p-3 max-sm:hover:translate-y-0 max-sm:hover:shadow-none"
    >
      <div className="bg-muted relative aspect-video overflow-hidden max-sm:w-28 max-sm:shrink-0 max-sm:rounded-lg">
        {/* eslint-disable-next-line @next/next/no-img-element -- YouTube's own thumbnail, served by YouTube and never stored here */}
        <img
          src={thumbnailUrl(card.youtubeId)}
          alt=""
          width={320}
          height={180}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.03]"
        />
        <span className="absolute right-2 bottom-2 rounded-[6px] bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white tabular-nums max-sm:hidden">
          {length}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-4 max-sm:p-0" dir="ltr">
        <p className="line-clamp-2 text-base leading-snug font-semibold">{card.title}</p>
        <p className="text-muted-foreground mt-0.5 truncate text-sm">{card.channel}</p>
        <p className="mt-auto flex flex-wrap items-center gap-2 pt-2.5 text-xs max-sm:mt-0 max-sm:pt-2">
          <span className="bg-brand-muted rounded-full px-2 py-0.5 font-semibold">
            {card.level}
          </span>
          <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5" dir="auto">
            {fill(strings.sentenceCount, { n: card.sentenceCount })}
          </span>
          <span className="text-muted-foreground tabular-nums sm:hidden">{length}</span>
        </p>
      </div>
    </Link>
  );
}
