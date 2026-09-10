import type { ReactNode } from "react";

import { CountryOnboarding } from "@/components/app/country-onboarding";
import { FirstTimeLanguagePicker } from "@/components/app/first-time-language-picker";
import { IntroLanding } from "@/components/app/intro-landing";
import { OnboardingIntroCard } from "@/components/app/onboarding-intro-card";
import { StartingLevelOnboarding } from "@/components/app/starting-level-onboarding";
import { TutorialOnboarding } from "@/components/app/tutorial-onboarding";
import { GetStartedStepProvider } from "@/components/providers/get-started-step-provider";
import { LocaleProvider } from "@/components/providers/locale-provider";
import { dirFor, SUPPORT_LOCALES, type SupportLocale } from "@/lib/i18n/locales";

/**
 * Applies the `dark` class (see globals.css's `.dark` token overrides)
 * before the page paints, so a learner whose stored/system preference is
 * dark never sees a flash of the light theme first. This has to run as a
 * plain, synchronous inline script — a useEffect in a Client Component
 * would only run after React's first paint, which is exactly the flash
 * this exists to prevent. The <html> tag's suppressHydrationWarning below
 * is what lets this script mutate <html> before hydration without React
 * treating that as a mismatch. The string below is a fixed, hardcoded
 * script with no interpolated data of any kind — never user input.
 *
 * Kept as an exported constant (not inlined below) because
 * src/middleware.ts's THEME_SCRIPT_HASH is a SHA-256 hash of this exact
 * string, byte for byte — if this ever changes, that hash must be
 * recomputed and updated too, or the script silently fails CSP and never
 * runs (see that constant's own doc comment).
 */
export const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("sentencestep-theme");
    var isDark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (isDark) document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

/**
 * The actual <html>/<head>/<body> shell every root layout in the app
 * renders — factored out here because there is no longer exactly one root
 * layout (see src/app/(app)/layout.tsx's doc comment for why). Next.js
 * requires <html>/<body> tags to be defined by whichever layout.tsx has no
 * layout above it, and a single request can only ever be served by ONE such
 * root layout — so making a subset of routes (/, /privacy, /terms)
 * statically cacheable while the rest (/login, /learn, /admin, ...) keep
 * their existing cookie-based-locale, fully-dynamic behavior meant splitting
 * into multiple sibling root layouts, one per route group. This component is
 * what keeps their actual markup byte-identical instead of three
 * hand-maintained copies silently drifting apart:
 *
 * - src/app/(app)/layout.tsx — unchanged behavior for every non-marketing
 *   route: still resolves `locale` from the ss_locale cookie via
 *   getLocale() on every request.
 * - src/app/(default)/layout.tsx — the unprefixed "/", "/privacy", "/terms"
 *   variant: always renders with `locale={null}` (the exact English-fallback
 *   chrome a cookie-less visitor already sees today), fully static, no
 *   dynamic API calls anywhere in its tree.
 * - src/app/[locale]/layout.tsx — the "/ar", "/es", "/tr" (+ their
 *   /privacy, /terms) variants: `locale` comes from the static route param
 *   (generateStaticParams), never a cookie read, so it can be pre-rendered
 *   per locale at build time.
 *
 * `dir` is hardcoded to "ltr" whenever locale is known via dirFor(locale)
 * rather than a literal — every locale this app supports renders ltr today
 * (see LOCALE_META's own doc comment: a deliberate product decision, not an
 * oversight), so this is behaviorally identical to before, just future-proof
 * if that ever changes.
 */
export function RootHtmlShell({
  locale,
  localizedNavigation = false,
  children,
}: {
  /** Null for a genuine first-time, cookie-less visitor (or the unprefixed default marketing variant) — see getLocale()'s own doc comment. */
  locale: SupportLocale | null;
  /**
   * True only for the two marketing route groups: their pages are static,
   * pre-rendered per locale, so switching locale there means navigating to
   * a different pre-rendered URL rather than router.refresh()-ing the
   * current one (which has no per-request server logic left to re-run) —
   * see LocaleProvider's own doc comment for exactly what this changes.
   */
  localizedNavigation?: boolean;
  children: ReactNode;
}) {
  return (
    <html lang={locale ?? "en"} dir={locale ? dirFor(locale) : "ltr"} suppressHydrationWarning>
      <head>
        {/* Amiri — the literary Arabic serif used only for the Book Learning Engine's Section Intro cover (see globals.css's --font-book). Lora — My Saves' quote-card English sentence (see --font-quote). Neither is self-hosted via next/font since no other font in this project is either (--font-arabic's "Noto Sans Arabic" already relies on the OS/browser having it, same pattern this follows). */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Amiri:wght@700&family=Lora:ital,wght@0,500;0,600;1,500&display=swap"
          rel="stylesheet"
        />
        {/* Authorized by middleware.ts's CSP via a fixed sha256 hash of this exact script body, not a per-request nonce — this script never changes per request, so it needs no per-request value, which is what lets this Server Component render without calling headers()/cookies() itself. */}
        <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        {/*
         * Only on the unprefixed "/" for a genuinely first-time, cookie-less
         * visitor (localizedNavigation && locale === null — true for
         * src/app/(default)/layout.tsx, never for src/app/[locale]/layout.tsx
         * since that one always has a real locale): FirstTimeLanguagePicker
         * is about to show, and picking a language there navigates to
         * "/{locale}" (see LocaleProvider's setLocale). That destination has
         * its OWN root layout ([locale]/layout.tsx) — a different <html> tree
         * than this one — which the Next.js App Router cannot soft-transition
         * into; it's a real, full browser navigation no matter what. These
         * hints get that destination's HTML into the browser's cache before
         * the visitor ever picks, so the otherwise-jarring reload resolves
         * close to instantly instead of visibly flashing/reloading mid-flow.
         * (Safari doesn't honor rel=prefetch, so this helps Chrome/Firefox
         * visitors fully and does nothing — not harm — for Safari ones.)
         */}
        {localizedNavigation &&
          locale === null &&
          SUPPORT_LOCALES.map((supportLocale) => (
            <link key={supportLocale} rel="prefetch" href={`/${supportLocale}`} />
          ))}
      </head>
      <body>
        <LocaleProvider initialLocale={locale} localizedNavigation={localizedNavigation}>
          <GetStartedStepProvider>
            <IntroLanding />
            <FirstTimeLanguagePicker />
            <StartingLevelOnboarding />
            <CountryOnboarding />
            <TutorialOnboarding />
            <OnboardingIntroCard />
          </GetStartedStepProvider>
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
