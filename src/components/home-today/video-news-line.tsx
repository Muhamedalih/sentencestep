"use client";

import { ChevronLeft, Play, X } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { useVideoNewsSeen } from "@/hooks/use-video-news-seen";
import { cn } from "@/lib/utils";
import { videoStrings } from "@/lib/video-dictation/strings";

/**
 * The one-line «جديد» note that announces Video dictation under the top bar of the new Home (the
 * "videoNews" permission): the section's name, one short sentence, a link that opens it and a
 * close button. It is gone for good, on this browser, once the learner closes it or opens the
 * section by any road (see lib/video-dictation/news.ts), so nothing stays on the page. The page only
 * draws it for a learner whose cookie is missing, so there is no flash and no push after loading.
 *
 * The link is a plain `<a>`: Video dictation's routes alone are served with YouTube in the
 * Content-Security-Policy, and a policy belongs to the document that was loaded, so the section has to be
 * entered with a full page load (see SidebarLink's fullLoad). The section is Arabic only, so the line
 * is drawn for the Arabic interface only. On a phone the sentence is left out and the line stays one row.
 */
export function VideoNewsLine({ className }: { className?: string }) {
  const { locale } = useLocale();
  const { seen, markSeen } = useVideoNewsSeen();
  if (seen || locale !== "ar") return null;
  const copy = videoStrings(locale);
  return (
    <section
      aria-label={copy.newsTitle}
      className={cn(
        "border-primary/30 bg-primary/[0.07] flex min-h-11 items-center gap-3 rounded-[12px] border py-1 pr-2 pl-3.5 text-[14.5px]",
        className,
      )}
    >
      <span
        className="bg-brand-muted text-primary grid size-[26px] shrink-0 place-items-center rounded-full"
        aria-hidden="true"
      >
        <Play className="size-[13px] fill-current" strokeWidth={1.8} />
      </span>
      <p dir="auto" className="text-foreground min-w-0 flex-1 text-left leading-snug sm:truncate">
        <span className="font-semibold">{copy.newsTitle}</span>
        <span className="text-muted-foreground ms-3 max-sm:hidden">{copy.newsBody}</span>
      </p>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- a full page load on purpose: only /learn/video is served with YouTube in its CSP (see SidebarLink's fullLoad) */}
      <a
        href="/learn/video"
        dir="rtl"
        onClick={markSeen}
        className="text-primary focus-visible:ring-ring inline-flex shrink-0 items-center gap-1 rounded font-semibold whitespace-nowrap underline-offset-4 outline-none hover:underline focus-visible:ring-2 pointer-coarse:min-h-9"
      >
        {copy.newsOpen}
        <ChevronLeft className="size-4" aria-hidden="true" strokeWidth={2} />
      </a>
      <button
        type="button"
        onClick={markSeen}
        aria-label={copy.newsDismiss}
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring grid size-7 shrink-0 place-items-center rounded-lg outline-none focus-visible:ring-2 pointer-coarse:size-9"
      >
        <X className="size-[15px]" aria-hidden="true" strokeWidth={1.8} />
      </button>
    </section>
  );
}
