/**
 * Which spelling patterns learners get wrong, from the "Fix your mistakes" log (the strategy report's
 * phase 0 item, and the evidence for an Arabic-speaker spelling coach). Pure: the readout script
 * (scripts/error-patterns-readout.ts) reads the rows; this classifies words and does the sums.
 *
 * The unit is a learner and a word. A word is "exposed" to a learner who finished a lesson that holds
 * it, and "wrong" when that learner has a mistake logged for it in such a lesson. Comparing patterns
 * by their raw rates would mostly measure word length, so every feature is compared with the words of
 * the SAME length class that have none of the features (an indirect standardisation: how many
 * learners would have got these words wrong at the plain-word rate, against how many did).
 */

export interface SpellingFeature {
  id: string;
  label: string;
  matches: (word: string) => boolean;
}

const VOWELS = "aeiouy";

export const SPELLING_FEATURES: readonly SpellingFeature[] = [
  {
    id: "double_consonant",
    label: "doubled consonant (ll, ss, tt, rr...)",
    matches: (word) => /([bcdfgklmnprstvz])\1/.test(word),
  },
  { id: "double_vowel", label: "ee / oo", matches: (word) => /(ee|oo)/.test(word) },
  {
    id: "silent_e",
    label: "silent final e after a consonant",
    matches: (word) => word.length >= 4 && word.endsWith("e") && !VOWELS.includes(word.at(-2)!),
  },
  { id: "gh", label: "gh (night, though, enough)", matches: (word) => word.includes("gh") },
  {
    id: "silent_start",
    label: "silent first letter (kn, wr, gn, ps)",
    matches: (word) => /^(kn|wr|gn|ps)/.test(word),
  },
  { id: "silent_mb", label: "silent b (climb, lamb)", matches: (word) => /mb$/.test(word) },
  { id: "ould", label: "ould (would, could, should)", matches: (word) => word.endsWith("ould") },
  { id: "ph", label: "ph (phone)", matches: (word) => word.includes("ph") },
  {
    id: "tion",
    label: "tion / sion / cian",
    matches: (word) => /(tion|sion|cian)/.test(word),
  },
  {
    id: "vowel_pair",
    label: "vowel pairs (ea, ou, ai, ie, ei, oa, ui, au)",
    matches: (word) => /(ea|ou|ai|ie|ei|oa|ui|au)/.test(word),
  },
  { id: "ck", label: "ck", matches: (word) => word.includes("ck") },
  {
    id: "soft_c_g",
    label: "soft c or g (ce, ci, cy, ge, gi)",
    matches: (word) => /(c[eiy]|g[ei])/.test(word),
  },
  { id: "contraction", label: "apostrophe (don't, it's)", matches: (word) => word.includes("'") },
  { id: "ending_ed_ing", label: "ends in -ed or -ing", matches: (word) => /(ed|ing)$/.test(word) },
];

/** The ids of the features a (lower-case) word has. */
export function spellingFeatures(word: string): string[] {
  const lower = word.toLowerCase();
  return SPELLING_FEATURES.filter((feature) => feature.matches(lower)).map((feature) => feature.id);
}

export const LENGTH_BUCKETS = ["3-4", "5-6", "7-8", "9+"] as const;
export type LengthBucket = (typeof LENGTH_BUCKETS)[number];

/** Letters only: an apostrophe is not a letter to spell. */
export function lengthBucket(word: string): LengthBucket {
  const letters = word.replace(/[^\p{L}]/gu, "").length;
  if (letters <= 4) return "3-4";
  if (letters <= 6) return "5-6";
  if (letters <= 8) return "7-8";
  return "9+";
}

export interface WordStat {
  word: string;
  /** Learners who finished a lesson holding the word. */
  exposed: number;
  /** Of those, learners with a mistake logged on it in such a lesson. */
  wrong: number;
  /** Of those, learners who got it wrong twice or more (a gap, not a slip). */
  repeat: number;
}

export interface Tally {
  words: number;
  exposed: number;
  wrong: number;
  repeat: number;
}

const emptyTally = (): Tally => ({ words: 0, exposed: 0, wrong: 0, repeat: 0 });

function addTo(tally: Tally, word: WordStat): void {
  tally.words += 1;
  tally.exposed += word.exposed;
  tally.wrong += word.wrong;
  tally.repeat += word.repeat;
}

export const rate = (wrong: number, exposed: number): number | null =>
  exposed > 0 ? wrong / exposed : null;

export interface FeatureRow {
  id: string;
  label: string;
  words: number;
  exposed: number;
  wrong: number;
  /** wrong / exposed. */
  rate: number | null;
  /** Wrong learners expected if these words were as hard as plain words of their own length. */
  expected: number;
  /** wrong / expected: above 1 = harder than a plain word of the same length. null with no baseline. */
  ratio: number | null;
  /** Share of wrong learners who got it wrong twice or more. */
  repeatShare: number | null;
}

export interface SpellingReport {
  /** Words with none of the features, by length: the yardstick. */
  baseline: Record<LengthBucket, Tally>;
  all: Tally;
  rows: FeatureRow[];
}

/**
 * Compares every feature with plain words of the same length. A feature needs `minWords` words to be
 * shown at all (a pattern seen in four words is a few words, not a pattern).
 */
export function spellingReport(stats: readonly WordStat[], minWords = 15): SpellingReport {
  const baseline = Object.fromEntries(
    LENGTH_BUCKETS.map((bucket) => [bucket, emptyTally()]),
  ) as Record<LengthBucket, Tally>;
  const all = emptyTally();
  const perFeature = new Map<string, { tally: Tally; expected: number }>();

  for (const stat of stats) {
    addTo(all, stat);
    if (spellingFeatures(stat.word).length === 0) addTo(baseline[lengthBucket(stat.word)], stat);
  }
  const baselineRate = (bucket: LengthBucket) =>
    rate(baseline[bucket].wrong, baseline[bucket].exposed);

  for (const stat of stats) {
    const bucketRate = baselineRate(lengthBucket(stat.word));
    for (const id of spellingFeatures(stat.word)) {
      const entry = perFeature.get(id) ?? { tally: emptyTally(), expected: 0 };
      addTo(entry.tally, stat);
      entry.expected += bucketRate === null ? 0 : stat.exposed * bucketRate;
      perFeature.set(id, entry);
    }
  }

  const rows: FeatureRow[] = [];
  for (const feature of SPELLING_FEATURES) {
    const entry = perFeature.get(feature.id);
    if (!entry || entry.tally.words < minWords) continue;
    const { tally, expected } = entry;
    rows.push({
      id: feature.id,
      label: feature.label,
      words: tally.words,
      exposed: tally.exposed,
      wrong: tally.wrong,
      rate: rate(tally.wrong, tally.exposed),
      expected,
      ratio: expected > 0 ? tally.wrong / expected : null,
      repeatShare: rate(tally.repeat, tally.wrong),
    });
  }
  rows.sort((a, b) => (b.ratio ?? 0) - (a.ratio ?? 0));
  return { baseline, all, rows };
}
