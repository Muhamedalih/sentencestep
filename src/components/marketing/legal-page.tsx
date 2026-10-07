import type { ReactNode } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

import { SUPPORT_EMAIL } from "./legal-documents";
import type { LegalDocument, LegalLanguage } from "./legal-documents";

/** The support address is shown as a mail link wherever the text mentions it. */
function withMailLink(text: string): ReactNode {
  const parts = text.split(SUPPORT_EMAIL);
  if (parts.length === 1) return text;
  return parts.flatMap((part, index) =>
    index === 0
      ? [part]
      : [
          <a
            key={index}
            href={`mailto:${SUPPORT_EMAIL}`}
            className="text-foreground underline underline-offset-4"
            dir="ltr"
          >
            {SUPPORT_EMAIL}
          </a>,
          part,
        ],
  );
}

/**
 * One long-form legal page (Terms or Privacy) in its own language. The
 * document itself reads right to left in Arabic even though the surrounding
 * site chrome keeps the app-wide left-to-right layout, because pages of
 * running text are much harder to read otherwise.
 */
export function LegalPage({
  document: legal,
  language,
}: {
  document: LegalDocument;
  language: LegalLanguage;
}) {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main
        lang={language}
        dir={language === "ar" ? "rtl" : "ltr"}
        className="mx-auto w-full max-w-2xl flex-1 px-6 py-16 sm:py-24"
      >
        <h1 className="text-3xl font-semibold tracking-tight">{legal.title}</h1>
        <p className="text-muted-foreground mt-2 text-sm">{legal.updated}</p>
        <p className="text-foreground/80 mt-6 leading-relaxed">{legal.intro}</p>

        {legal.sections.map((section) => (
          <section key={section.heading} className="mt-9">
            <h2 className="text-lg font-semibold tracking-tight">{section.heading}</h2>
            {section.paragraphs?.map((paragraph) => (
              <p key={paragraph} className="text-muted-foreground mt-3 text-sm leading-relaxed">
                {withMailLink(paragraph)}
              </p>
            ))}
            {section.bullets && (
              <ul className="text-muted-foreground mt-3 flex list-disc flex-col gap-2.5 ps-5 text-sm leading-relaxed">
                {section.bullets.map((bullet) => (
                  <li key={bullet}>{withMailLink(bullet)}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </main>
      <SiteFooter />
    </div>
  );
}
