"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sparkles, X } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { dismissGermanNew, useGermanNew } from "@/hooks/use-video-new";
import { learnLanguageStrings } from "@/lib/learn-language-strings";

/**
 * The thin strip on the English Home that tells an admin German has arrived (permission germanTrack,
 * Admins only for now). It exists only while the learner is on English, on the Home page itself, until
 * they have chosen German once or closed it: either one retires it, and the dot on the language chip,
 * for good on this device (see useGermanNew). «Try Deutsch» switches the language the same way the chip
 * does.
 */
export function GermanAnnouncement() {
  const pathname = usePathname();
  const router = useRouter();
  const { locale, dir } = useLocale();
  const s = learnLanguageStrings(locale);
  const isNew = useGermanNew(false);
  const [busy, setBusy] = useState(false);

  if (pathname !== "/learn" || !isNew) return null;

  async function tryGerman() {
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch("/api/learn-language", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: "de" }),
      });
      if (response.ok) {
        dismissGermanNew();
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 pt-4 sm:pt-6 xl:max-w-7xl">
      <div
        role="status"
        className="border-primary/30 bg-primary/10 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border px-4 py-2.5 text-sm"
        dir={dir}
      >
        <Sparkles className="text-primary size-4 shrink-0" aria-hidden="true" />
        <p className="min-w-0 flex-1">
          <b className="font-semibold">{s.announceLead}</b> {s.announceBody}
        </p>
        <button
          type="button"
          onClick={tryGerman}
          disabled={busy}
          className="bg-primary text-primary-foreground focus-visible:ring-ring rounded-full px-4 py-1.5 text-[13px] font-semibold outline-none focus-visible:ring-2 disabled:opacity-60"
        >
          {s.announceCta}
        </button>
        <button
          type="button"
          onClick={dismissGermanNew}
          aria-label={s.announceClose}
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring rounded-md p-1 outline-none focus-visible:ring-2"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
