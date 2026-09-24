import type { ReactNode } from "react";
import { Amiri, Lora } from "next/font/google";

import { CountryOnboarding } from "@/components/app/country-onboarding";
import { FirstTimeLanguagePicker } from "@/components/app/first-time-language-picker";
import { IntroLanding } from "@/components/app/intro-landing";
import { OnboardingIntroCard } from "@/components/app/onboarding-intro-card";
import { StartingLevelOnboarding } from "@/components/app/starting-level-onboarding";
import { TutorialOnboarding } from "@/components/app/tutorial-onboarding";
import { GetStartedStepProvider } from "@/components/providers/get-started-step-provider";
import { LocaleProvider } from "@/components/providers/locale-provider";
import { dirFor, type SupportLocale } from "@/lib/i18n/locales";

/**
 * Amiri (--font-book, globals.css) and Lora (--font-quote) — self-hosted via
 * next/font/google instead of the classic <link rel="stylesheet"> this
 * replaced: next/font downloads the font files at build time and serves them
 * from this app's own origin, so there's no runtime DNS/connection/request
 * to fonts.googleapis.com/fonts.gstatic.com on the critical rendering path,
 * and no render-blocking external stylesheet. `preload: false` on both
 * because each is used on exactly one route (Book Learning Engine's Section
 * Intro cover; My Saves' quote card) — preloading them on every OTHER page
 * that never renders either font would be pure waste. `display: "swap"`
 * keeps the same "never block text on the font" behavior the old <link> already had.
 */
const amiri = Amiri({
  weight: "700",
  subsets: ["arabic"],
  display: "swap",
  preload: false,
  variable: "--font-amiri",
});
const lora = Lora({
  weight: ["500", "600"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-lora",
});

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
 * Microsoft Clarity's own bootstrap snippet, verbatim — session-recording
 * and heatmap analytics (visit counts, device breakdown, time-on-page, what
 * a visitor actually clicked/scrolled), entirely third-party: it writes
 * nothing to this app's own Supabase project and adds no build-time cost,
 * just this one inline script plus the external tag it loads from
 * clarity.ms. Kept as a fixed, hardcoded string with no interpolated data
 * (the project id "yids081ut7" is baked in, same as any other Clarity
 * embed) so it can be authorized in middleware.ts's CSP by a static
 * sha256 hash — CLARITY_SCRIPT_HASH there — exactly like THEME_INIT_SCRIPT
 * above; if this string ever changes, that hash must be recomputed too or
 * the script silently fails CSP and never runs.
 */
export const CLARITY_INIT_SCRIPT = `
(function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "yids081ut7");
`;

/**
 * Sends a returning guest who already finished the "get started" flow
 * (localStorage's "looma:progress:v2".startingLevel is only ever non-null
 * once StartingLevelOnboarding has run — see setStartingLevel's own doc
 * comment in src/lib/progress/store.ts) straight to /learn instead of ever
 * letting them see this marketing homepage again — mirroring what
 * src/middleware.ts's handleRootRoute already does for a real signed-in
 * visitor, except that visitor's equivalent state (a Supabase session) is a
 * cookie middleware can read server-side, while a guest's is localStorage,
 * which middleware can never see. Applies on every viewport: this used to
 * check for a narrow (mobile) viewport before redirecting, leaving a
 * returning desktop guest stuck seeing the marketing pitch again on every
 * visit instead of picking up where they left off — there was never a
 * product reason for that split, just an earlier pass that happened to only
 * fix the mobile report in front of it at the time.
 *
 * Deliberately a plain synchronous inline script (same pattern as
 * THEME_INIT_SCRIPT above), not a client component's useEffect: an effect
 * only runs after this page has already mounted and painted, which is
 * exactly the "flash of the marketing homepage, then it jumps to /learn a
 * moment later" an earlier version of this feature had. Running
 * synchronously here, before <body> ever parses, means a matching guest
 * never sees this page's content at all — the navigation away happens
 * mid-parse. Only ever injected on the two marketing route groups (see
 * `localizedNavigation` below), which is also exactly why this doesn't need
 * a CSP hash the way THEME_INIT_SCRIPT does on every OTHER route: those two
 * route groups already run script-src 'unsafe-inline' (see
 * middleware.ts's buildCsp — a documented, static-rendering-specific
 * carve-out), so this authorizes itself for free by only ever being present
 * in the HTML of pages that already allow it.
 */
export const RETURNING_GUEST_REDIRECT_SCRIPT = `
(function () {
  try {
    var raw = window.localStorage.getItem("looma:progress:v2");
    if (!raw) return;
    var parsed = JSON.parse(raw);
    if (parsed.startingLevel === null || parsed.startingLevel === undefined) return;
    window.location.replace("/learn");
  } catch (e) {}
})();
`;

/**
 * Covers this page's own static marketing content the instant it starts
 * parsing, for the one visitor this matters to: a guest who already has an
 * `ss_locale` cookie (they picked a language on some earlier request) but
 * hasn't finished onboarding yet (RETURNING_GUEST_REDIRECT_SCRIPT above
 * already sends anyone with a real `startingLevel` on to /learn before this
 * ever runs) — almost always landing here via FirstTimeLanguagePicker's own
 * `router.push("/{locale}")`, the one navigation in the "get started" flow
 * that crosses from the (default) root layout to [locale]'s, which Next.js
 * can only ever do with a full browser page load.
 *
 * That reload's own destination page has no way to skip painting its own
 * marketing content on arrival: this is a statically pre-rendered page (see
 * RootHtmlShell's own doc comment for why), so its HTML contains that
 * content already, and every "get started" step past this one is gated on
 * useProgress()'s `isLoaded` — necessarily still false for one instant even
 * with that hook's own useLayoutEffect (see its doc comment), because
 * nothing client-side can run before this page's raw server-rendered HTML
 * has already been parsed and painted at least once. The `<link
 * rel="prefetch">` hints below mask most of this by warming the browser's
 * cache before a visitor ever picks a language, but Safari doesn't honor
 * rel=prefetch at all, and even where it's honored a prefetched response
 * still has to be parsed and hydrated — this script is the one thing that
 * covers that gap unconditionally, in every browser, regardless of whether
 * the prefetch actually helped.
 *
 * Removed by GetStartedMaskCleanup (get-started-step-provider.tsx) the
 * instant useProgress()'s `isLoaded` actually turns true — whichever step
 * that reveals (or, rarely, no step at all: a guest with real completions
 * but no recorded startingLevel) is the correct one already resolved by
 * then, so there's nothing left for this to hide.
 */
export const ONBOARDING_TRANSITION_MASK_SCRIPT = `
(function () {
  try {
    var hasLocaleCookie = document.cookie.split("; ").some(function (c) {
      return c.indexOf("ss_locale=") === 0;
    });
    if (!hasLocaleCookie) return;
    var raw = window.localStorage.getItem("looma:progress:v2");
    var startingLevel = null;
    if (raw) {
      try {
        startingLevel = JSON.parse(raw).startingLevel;
      } catch (e) {}
    }
    if (startingLevel !== null && startingLevel !== undefined) return;
    var mask = document.createElement("div");
    mask.id = "get-started-mask";
    mask.style.cssText = "position:fixed;inset:0;z-index:2147483647;background:var(--background);";
    document.documentElement.appendChild(mask);
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
    <html
      lang={locale ?? "en"}
      dir={locale ? dirFor(locale) : "ltr"}
      className={`${amiri.variable} ${lora.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Authorized by middleware.ts's CSP via a fixed sha256 hash of this exact script body, not a per-request nonce — this script never changes per request, so it needs no per-request value, which is what lets this Server Component render without calling headers()/cookies() itself. */}
        <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        {/* Same hash-based CSP authorization as the theme script above — see CLARITY_INIT_SCRIPT's own doc comment. Present on every route, not just marketing, since visit/session tracking is the point. */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: CLARITY_INIT_SCRIPT }}
        />
        {/* Marketing route groups only (see RETURNING_GUEST_REDIRECT_SCRIPT's own doc comment for why this needs no CSP hash) — never present in the HTML of any other route, so it can never run there. */}
        {localizedNavigation && (
          <script
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: RETURNING_GUEST_REDIRECT_SCRIPT }}
          />
        )}
        {/* Same marketing-route-only CSP carve-out as RETURNING_GUEST_REDIRECT_SCRIPT just above — see ONBOARDING_TRANSITION_MASK_SCRIPT's own doc comment. Ordered after it: a matching startingLevel there already means this page is about to be abandoned for /learn, so there's no point masking it too. */}
        {localizedNavigation && (
          <script
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: ONBOARDING_TRANSITION_MASK_SCRIPT }}
          />
        )}
        {/*
         * A genuinely first-time, cookie-less visitor on the unprefixed "/"
         * still gets these three locale pages warmed into the browser's
         * cache before they pick a language (picking one navigates to
         * "/{locale}", a real full browser reload — see
         * FirstTimeLanguagePicker's own doc comment for why that can't be a
         * soft transition) — but the <link rel="prefetch"> tags that used to
         * live here, unconditionally in every first-time visitor's initial
         * HTML, were measured firing at the very start of page parsing and
         * competing with this same page's own critical JS chunks for the
         * browser's limited concurrent-request budget (3+ seconds added to
         * first paint on a cold cache). FirstTimeLanguagePicker now issues
         * the identical <link rel="prefetch"> tags itself, client-side,
         * shortly after it actually mounts — by then the critical first
         * paint is already done, so the same warm-up happens with none of
         * that contention.
         */}
      </head>
      <body>
        <LocaleProvider initialLocale={locale} localizedNavigation={localizedNavigation}>
          <GetStartedStepProvider localizedNavigation={localizedNavigation}>
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
