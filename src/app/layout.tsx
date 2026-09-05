import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";

import "@/app/globals.css";

import { FirstTimeLanguagePicker } from "@/components/app/first-time-language-picker";
import { StartingLevelOnboarding } from "@/components/app/starting-level-onboarding";
import { LocaleProvider } from "@/components/providers/locale-provider";
import { getLocale } from "@/lib/i18n/get-locale";
import { dirFor } from "@/lib/i18n/locales";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "SentenceStep — Learn English, letter by letter",
    template: "%s · SentenceStep",
  },
  description:
    "SentenceStep is a modern English-learning app for Arabic speakers. Hear a sentence, type it letter by letter, and build fluency through Normal, Stories, and Conversation lessons.",
  keywords: [
    "learn English",
    "English for Arabic speakers",
    "typing practice",
    "English lessons",
    "language learning app",
  ],
  openGraph: {
    title: "SentenceStep — Learn English, letter by letter",
    description:
      "Hear a sentence, type it letter by letter, and build fluency through Normal, Stories, and Conversation lessons.",
    siteName: "SentenceStep",
    type: "website",
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f3fa" },
    { media: "(prefers-color-scheme: dark)", color: "#15131f" },
  ],
  width: "device-width",
  initialScale: 1,
};

/**
 * Applies the `dark` class (see globals.css's `.dark` token overrides)
 * before the page paints, so a learner whose stored/system preference is
 * dark never sees a flash of the light theme first. This has to run as a
 * plain, synchronous inline script — a useEffect in a Client Component
 * would only run after React's first paint, which is exactly the flash
 * this exists to prevent. The <html> tag's suppressHydrationWarning above
 * is what lets this script mutate <html> before hydration without React
 * treating that as a mismatch. The string below is a fixed, hardcoded
 * script with no interpolated data of any kind — never user input.
 */
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("sentencestep-theme");
    var isDark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (isDark) document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // A single cookie read (no DB query — see get-locale.ts's doc comment).
  // Null means a genuine first-time, cookie-less visitor: the page still
  // renders (English chrome, LTR — exactly what already renders today),
  // FirstTimeLanguagePicker is what actually prompts them.
  const locale = await getLocale();
  // Set by middleware.ts on every request (see its own doc comment) — lets
  // this file's one inline script satisfy the CSP's script-src without
  // 'unsafe-inline', which would otherwise authorize any inline script an
  // attacker could ever inject via a stored-XSS bug, not just this one.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

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
        {/* suppressHydrationWarning: browsers deliberately blank out a script's nonce attribute in the DOM right after it runs (so injected script can never read a legitimate nonce back out) — the server-rendered nonce value vs. the client's already-blanked one is expected, not a real mismatch. Documented Next.js CSP caveat. */}
        <script
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
      </head>
      <body>
        <LocaleProvider initialLocale={locale}>
          <FirstTimeLanguagePicker />
          <StartingLevelOnboarding />
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
