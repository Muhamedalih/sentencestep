import type { Metadata, Viewport } from "next";

import "@/app/globals.css";

import { FirstTimeLanguagePicker } from "@/components/app/first-time-language-picker";
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

  return (
    <html lang={locale ?? "en"} dir={locale ? dirFor(locale) : "ltr"} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <LocaleProvider initialLocale={locale}>
          <FirstTimeLanguagePicker />
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
