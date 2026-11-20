import { ALL_RULES } from "@/lib/daily-rule/levels";
import { UNITS } from "@/lib/daily-rule/units";

import { PUBLIC_PAGES_INDEXABLE, PUBLIC_PAGES_LOCALE } from "./flag";
import { publicRules } from "./rule-page-data";
import { slugForRule } from "./rule-slugs";

/**
 * The text of /llms.txt: a short plain-text map of the site for AI assistants (a convention, not a
 * standard that any assistant is known to rely on, so it is cheap and not counted on). While the public
 * pages are closed it lists only the pages that are open.
 */
export function buildLlmsTxt(origin: string, open: boolean = PUBLIC_PAGES_INDEXABLE): string {
  const base = origin.replace(/\/+$/, "");
  const lines = [
    "# SentenceStep",
    "",
    "> SentenceStep is an English-learning website for Arabic speakers (the interface is also in Spanish and Turkish). The learner hears a sentence, types it letter by letter, and sees the translation at once. It has short stories, daily lessons, word lists, reading passages and a grammar course explained in Arabic. The first lesson is free and needs no account.",
    "",
  ];
  if (open) {
    lines.push(
      "## Start here",
      `- [About SentenceStep](${base}/${PUBLIC_PAGES_LOCALE}/about): what it is, who it is for, what is free and what is paid (Arabic, with a short English summary)`,
      `- [Grammar rules in Arabic](${base}/${PUBLIC_PAGES_LOCALE}/grammar): the course has ${ALL_RULES.length} rules in ${UNITS.length} units from A1 to B2; each page explains one rule for Arabic speakers, with the mistakes Arabic speakers make`,
      "",
      "## Grammar pages",
      ...publicRules().flatMap((rule) => {
        const slug = slugForRule(rule.id);
        return slug ? [`- [${rule.title}](${base}/${PUBLIC_PAGES_LOCALE}/grammar/${slug})`] : [];
      }),
      "",
    );
  }
  lines.push(
    "## Policies",
    `- [Terms](${base}/terms)`,
    `- [Privacy](${base}/privacy)`,
    "",
  );
  return lines.join("\n");
}
