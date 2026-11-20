import type { Metadata } from "next";

import { PUBLIC_PAGES_LOCALE } from "./flag";

/**
 * The metadata of a public page: its own title and description (the shared site description would be
 * the same on every page), the address it answers to, and the instruction to search engines. `indexable`
 * is false while the switch in flag.ts is off, so a published-but-closed page says `noindex`.
 */
export function publicPageMetadata(input: {
  path: string;
  title: string;
  description: string;
  indexable: boolean;
  type?: "article" | "website";
}): Metadata {
  return {
    title: input.title,
    description: input.description,
    alternates: { canonical: input.path },
    robots: input.indexable ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      title: input.title,
      description: input.description,
      url: input.path,
      siteName: "SentenceStep",
      type: input.type ?? "article",
      locale: PUBLIC_PAGES_LOCALE === "ar" ? "ar_AR" : "en_US",
    },
  };
}
