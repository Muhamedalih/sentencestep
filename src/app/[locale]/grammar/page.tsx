import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { GRAMMAR_INDEX, GrammarIndexPage } from "@/components/public-pages/grammar-index-page";
import { JsonLd } from "@/components/public-pages/json-ld";
import { PUBLIC_PAGES_INDEXABLE, PUBLIC_PAGES_LOCALE } from "@/lib/public-pages/flag";
import { breadcrumbNode } from "@/lib/public-pages/json-ld";
import { publicPageMetadata } from "@/lib/public-pages/metadata";

/** See src/app/(default)/page.tsx's doc comment on `dynamic` for why this is explicit rather than left to auto-detection. */
export const dynamic = "force-static";

/** Only the Arabic page exists for now (the Spanish and Turkish text of the rules waits for the Arabic pages to be indexed): "/es/grammar" and "/tr/grammar" are 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ locale: PUBLIC_PAGES_LOCALE }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return publicPageMetadata({
    path: `/${locale}/grammar`,
    title: GRAMMAR_INDEX.title,
    description: GRAMMAR_INDEX.description,
    indexable: PUBLIC_PAGES_INDEXABLE,
    type: "website",
  });
}

/** "/ar/grammar": the index of the public rule pages (see src/lib/public-pages/flag.ts for the dark launch). */
export default async function GrammarIndexRoute({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale !== PUBLIC_PAGES_LOCALE) notFound();
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            breadcrumbNode([
              { name: "SentenceStep", path: `/${locale}` },
              { name: "القواعد" },
            ]),
          ],
        }}
      />
      <GrammarIndexPage locale={locale} />
    </>
  );
}
