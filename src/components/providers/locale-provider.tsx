"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { setPreferredLanguageAction } from "@/lib/i18n/locale-actions";
import { fallbackDictionary, getDictionary, type Dictionary } from "@/lib/i18n/dictionary";
import { dirFor, type SupportLocale } from "@/lib/i18n/locales";

interface LocaleContextValue {
  /** Null only before a first-time visitor has made a choice — see FirstTimeLanguagePicker, which reads this to decide whether to render. */
  locale: SupportLocale | null;
  dir: "rtl" | "ltr";
  t: Dictionary;
  setLocale: (locale: SupportLocale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

/**
 * Root-mounted in src/app/layout.tsx, seeded with whatever getLocale()
 * (a single cookie read, see src/lib/i18n/get-locale.ts) already resolved
 * server-side — so the very first client render matches the server-rendered
 * <html lang/dir> exactly, no hydration mismatch. `initialLocale` is null
 * only for a genuine first-time visitor with no cookie yet.
 */
export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: SupportLocale | null;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<SupportLocale | null>(initialLocale);
  const router = useRouter();

  const setLocale = useCallback(
    (next: SupportLocale) => {
      // Applied to the DOM immediately — no reload, matches useTheme's
      // pattern for the dark-mode toggle — so UI-chrome text (driven by
      // this context) and dir/lang flip instantly.
      document.documentElement.lang = next;
      document.documentElement.dir = dirFor(next);
      setLocaleState(next);

      // UI chrome is client state (updates instantly above), but lesson/
      // story/word-list TRANSLATIONS are resolved server-side per request
      // (see getLessons'/getLessonById's optional `locale` param in
      // src/lib/content.ts) — a Server Component that already rendered
      // with the old locale has no way to know the cookie changed without
      // being asked to re-render. router.refresh() re-runs every Server
      // Component on the current route against the now-updated cookie
      // (set by the server action below) without a full page reload or
      // losing client state — this *is* "no manual refresh required": the
      // learner never touches their browser's reload button, the app
      // refreshes itself the instant they pick a language.
      void setPreferredLanguageAction(next)
        .then(() => router.refresh())
        .catch((error: unknown) => {
          console.error("[locale] setPreferredLanguageAction failed", error);
        });
    },
    [router],
  );

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      dir: locale ? dirFor(locale) : "ltr",
      // A locale of null (picker still showing) renders the English
      // fallback dictionary — exactly what already shows today, so there's
      // nothing jarring about the pre-choice state.
      t: locale ? getDictionary(locale) : fallbackDictionary,
      setLocale,
    }),
    [locale, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/**
 * Throws outside a LocaleProvider rather than silently defaulting — unlike
 * PronunciationSettingsProvider's isActive escape hatch, there's no
 * legitimate reason a locale-aware component would ever render outside the
 * root layout's provider tree.
 */
export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used within a LocaleProvider");
  return context;
}
