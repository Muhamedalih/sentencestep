import type { ReactNode } from "react";

import { LegalBackButton } from "./legal-back-button";
import { LEGAL_BACK_LABEL, splitLegalLinks } from "./legal-documents";
import type { LegalDocument, LegalLanguage } from "./legal-documents";

/**
 * The support address is shown as a mail link wherever the text mentions it, and so are YouTube's
 * Terms of Service and the Google Privacy Policy (its rules make us show them), which open in a new tab.
 */
function withLinks(text: string): ReactNode {
  const parts = splitLegalLinks(text);
  if (parts.length === 1 && parts[0]!.href === undefined) return text;
  return parts.map((part, index) =>
    part.href === undefined ? (
      part.text
    ) : (
      <a
        key={index}
        href={part.href}
        className="text-foreground underline underline-offset-4"
        dir="ltr"
        {...(part.href.startsWith("mailto:")
          ? {}
          : { target: "_blank", rel: "noopener noreferrer" })}
      >
        {part.text}
      </a>
    ),
  );
}

/**
 * One long-form legal page (Terms or Privacy) in its own language: just the
 * document in a box, with a Back button — no site header or footer, so it
 * reads as a document rather than as another page of the marketing site. The
 * document itself reads right to left in Arabic even though the rest of the
 * app keeps the app-wide left-to-right layout, because pages of running text
 * are much harder to read otherwise.
 */
export function LegalPage({
  document: legal,
  language,
  homeHref,
}: {
  document: LegalDocument;
  language: LegalLanguage;
  /** Where Back goes when the page was opened directly (see legalHomeHref). */
  homeHref: string;
}) {
  return (
    <div className="bg-background min-h-svh px-3 py-4 sm:px-6 sm:py-10">
      <main
        lang={language}
        dir={language === "ar" ? "rtl" : "ltr"}
        className="border-border bg-card mx-auto w-full max-w-2xl rounded-2xl border shadow-sm"
      >
        {/* Sticky, so Back is within reach however far down the document the reader is. */}
        <div className="border-border/60 bg-card sticky top-0 z-10 rounded-t-2xl border-b px-3 py-2">
          <LegalBackButton label={LEGAL_BACK_LABEL[language]} fallbackHref={homeHref} />
        </div>

        <article className="px-5 py-7 sm:px-10 sm:py-10">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{legal.title}</h1>
          <p className="text-muted-foreground mt-2 text-sm">{legal.updated}</p>
          <p className="text-foreground/80 mt-6 leading-relaxed">{legal.intro}</p>

          {legal.sections.map((section) => (
            <section key={section.heading} className="mt-9">
              <h2 className="text-lg font-semibold tracking-tight">{section.heading}</h2>
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph} className="text-muted-foreground mt-3 text-sm leading-relaxed">
                  {withLinks(paragraph)}
                </p>
              ))}
              {section.bullets && (
                <ul className="text-muted-foreground mt-3 flex list-disc flex-col gap-2.5 ps-5 text-sm leading-relaxed">
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{withLinks(bullet)}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </article>
      </main>
    </div>
  );
}
