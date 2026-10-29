import { Fragment } from "react";

import { glueEndings } from "@/lib/daily-rule/marks";
import type { SupportLocale } from "@/lib/i18n/locales";

/**
 * A line of a rule in the learner's language. Not a client module on purpose: the rule library's list (a
 * server page) and the pages of a rule (client components) both draw lines through it, and the list ships
 * no script for it.
 */

/**
 * An Arabic line that names English words (the lines of a rule do): each run of English keeps its own
 * direction inside the Arabic sentence, so "-ing", "go → goes" and "to:" read in order instead of swapping
 * places. The punctuation and brackets at either end of a run stay outside it, with the Arabic, so a
 * full stop lands where the Arabic sentence ends and not between the English and the Arabic.
 */
function MixedLine({ text }: { text: string }) {
  return (
    <>
      {text.split(/([\x21-\x7E→]+(?: [\x21-\x7E→]+)*)/).map((part, index) => {
        if (index % 2 === 0) return part;
        const found = /^([\s.,:;!?()]*)(.*?)([\s.,:;!?()]*)$/.exec(part)!;
        return (
          <Fragment key={index}>
            {found[1]}
            <bdi>{glueEndings(found[2]!)}</bdi>
            {found[3]}
          </Fragment>
        );
      })}
    </>
  );
}

/** One line of a rule in the learner's language: Arabic keeps its English words in order, Spanish and Turkish read as they are. */
export function Say({ text, locale }: { text: string; locale: SupportLocale | null }) {
  return (locale ?? "ar") === "ar" ? <MixedLine text={text} /> : <>{glueEndings(text)}</>;
}
