import type { Metadata, Viewport } from "next";

import { getSiteUrl } from "@/lib/site-url";

/**
 * Shared verbatim across every root layout (see
 * src/components/layout/root-html-shell.tsx's doc comment for why there is
 * more than one root layout now) — extracted to one place specifically so
 * the three of them can never silently drift apart. Every route in the app
 * still gets the exact same <title>/description/OpenGraph/icons/theme-color
 * values it did when there was a single shared src/app/layout.tsx.
 */
export const SITE_METADATA: Metadata = {
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

export const SITE_VIEWPORT: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f3fa" },
    { media: "(prefers-color-scheme: dark)", color: "#15131f" },
  ],
  width: "device-width",
  initialScale: 1,
};
