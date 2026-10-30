import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import type { SupportLocale } from "@/lib/i18n/locales";
import { clipSeconds, formatClipLength, thumbnailUrl } from "@/lib/video-dictation/content";
import { fill, videoStrings } from "@/lib/video-dictation/strings";
import type { VideoLesson } from "@/lib/video-dictation/types";

/**
 * The videos prepared for Video dictation, as calm rows: the picture YouTube serves for the video, its
 * title and channel, its level, how many sentences and how long. Nothing is stored by the site: the
 * thumbnail is an image on i.ytimg.com.
 */
export function VideoLibrary({
  lessons,
  locale,
}: {
  lessons: readonly VideoLesson[];
  locale: SupportLocale | null;
}) {
  const strings = videoStrings(locale);
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold" dir="auto">
        {strings.libraryTitle}
      </h1>
      <p className="text-muted-foreground mt-1 mb-6" dir="auto">
        {strings.librarySubtitle}
      </p>
      {lessons.length === 0 ? (
        <p className="text-muted-foreground" dir="auto">
          {strings.libraryEmpty}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {lessons.map((lesson) => (
            <li key={lesson.id}>
              <Link
                href={`/learn/video/${lesson.id}`}
                className="border-border bg-card hover:bg-muted/40 flex items-center gap-4 rounded-2xl border p-3 transition-colors sm:p-4"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- YouTube's own thumbnail, served by YouTube and never stored here */}
                <img
                  src={thumbnailUrl(lesson.youtubeId)}
                  alt=""
                  width={176}
                  height={99}
                  loading="lazy"
                  className="bg-muted aspect-video w-28 shrink-0 rounded-lg object-cover sm:w-44"
                />
                <div className="min-w-0 flex-1" dir="ltr">
                  <p className="truncate text-base font-semibold sm:text-lg">{lesson.title}</p>
                  <p className="text-muted-foreground truncate text-sm">{lesson.channel}</p>
                  <p className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="bg-brand-muted rounded-full px-2 py-0.5 font-semibold">
                      {lesson.level}
                    </span>
                    <span
                      className="bg-muted text-muted-foreground rounded-full px-2 py-0.5"
                      dir="auto"
                    >
                      {fill(strings.sentenceCount, { n: lesson.sentences.length })}
                    </span>
                    <span className="text-muted-foreground tabular-nums">
                      {formatClipLength(clipSeconds(lesson))}
                    </span>
                  </p>
                </div>
                <span className={buttonVariants({ size: "sm", className: "max-sm:hidden" })}>
                  <span dir="auto">{strings.start}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
