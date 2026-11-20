import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AboutPage } from "@/components/public-pages/about-page";
import { JsonLd } from "@/components/public-pages/json-ld";
import { ABOUT, ABOUT_FAQS } from "@/lib/public-pages/about-content";
import { PUBLIC_PAGES_INDEXABLE, PUBLIC_PAGES_LOCALE } from "@/lib/public-pages/flag";
import { breadcrumbNode, faqNode, siteGraph } from "@/lib/public-pages/json-ld";
import { publicPageMetadata } from "@/lib/public-pages/metadata";

/** See src/app/(default)/page.tsx's doc comment on `dynamic` for why this is explicit rather than left to auto-detection. */
export const dynamic = "force-static";
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
    path: `/${locale}/about`,
    title: ABOUT.title,
    description: ABOUT.description,
    indexable: PUBLIC_PAGES_INDEXABLE,
    type: "website",
  });
}

/** "/ar/about": what SentenceStep is, in plain facts and questions with answers. Numbers come from the code that owns them (see about-content.ts). */
export default async function AboutRoute({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale !== PUBLIC_PAGES_LOCALE) notFound();
  const site = siteGraph();
  return (
    <>
      <JsonLd
        data={{
          ...site,
          "@graph": [
            ...(site["@graph"] as Record<string, unknown>[]),
            breadcrumbNode([
              { name: "SentenceStep", path: `/${locale}` },
              { name: ABOUT.title },
            ]),
            faqNode(ABOUT_FAQS),
          ],
        }}
      />
      <AboutPage locale={locale} />
    </>
  );
}
