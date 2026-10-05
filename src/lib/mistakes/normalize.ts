/**
 * The word's identity for "Fix Your Mistakes" — sentences have no stable
 * per-word id in the existing schema, so the word's own normalized text is
 * the strongest identifier available (see the migration's own doc comment).
 * Lowercased so "Went"/"went" collapse to the same item; leading/trailing
 * punctuation stripped (a sentence-final "yesterday." must match a
 * mid-sentence "yesterday") while internal characters — including
 * apostrophes ("don't") and hyphens ("well-known") — are left alone, since
 * those are part of the word itself, not incidental punctuation around it.
 */
export function normalizeMistakeWord(word: string): string {
  return word
    .trim()
    .toLowerCase()
    .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
}

/** True for a token worth tracking as a mistake — excludes standalone punctuation/symbol tokens (e.g. an em dash typed as its own word) that normalize to nothing or contain no actual letters. */
export function isTrackableWord(word: string): boolean {
  const normalized = normalizeMistakeWord(word);
  return normalized.length > 0 && /\p{L}/u.test(normalized);
}

/**
 * Pronouns of every kind (personal, possessive, reflexive, demonstrative,
 * interrogative/relative, indefinite), plus "the" — excluded from mistake
 * tracking alongside pronouns at the user's explicit request even though
 * it's an article, not a pronoun. Checked against the already-normalized
 * (lowercased) word.
 */
const EXCLUDED_PRONOUNS_AND_ARTICLES = new Set([
  "i",
  "you",
  "he",
  "she",
  "it",
  "we",
  "they",
  "me",
  "him",
  "her",
  "us",
  "them",
  "my",
  "your",
  "his",
  "its",
  "our",
  "their",
  "mine",
  "yours",
  "hers",
  "ours",
  "theirs",
  "myself",
  "yourself",
  "himself",
  "herself",
  "itself",
  "ourselves",
  "yourselves",
  "themselves",
  "this",
  "that",
  "these",
  "those",
  "who",
  "whom",
  "whose",
  "what",
  "which",
  "all",
  "another",
  "any",
  "anybody",
  "anyone",
  "anything",
  "both",
  "each",
  "either",
  "everybody",
  "everyone",
  "everything",
  "few",
  "many",
  "neither",
  "nobody",
  "none",
  "nothing",
  "one",
  "several",
  "some",
  "somebody",
  "someone",
  "something",
  "such",
  "the",
]);

/** Number words ("one", "two", "three", ...) — excluded from mistake tracking at the user's explicit request. */
const EXCLUDED_NUMBER_WORDS = new Set([
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
  "twenty",
  "thirty",
  "forty",
  "fifty",
  "sixty",
  "seventy",
  "eighty",
  "ninety",
  "hundred",
  "thousand",
  "million",
  "billion",
]);

/**
 * Character names used across Stories/Normal lesson content — excluded from
 * mistake tracking at the user's explicit request ("Ali", "Layla", etc.).
 * No per-word "is this a name" field exists anywhere in the content schema
 * or types, so this is a maintained roster, not a derived one: add a name
 * here when a new named character is introduced in lesson/story content.
 */
const EXCLUDED_CHARACTER_NAMES = new Set([
  "layla",
  "ahmed",
  "ali",
  "yusuf",
  "tariq",
  "noor",
  "omar",
  "lina",
  "yara",
  "sara",
  "karim",
  "rana",
  "maya",
  "farida",
  "tarek",
  "samir",
  "dina",
  "adam",
  "yasin",
]);

/**
 * True for a mistyped word actually worth a "Fix Your Mistakes" entry —
 * `isTrackableWord` minus one- and two-letter words ("I", "he", "a", "to",
 * "is"...), pronouns of every kind, "the", number words, and character
 * names from lesson/story content, none of which are worth a review item
 * even when a learner mistypes them. Deliberately separate from
 * isTrackableWord itself, which stays a broad "is this a real word token"
 * check used well beyond mistake-tracking (content-word counts, voice-cache
 * lookups) where filtering these out would be wrong.
 */
export function isMistakeWorthTracking(word: string): boolean {
  if (!isTrackableWord(word)) return false;
  const normalized = normalizeMistakeWord(word);
  if (normalized.length <= 2) return false;
  if (EXCLUDED_PRONOUNS_AND_ARTICLES.has(normalized)) return false;
  if (EXCLUDED_NUMBER_WORDS.has(normalized)) return false;
  if (EXCLUDED_CHARACTER_NAMES.has(normalized)) return false;
  return true;
}

/**
 * Words that carry grammar rather than meaning — "was", "would", "from",
 * "because", "not", "very" — which pronouns/articles/numbers (excluded by
 * isMistakeWorthTracking above) don't already cover. Nobody needs a flash
 * card for these, and offering a save button on every word of a sentence
 * makes saving feel like a chore. Checked against the normalized word.
 */
const FUNCTION_WORDS = new Set([
  // be / have / do
  "am",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "having",
  "do",
  "does",
  "did",
  // modals
  "can",
  "could",
  "will",
  "would",
  "shall",
  "should",
  "may",
  "might",
  "must",
  "cannot",
  // prepositions
  "about",
  "above",
  "across",
  "after",
  "against",
  "along",
  "among",
  "around",
  "at",
  "before",
  "behind",
  "below",
  "beneath",
  "beside",
  "between",
  "beyond",
  "by",
  "down",
  "during",
  "except",
  "for",
  "from",
  "in",
  "inside",
  "into",
  "near",
  "of",
  "off",
  "on",
  "onto",
  "out",
  "outside",
  "over",
  "past",
  "per",
  "since",
  "through",
  "throughout",
  "till",
  "to",
  "toward",
  "towards",
  "under",
  "until",
  "up",
  "upon",
  "via",
  "with",
  "within",
  "without",
  // conjunctions
  "and",
  "but",
  "or",
  "nor",
  "so",
  "yet",
  "because",
  "although",
  "though",
  "while",
  "whereas",
  "if",
  "unless",
  "whether",
  "than",
  "then",
  "as",
  // very common function adverbs and determiners
  "not",
  "no",
  "yes",
  "very",
  "too",
  "just",
  "also",
  "only",
  "even",
  "still",
  "already",
  "ever",
  "never",
  "always",
  "often",
  "here",
  "there",
  "now",
  "how",
  "why",
  "when",
  "where",
  "more",
  "most",
  "much",
  "less",
  "least",
  "other",
  "others",
  "same",
  "own",
  "every",
  "else",
  "again",
]);

/**
 * True for a word worth offering "save to my cards" on: a real content word,
 * not a function word, pronoun, demonstrative, article, number, name, or a
 * contraction/possessive ("don't", "it's"). Deliberately stricter than
 * isMistakeWorthTracking, which only skips what is never worth a review
 * item; a saved card is something the learner chose to study, so the offer
 * itself stays rare and meaningful.
 */
export function isWordWorthSaving(word: string): boolean {
  if (!isMistakeWorthTracking(word)) return false;
  const normalized = normalizeMistakeWord(word);
  if (/['’]/.test(normalized)) return false;
  return !FUNCTION_WORDS.has(normalized);
}

/** Indices (into the sentence's whitespace-separated words, the same indexing wordTranslations uses) of the words worth saving. */
export function savableWordIndices(sentence: string): Set<number> {
  const indices = new Set<number>();
  sentence
    .split(/\s+/)
    .filter((token) => token.length > 0)
    .forEach((token, index) => {
      if (isWordWorthSaving(token)) indices.add(index);
    });
  return indices;
}
