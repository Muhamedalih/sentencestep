import { getSiteUrl } from "@/lib/site-url";

import type { ArticleFaq } from "./types";

const origin = () => getSiteUrl().replace(/\/+$/, "");

/** The site as an organization and a website: on the landing pages, so a search engine and an assistant know who SentenceStep is. */
export function siteGraph(): Record<string, unknown> {
  const base = origin();
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${base}/#organization`,
        name: "SentenceStep",
        url: `${base}/`,
        logo: `${base}/icon-512.png`,
      },
      {
        "@type": "WebSite",
        "@id": `${base}/#website`,
        name: "SentenceStep",
        url: `${base}/`,
        inLanguage: ["ar", "es", "tr"],
        publisher: { "@id": `${base}/#organization` },
      },
    ],
  };
}

export function faqNode(faqs: readonly ArticleFaq[]): Record<string, unknown> {
  return {
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };
}

export function breadcrumbNode(
  trail: readonly { name: string; path?: string }[],
): Record<string, unknown> {
  const base = origin();
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((step, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: step.name,
      ...(step.path ? { item: `${base}${step.path}` } : {}),
    })),
  };
}

export function rulePageGraph(input: {
  path: string;
  name: string;
  description: string;
  level: string;
  teaches: string;
  breadcrumb: readonly { name: string; path?: string }[];
  faqs: readonly ArticleFaq[];
}): Record<string, unknown> {
  const base = origin();
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LearningResource",
        "@id": `${base}${input.path}#resource`,
        url: `${base}${input.path}`,
        name: input.name,
        description: input.description,
        inLanguage: "ar",
        educationalLevel: input.level,
        learningResourceType: "Grammar explanation",
        teaches: input.teaches,
        isAccessibleForFree: true,
        publisher: { "@id": `${base}/#organization` },
      },
      breadcrumbNode(input.breadcrumb),
      faqNode(input.faqs),
    ],
  };
}

/** JSON for a <script type="application/ld+json">: "<" is escaped so no text can close the tag. */
export function jsonLdString(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
