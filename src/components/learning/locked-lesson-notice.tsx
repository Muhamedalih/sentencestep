"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";

/** How long the note stays before it goes on its own. */
const VISIBLE_MS = 8000;

/**
 * The quiet note on the lesson a learner was taken to instead of a Premium one they opened from
 * outside the app (see lockedLessonOutcome): which lesson that was and why they are here. It
 * leaves by itself or with its close button, and it removes `notice` from the address so a
 * refresh or a shared link never shows it again.
 */
export function LockedLessonNotice() {
  const { t } = useLocale();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has("notice")) {
        url.searchParams.delete("notice");
        window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
      }
    } catch {
      // The address is only tidied; the note works the same without it.
    }
    const timer = window.setTimeout(() => setVisible(false), VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="status"
      className="bg-foreground text-background animate-in fade-in slide-in-from-top-2 fixed top-3 left-1/2 z-50 flex w-[min(92vw,28rem)] -translate-x-1/2 items-start gap-3 rounded-xl py-2.5 ps-4 pe-2.5 text-xs leading-relaxed shadow-lg duration-300"
    >
      <p dir="auto" className="flex-1">
        {t.freePath.redirectNotice}
      </p>
      <button
        type="button"
        onClick={() => setVisible(false)}
        aria-label={t.premium.expiryBannerDismiss}
        className="-my-0.5 flex size-7 shrink-0 items-center justify-center rounded-md opacity-70 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-current focus-visible:outline-none"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
