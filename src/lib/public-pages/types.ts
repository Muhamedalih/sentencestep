/** One block of the explanation of a rule page, in Arabic. English words and sentences inside the text are fine: the page isolates them for reading. */
export type ArticleBlock =
  | { kind: "h2"; text: string }
  | { kind: "p"; text: string }
  | { kind: "list"; items: readonly string[] }
  | { kind: "table"; head: readonly string[]; rows: readonly (readonly string[])[] };

export interface ArticleFaq {
  q: string;
  a: string;
}

/**
 * What a rule page adds to the rule's own text (teach.ts): the written explanation that makes the page an
 * article and not a card. A rule has a public page only once it has one of these (the "thin gate": the
 * card alone is about 50 words, too little to offer to a search engine). Written for Arabic speakers.
 */
export interface RuleArticle {
  /** The page's title (h1): the question a learner types, in Arabic with the English terms. */
  h1: string;
  /** The description under the title in a search result, one or two sentences. */
  description: string;
  /** The explanation, in the order it is read. */
  blocks: readonly ArticleBlock[];
  /** The Arabic of the rule's six prepared sentences (teach.ts `items`), in the same order. */
  examplesAr: readonly string[];
  /** Two or three questions with a short answer each; also written as structured data. */
  faqs: readonly ArticleFaq[];
}
