import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { WordCoverArt } from "@/components/words/word-cover-art";
import { cn } from "@/lib/utils";

/**
 * The cover of a Word List: a 4:3 picture with rounded corners, the picture an admin chose for the
 * list when there is one and otherwise the drawing made for its topic (see word-cover-art.tsx).
 * What sits on it (the lock, the check, the count of words to review) is passed as children, so it
 * moves with the cover and stays as bright as it is when the picture itself is drawn quieter for a
 * locked list.
 */
export function WordCover({
  title,
  level,
  coverUrl,
  Icon,
  dimmed = false,
  className,
  children,
}: {
  title: string;
  level: number;
  /** The chosen picture (word_groups.cover_url), or null/absent for the topic's drawing. */
  coverUrl?: string | null;
  /** The topic's own icon, for a topic with no drawing. */
  Icon: LucideIcon;
  /** A locked list: the picture is drawn quieter. */
  dimmed?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <span
      className={cn(
        "relative block aspect-[4/3] w-full overflow-hidden rounded-[14px] ring-1 ring-black/[0.06] ring-inset dark:ring-transparent",
        className,
      )}
    >
      <span className={cn("absolute inset-0 block", dimmed && "brightness-[.55] saturate-[.7]")}>
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- the admin's own picture, already cropped to this shape and compressed by the server (see word-covers-image.ts), so it needs no optimizer.
          <img
            src={coverUrl}
            alt=""
            loading="lazy"
            decoding="async"
            draggable={false}
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <WordCoverArt title={title} level={level} Icon={Icon} />
        )}
      </span>
      {children}
    </span>
  );
}
