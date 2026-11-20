import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/public-pages/json-ld";
import { RulePage } from "@/components/public-pages/rule-page";
import { PUBLIC_PAGES_LOCALE } from "@/lib/public-pages/flag";
import { rulePageGraph } from "@/lib/public-pages/json-ld";
import { publicPageMetadata } from "@/lib/public-pages/metadata";
import {
  buildRulePage,
  isRuleIndexable,
  publicRuleSlugs,
  rulePagePath,
} from "@/lib/public-pages/rule-page-data";

/** See src/app/(default)/page.tsx's doc comment on `dynamic` for why this is explicit rather than left to auto-detection. */
export const dynamic = "force-static";

/** A rule has a page only when it has a written article (rule-articles.ts), and only in Arabic for now: any other address is a 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return publicRuleSlugs().map((slug) => ({ locale: PUBLIC_PAGES_LOCALE, slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const model = buildRulePage(slug, locale);
  if (!model) return {};
  return publicPageMetadata({
    path: rulePagePath(locale, slug),
    title: model.article.h1,
    description: model.article.description,
    indexable: isRuleIndexable(model.id),
  });
}

/** "/ar/grammar/<slug>": one rule explained for Arabic speakers (see src/lib/public-pages/ for where its text comes from). */
export default async function RulePageRoute({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (locale !== PUBLIC_PAGES_LOCALE) notFound();
  const model = buildRulePage(slug, locale);
  if (!model) notFound();

  return (
    <>
      <JsonLd
        data={rulePageGraph({
          path: rulePagePath(locale, slug),
          name: model.article.h1,
          description: model.article.description,
          level: model.levelLabel,
          teaches: model.title,
          breadcrumb: [
            { name: "SentenceStep", path: `/${locale}` },
            { name: "القواعد", path: `/${locale}/grammar` },
            { name: model.article.h1 },
          ],
          faqs: model.article.faqs,
        })}
      />
      <RulePage model={model} locale={locale} />
    </>
  );
}
