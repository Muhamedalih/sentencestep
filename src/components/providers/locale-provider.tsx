"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";

import { setPreferredLanguageAction } from "@/lib/i18n/locale-actions";
import { fallbackDictionary, getDictionary, type Dictionary } from "@/lib/i18n/dictionary";
import { dirFor, isSupportLocale, SUPPORT_LOCALES, type SupportLocale } from "@/lib/i18n/locales";

/** Matches a leading "/ar", "/es", or "/tr" path segment — used to strip an existing locale prefix before computing a new one. */
const LOCALE_PREFIX_PATTERN = new RegExp(`^/(${SUPPORT_LOCALES.join("|")})(?=/|$)`);

interface LocaleContextValue {
  /** Null only before a first-time visitor has made a choice — see FirstTimeLanguagePicker, which reads this to decide whether to render. */
  locale: SupportLocale | null;
  dir: "rtl" | "ltr";
  t: Dictionary;
  setLocale: (locale: SupportLocale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

/**
 * Root-mounted in each root layout (see src/components/layout/root-html-shell.tsx),
 * seeded with whatever locale that layout already resolved server-side — a
 * cookie read for src/app/(app)/layout.tsx (see src/lib/i18n/get-locale.ts),
 * a static route param for src/app/[locale]/layout.tsx, or always null for
 * src/app/(default)/layout.tsx — so the very first client render matches the
 * server-rendered <html lang/dir> exactly, no hydration mismatch.
 * `initialLocale` is null only for a genuine first-time visitor with no
 * cookie yet (or the unprefixed default marketing variant).
 */
export function LocaleProvider({
  initialLocale,
  localizedNavigation = false,
  children,
}: {
  initialLocale: SupportLocale | null;
  /**
   * True only under the two marketing root layouts ((default) and
   * [locale]) — their pages are static and pre-rendered per locale, with no
   * per-request server logic left to re-run, so router.refresh() (the
   * (app) group's approach, below) would just re-serve the exact same
   * cached HTML instead of the new locale's translated content. Here,
   * setLocale instead navigates to the equivalent URL under the chosen
   * locale's prefix (stripping any existing one first) — see
   * src/app/middleware.ts's marketing-locale-redirect for the matching
   * server-side half of this (a returning visitor with a cookie landing on
   * an unprefixed URL).
   */
  localizedNavigation?: boolean;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<SupportLocale | null>(initialLocale);
  const router = useRouter();
  const pathname = usePathname();

  // Pre-choice chrome (IntroLanding, FirstTimeLanguagePicker) otherwise
  // always renders the English fallback dictionary below, regardless of who's
  // looking at it — this detects the browser's own language once, client-side
  // only, and swaps just the displayed dictionary to match when it's one of
  // SUPPORT_LOCALES. It never touches `locale` itself (still null until the
  // visitor actually picks): the "choose your language" step still always
  // shows and still requires an explicit tap, this only changes what
  // language asks the question. Starts null so the very first render (SSR
  // and the client's initial hydration pass) matches exactly — no mismatch —
  // and only swaps a moment after mount, same tradeoff as any client-only
  // detection (a brief flash of English first is expected, not a bug).
  const [browserLocale, setBrowserLocale] = useState<SupportLocale | null>(null);
  useEffect(() => {
    if (initialLocale !== null) return;
    const candidates = navigator.languages?.length ? navigator.languages : [navigator.language];
    for (const lang of candidates) {
      const base = lang.split("-")[0]?.toLowerCase();
      if (base && isSupportLocale(base)) {
        setBrowserLocale(base);
        return;
      }
    }
  }, [initialLocale]);

  const setLocale = useCallback(
    (next: SupportLocale) => {
      // Applied to the DOM immediately — no reload, matches useTheme's
      // pattern for the dark-mode toggle — so UI-chrome text (driven by
      // this context) and dir/lang flip instantly.
      document.documentElement.lang = next;
      document.documentElement.dir = dirFor(next);
      setLocaleState(next);

      if (localizedNavigation) {
        // The destination is a different pre-rendered static URL, not the
        // current cookie-driven page, so there's nothing to wait on before
        // navigating — the cookie write below is fire-and-forget, purely
        // so future visits/other routes see the new preference too.
        void setPreferredLanguageAction(next).catch((error: unknown) => {
          console.error("[locale] setPreferredLanguageAction failed", error);
        });
        const basePath = pathname.replace(LOCALE_PREFIX_PATTERN, "") || "/";
        router.push(`/${next}${basePath === "/" ? "" : basePath}`);
        return;
      }

      // UI chrome is client state (updates instantly above), but lesson/
      // story/word-list TRANSLATIONS are resolved server-side per request
      // (see getLessons'/getLessonById's optional `locale` param in
      // src/lib/content.ts) — a Server Component that already rendered
      // with the old locale has no way to know the cookie changed without
      // being asked to re-render. router.refresh() re-runs every Server
      // Component on the current route against the now-updated cookie —
      // but only once the cookie write has actually landed, so the refresh
      // doesn't race it and re-fetch against the still-old value. This *is*
      // "no manual refresh required": the learner never touches their
      // browser's reload button, the app refreshes itself the instant they
      // pick a language.
      void setPreferredLanguageAction(next)
        .then(() => router.refresh())
        .catch((error: unknown) => {
          console.error("[locale] setPreferredLanguageAction failed", error);
        });
    },
    [router, pathname, localizedNavigation],
  );

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      // dirFor is "ltr" for every SupportLocale today (see its own doc
      // comment — a deliberate product decision, not an oversight), so this
      // stays "ltr" whether `t` below resolves to fallbackDictionary or a
      // browser-detected one.
      dir: locale ? dirFor(locale) : "ltr",
      // A locale of null (picker still showing) renders browserLocale's
      // dictionary once detected, English until then — see browserLocale's
      // own doc comment above for why this never touches `locale` itself.
      t: locale
        ? getDictionary(locale)
        : browserLocale
          ? getDictionary(browserLocale)
          : fallbackDictionary,
      setLocale,
    }),
    [locale, browserLocale, setLocale],
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
