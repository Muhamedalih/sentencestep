"use client";

import { useEffect } from "react";
import { BookmarkCheck, X } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";

/** How long the note stays before it closes itself. */
const NOTICE_MS = 9000;

/**
 * The one-time note after a learner's very first saved word: the word went to «كلماتي» → Saved
 * words, not somewhere they would have to guess. A quiet card at the top of the screen (it never
 * takes the typing focus, so the sentence carries on), closed by its button or after a few seconds.
 * Its link opens the saved words in a new tab so the lesson in progress is not left.
 */
export function SavedWordsNotice({ onClose }: { onClose: () => void }) {
  const { t, dir } = useLocale();

  useEffect(() => {
    const timer = window.setTimeout(onClose, NOTICE_MS);
    return () => window.clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-4 md:top-5"
    >
      <div className="bg-card border-border pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border p-4 shadow-lg">
        <BookmarkCheck className="text-primary mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1" dir={dir}>
          <p className="text-[15px] font-semibold">{t.myCards.savedNoticeHeading}</p>
          <p className="text-muted-foreground mt-0.5 text-[13.5px] leading-relaxed">
            {t.myCards.savedNoticeBody}
          </p>
          <a
            href="/learn/words/saved"
            target="_blank"
            rel="noopener"
            className="text-primary mt-2 inline-block text-[13.5px] font-semibold hover:underline"
          >
            {t.myCards.savedNoticeOpen}
          </a>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t.myCards.savedNoticeClose}
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring -m-1 shrink-0 rounded-md p-1 outline-none focus-visible:ring-2"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
