import { difficultyForLevel, type Difficulty } from "@/lib/levels";
import type { Lesson, Sentence, VocabularyItem } from "@/types/content";

/**
 * Story vocabulary — target-word selection, ranking, and in-context
 * placement (isolated feature — safe to delete this file, its 4 call sites
 * in src/lib/supabase/queries/content.ts and src/lib/content.ts, the one
 * call site in src/lib/admin/stories-quality.ts, the two prop additions on
 * TypingText/TypingSentence, the one optional field on the Sentence type,
 * and scripts/audit-story-vocabulary.ts, without affecting story playback,
 * translations, audio, or progress — see this module's exports for the
 * exact removal list, and the file-level report this change shipped with
 * for the full accounting).
 *
 * A word is only ever selected if it already occurs, verbatim, in the
 * story's own sentences — nothing here invents, rewrites, or relocates
 * story content. This module ranks and filters *existing*
 * `Sentence.wordTranslations` entries (the same word-by-word gloss data
 * that already exists for every story sentence) plus the lesson's own
 * `title`; it never talks to an AI provider, a dictionary API, or any
 * other external service, and never creates a database row. Given the
 * same story content, level, and title, it always returns the same
 * result — no randomness, no time-based state, no I/O.
 *
 * Two things are built from the exact same selection (see
 * buildStoryVocabulary): the completion-recap list
 * (Lesson.vocabulary → LessonCompletion) and the in-context markers on the
 * story sentences themselves (Sentence.targetVocabularyIndices →
 * TypingText's subtle dotted-underline). They cannot diverge because
 * they're two views of one array, not two separate derivations.
 *
 * --- The ranking model ---
 *
 * No CEFR/word-frequency dataset exists anywhere in this project (the only
 * relevant model is src/lib/levels.ts's coarse 3-tier
 * beginner/intermediate/advanced tier, reused below for both length- and
 * syllable-based level fit). Every "usefulness"/"difficulty" signal here is
 * a small, deterministic, hand-built heuristic over the story's own text —
 * never a claim of real linguistic frequency or CEFR data, and clearly
 * isolated (see COMMON_EVERYDAY_WORDS and estimateSyllableCount) so it can
 * be swapped for a real dataset later without touching anything else.
 *
 * A candidate's score is the sum of these named signals (see
 * scoreCandidate for the exact formula):
 *
 *   commonness fit    (level-weighted; common words are useful too, not
 *                       penalized — see LEVEL_WEIGHTS)
 *   + length-band fit   (level-weighted length preference, capped)
 *   + difficulty fit    (syllable-count-based, level-weighted, capped —
 *                         a second, distinct heuristic from length, so
 *                         "longer" and "harder" aren't conflated)
 *   + repetition        (extra occurrences of the same word, damped for
 *                         common words — repeating a basic word doesn't
 *                         make it suddenly important)
 *   + narrative coverage (how many distinct sentences the word spans)
 *   + local concentration (a weak signal: how many other eligible words
 *                         share this word's sentence)
 *   + title match        (the word's lexical stem appears in the story's
 *                         own title)
 *
 * Relevance signals (repetition + coverage + concentration + title, up to
 * ~5.6 combined) are sized to outweigh the commonness/length spread (at
 * most ~4 combined) — a common-but-central word can beat a rare-but-
 * irrelevant one, and a difficult word with no relevance signal can lose
 * to an easier, genuinely story-relevant one. See this file's own test
 * suite for both directions verified explicitly.
 *
 * A candidate below MIN_ACCEPTABLE_SCORE is never selected, even if fewer
 * than MAX_VOCABULARY_ITEMS remain — the target is "4-6 when the story
 * genuinely has that many," never "pad to 6."
 */

// ---------------------------------------------------------------------------
// Step A — hard exclusions. A word can never be selected regardless of
// score once excluded here.
// ---------------------------------------------------------------------------

const MIN_TARGET_WORD_LENGTH = 4;
const MAX_VOCABULARY_ITEMS = 6;
/**
 * Below this combined score, a candidate is dropped rather than used to pad
 * the list out to 6 — the "no filler" floor.
 *
 * Given LEVEL_WEIGHTS/MAX_LENGTH_PENALTY/difficultyFitBonus's current
 * values, -0.4 is the mathematical minimum any candidate can reach from
 * level-fit penalties alone (commonness baseline is always positive; the
 * worst combination — a poorly-banded word, common-at-Advanced or
 * specific-at-any-level — bottoms out there). This floor is set just
 * above that, so it excludes ONLY a candidate that is both a poor level
 * fit *and* has zero relevance support (no repetition, no coverage, no
 * title match, no concentration) — genuinely unsuitable, not merely
 * "somewhat difficult." Any candidate with even one real relevance signal
 * clears it regardless of level fit — level fit alone can never exclude a
 * word here, only re-rank it; see the Case A tests.
 */
const MIN_ACCEPTABLE_SCORE = -0.35;

/**
 * Function words, auxiliaries, and grammatical contractions — never
 * "vocabulary" regardless of length or context, because they carry no
 * independent lexical meaning a learner would look up. Distinct from
 * COMMON_EVERYDAY_WORDS below (real content words that are simply basic) —
 * this list is a hard exclusion; that one is a soft scoring input.
 */
const STOPWORDS = new Set([
  "about",
  "after",
  "again",
  "against",
  "almost",
  "already",
  "also",
  "always",
  "another",
  "anything",
  "around",
  "back",
  "because",
  "become",
  "been",
  "before",
  "being",
  "between",
  "could",
  "did",
  "does",
  "doing",
  "down",
  "during",
  "each",
  "either",
  "enough",
  "even",
  "ever",
  "every",
  "everyone",
  "everything",
  "finally",
  "first",
  "found",
  "from",
  "getting",
  "going",
  "have",
  "here",
  "himself",
  "however",
  "instead",
  "into",
  "just",
  "know",
  "knew",
  "last",
  "later",
  "like",
  "little",
  "look",
  "looked",
  "made",
  "make",
  "least",
  "less",
  "many",
  "might",
  "more",
  "most",
  "much",
  "myself",
  "never",
  "next",
  "night",
  "nothing",
  "once",
  "only",
  "other",
  "over",
  "quite",
  "rather",
  "really",
  "said",
  "same",
  "several",
  "should",
  "since",
  "some",
  "something",
  "still",
  "such",
  "suddenly",
  "sure",
  "than",
  "that",
  "their",
  "them",
  "then",
  "there",
  "these",
  "they",
  "thing",
  "think",
  "this",
  "those",
  "though",
  "through",
  "time",
  "today",
  "together",
  "told",
  "took",
  "toward",
  "under",
  "until",
  "very",
  "wanted",
  "wasn't",
  "week",
  "week's",
  "were",
  "what",
  "when",
  "where",
  "which",
  "while",
  "will",
  "with",
  "without",
  "would",
  "your",
  "yourself",
  // Grammatical contractions — auxiliary/negation forms, not lexical items.
  "didn't",
  "doesn't",
  "wasn't",
  "isn't",
  "couldn't",
  "wouldn't",
  "shouldn't",
  "can't",
  "won't",
  "don't",
  "hasn't",
  "haven't",
  "hadn't",
  "weren't",
  "aren't",
  "i'd",
  "i'll",
  "i've",
  "you're",
  "we're",
  "they're",
  "he's",
  "she's",
  "it's",
  "that's",
  "there's",
  "he'd",
  "she'd",
  "we'd",
  "they'd",
  "you'd",
  "who's",
  "what's",
  "where's",
  "who'll",
  "you'll",
  "we'll",
  "they'll",
  "he'll",
  "she'll",
  "it'll",
  "you've",
  "we've",
  "they've",
  "let's",
]);

function stripPunctuation(word: string): string {
  return word.replace(/^[^A-Za-z']+|[^A-Za-z']+$/g, "");
}

/**
 * A small, deliberately naive suffix strip — enough to collapse "walked" /
 * "walking" / "walks" onto the same dedup/grouping key as "walk" without
 * pulling in a real stemmer/NLP library for a problem this narrow. Only
 * used as a grouping key; the word actually shown to the learner is always
 * the untouched form of its first occurrence in the story (see
 * VocabularyCandidate.en below).
 */
function naiveStem(lowercased: string): string {
  const suffixes = ["ies", "ing", "edly", "ed", "es", "ly", "er", "est", "s"];
  for (const suffix of suffixes) {
    if (lowercased.length - suffix.length >= 3 && lowercased.endsWith(suffix)) {
      return lowercased.slice(0, -suffix.length);
    }
  }
  return lowercased;
}

// ---------------------------------------------------------------------------
// Step B — soft, graduated scoring signals. Nothing here excludes a
// candidate; every signal only shifts its score.
// ---------------------------------------------------------------------------

/**
 * Real content words (nouns/verbs/adjectives/adverbs) that are nonetheless
 * extremely basic everyday vocabulary. No longer a penalty that outweighs
 * everything else (see LEVEL_WEIGHTS) — a common word can still win when
 * the story's own content (repetition, coverage, title match) makes it
 * relevant, which is the explicit fix for the earlier binary "common = -3"
 * design. To replace this with real frequency data later, swap
 * `isCommonEverydayWord` below for a lookup against that dataset — nothing
 * else in this file needs to change, since every caller only ever goes
 * through that one function.
 */
const COMMON_EVERYDAY_WORDS = new Set([
  // common verbs (base + everyday inflections)
  "walk",
  "walked",
  "walking",
  "talk",
  "talked",
  "talking",
  "smile",
  "smiled",
  "laugh",
  "laughed",
  "cry",
  "cried",
  "help",
  "helped",
  "need",
  "needed",
  "like",
  "liked",
  "love",
  "loved",
  "hate",
  "hated",
  "hope",
  "hoped",
  "remember",
  "remembered",
  "forget",
  "forgot",
  "decide",
  "decided",
  "realize",
  "realized",
  "notice",
  "noticed",
  "seem",
  "seemed",
  "appear",
  "appeared",
  "become",
  "became",
  "keep",
  "kept",
  "hold",
  "held",
  "bring",
  "brought",
  "send",
  "sent",
  "show",
  "showed",
  "move",
  "moved",
  "turn",
  "turned",
  "stop",
  "stopped",
  "continue",
  "continued",
  "finish",
  "finished",
  "start",
  "started",
  "begin",
  "began",
  "end",
  "ended",
  "work",
  "worked",
  "working",
  "live",
  "lived",
  "stay",
  "stayed",
  "leave",
  "left",
  "open",
  "opened",
  "close",
  "closed",
  "listen",
  "listened",
  "wait",
  "waited",
  "watch",
  "watched",
  "play",
  "played",
  "give",
  "gave",
  "take",
  "taking",
  "put",
  "call",
  "called",
  "ask",
  "asked",
  "try",
  "tried",
  "want",
  "wanting",
  "reach",
  "reached",
  "answer",
  "answered",
  "explain",
  "explained",
  "arrive",
  "arrived",
  "return",
  "returned",
  "grow",
  "grew",
  "happen",
  "happened",
  "sit",
  "stand",
  "stood",
  "run",
  "ran",
  "go",
  "went",
  "eat",
  "ate",
  "drink",
  "drank",
  "sleep",
  "slept",
  "speak",
  "spoke",
  "write",
  "wrote",
  "read",
  "buy",
  "bought",
  "sell",
  "sold",
  "meet",
  "met",
  "visit",
  "visited",
  "check",
  "checked",
  "fix",
  "fixed",
  "clean",
  "cleaned",
  "cook",
  "cooked",
  "drive",
  "drove",
  "carry",
  "carried",
  // common nouns
  "family",
  "friend",
  "friends",
  "house",
  "home",
  "room",
  "door",
  "window",
  "table",
  "chair",
  "food",
  "water",
  "morning",
  "evening",
  "night",
  "week",
  "month",
  "year",
  "years",
  "city",
  "town",
  "street",
  "car",
  "phone",
  "money",
  "work",
  "job",
  "school",
  "class",
  "teacher",
  "student",
  "mother",
  "father",
  "sister",
  "brother",
  "child",
  "children",
  "man",
  "woman",
  "boy",
  "girl",
  "people",
  "person",
  "place",
  "way",
  "thing",
  "things",
  "life",
  "world",
  "hand",
  "hands",
  "eyes",
  "head",
  "heart",
  "voice",
  "story",
  "word",
  "words",
  "name",
  "moment",
  "minute",
  "minutes",
  "hour",
  "hours",
  "day",
  "days",
  "afternoon",
  "kitchen",
  "office",
  "shop",
  "store",
  "book",
  // common adjectives/adverbs
  "good",
  "bad",
  "happy",
  "sad",
  "big",
  "small",
  "large",
  "old",
  "new",
  "young",
  "long",
  "short",
  "high",
  "low",
  "hot",
  "cold",
  "warm",
  "cool",
  "easy",
  "hard",
  "nice",
  "great",
  "little",
  "much",
  "many",
  "few",
  "sure",
  "different",
  "same",
  "important",
  "beautiful",
  "wonderful",
  "strange",
  "quiet",
  "loud",
  "fast",
  "slow",
  "early",
  "late",
  "close",
  "far",
  "right",
  "wrong",
  "true",
  "false",
  "real",
  "clear",
  "simple",
]);

/** True when a word — already lowercased and stripped of punctuation — is on the everyday/basic-vocabulary tier rather than a more distinctive word. See COMMON_EVERYDAY_WORDS's doc comment for how to swap this for real frequency data later. */
function isCommonEverydayWord(lowercased: string): boolean {
  return COMMON_EVERYDAY_WORDS.has(lowercased);
}

/**
 * How much a word's commonness contributes at each level — both tiers are
 * positive (commonness is a *soft* signal, never a hard gate): Beginner
 * favors common/reusable words over merely-uncommon ones (a beginner
 * story shouldn't surface an obscure word just for being rare); Advanced
 * favors specific words more, but only by a moderate margin, small enough
 * that the relevance signals below (repetition/coverage/title) can still
 * out-weigh it in either direction.
 */
const LEVEL_WEIGHTS: Record<Difficulty, { common: number; specific: number }> = {
  beginner: { common: 1.5, specific: 1.0 },
  intermediate: { common: 1.0, specific: 1.8 },
  advanced: { common: 0.6, specific: 2.4 },
};

interface LengthBand {
  idealMin: number;
  idealMax: number;
}

/**
 * The character-length range treated as "comfortably useful" at this
 * story's difficulty tier — wider for higher levels, but only ever shifts
 * a small, capped scoring band (see scoreCandidate); a 14-letter word in
 * an Advanced story scores the same as an 8-letter one if both are inside
 * [idealMin, idealMax]. Never rewards length past idealMax.
 */
function lengthBandForLevel(difficulty: Difficulty): LengthBand {
  switch (difficulty) {
    case "beginner":
      return { idealMin: 4, idealMax: 8 };
    case "intermediate":
      return { idealMin: 5, idealMax: 10 };
    case "advanced":
      return { idealMin: 5, idealMax: 12 };
  }
}

/**
 * Naive syllable count via contiguous vowel-group counting (the same
 * technique classic readability formulas like Flesch-Kincaid use) —
 * deliberately a *different* signal from raw character length, so
 * "difficulty fit" isn't just length-fit under another name. This is a
 * heuristic proxy, not real phonetic syllabification or CEFR data (see
 * this file's doc comment) — good enough to separate "photograph" (3
 * syllables, genuinely more complex) from "strength" (1 syllable, 8
 * characters but not actually hard), which pure length can't do.
 */
function estimateSyllableCount(lowercased: string): number {
  const groups = lowercased.match(/[aeiouy]+/g);
  return groups ? groups.length : 1;
}

/**
 * A small, level-weighted nudge from syllable complexity — capped well
 * below the relevance signals so a "difficult but irrelevant" word can
 * still lose to an easier, genuinely story-relevant one (see this file's
 * doc comment and the corresponding test). Intermediate is deliberately
 * neutral: the length band and commonness weights already do the level
 * differentiation there.
 */
function difficultyFitBonus(word: string, difficulty: Difficulty): number {
  const syllables = estimateSyllableCount(word.toLowerCase());
  if (difficulty === "beginner") {
    // Softened from an earlier -0.8: level fit is a secondary re-ranking
    // signal, not a gate — a genuinely relevant complex word should be
    // penalized, not automatically destroyed, by this alone (see
    // MIN_ACCEPTABLE_SCORE's doc comment for the eligibility side of this).
    if (syllables >= 4) return -0.4;
    if (syllables <= 2) return 0.5;
    return 0;
  }
  if (difficulty === "advanced") {
    return syllables >= 3 ? 0.5 : 0;
  }
  return 0;
}

const REPETITION_WEIGHT = 0.8;
/** Repeating a basic/common word doesn't make it suddenly important — its repetition bonus is damped relative to a distinctive word's. */
const REPETITION_WEIGHT_COMMON_SCALE = 0.4;
const REPETITION_CAP = 1.6;

const COVERAGE_WEIGHT = 0.6;
const COVERAGE_CAP = 1.2;

/** Deliberately small — "local concentration" is described as a weak signal in the spec this implements, not a strong one. */
const CONCENTRATION_WEIGHT = 0.15;
const CONCENTRATION_CAP = 0.6;

/**
 * A candidate whose lexical stem matches one of the story's own title
 * words scores a flat bonus — stem-matched, not crude substring matching
 * (so "ear" in "early" never accidentally matches a title containing
 * "hear"), and modest relative to the other relevance signals combined
 * (repetition + coverage + concentration can together exceed it), per the
 * "keep this signal modest" requirement.
 */
const TITLE_MATCH_BONUS = 2.2;

const OUT_OF_BAND_PENALTY_PER_CHAR = 0.4;
/**
 * Softened from an earlier 2 — level fit (this and difficultyFitBonus)
 * must only *re-rank* candidates, never single-handedly disqualify a word
 * that's otherwise clearly relevant to the story. At the old cap, a long
 * specific word with only modest relevance support (e.g. one weak signal)
 * could be pushed below MIN_ACCEPTABLE_SCORE by length alone; at this cap
 * it can still lose ties to a better-banded competitor, but relevance
 * signals (repetition/coverage/title, up to 5.6 combined) comfortably
 * outweigh it.
 */
const MAX_LENGTH_PENALTY = 1;

/** Only a 3rd+ pick of the same coarse shape is nudged down, and only enough to flip a near-tie — never enough to override a real quality gap. See classifyWordShape's doc comment for why this is intentionally coarse. */
const DIVERSITY_PENALTY = 0.5;
const DIVERSITY_THRESHOLD = 2;

/**
 * A coarse, suffix-based shape bucket — not real part-of-speech tagging,
 * just enough to notice "this story's candidates are almost all past-tense
 * verbs" and mildly favor variety. Used only as a same-score tie-breaker
 * during greedy selection (see selectTargetVocabulary); never excludes or
 * meaningfully outranks an otherwise-better candidate — quality always
 * wins over category-filling.
 */
function classifyWordShape(word: string): "verb" | "adjective" | "other" {
  const w = word.toLowerCase();
  if (/(ed|ing)$/.test(w)) return "verb";
  if (/(ful|less|ous|ive|able|ible|al)$/.test(w)) return "adjective";
  return "other";
}

/**
 * Title words worth matching against — the story's own title, stripped of
 * punctuation, lowercased, stemmed, with stopwords and very short words
 * dropped. A Set, so lookups are exact-stem matches, never substrings.
 */
function extractTitleStems(title: string): Set<string> {
  const stems = new Set<string>();
  for (const rawWord of title.split(/\s+/)) {
    const clean = stripPunctuation(rawWord);
    const lowercased = clean.toLowerCase();
    if (clean.length < MIN_TARGET_WORD_LENGTH || STOPWORDS.has(lowercased)) continue;
    stems.add(naiveStem(lowercased));
  }
  return stems;
}

interface WordOccurrence {
  sentenceId: string;
  wordIndex: number;
  en: string;
  ar: string;
}

interface VocabularyCandidate {
  /** The first occurrence's position/text — used for the recap entry's id/en/ar. */
  representative: WordOccurrence;
  /** Every occurrence of this stem in the story — used to mark all of them in-context, not just the first. */
  occurrences: WordOccurrence[];
  score: number;
  shape: "verb" | "adjective" | "other";
}

function scoreCandidate(
  word: string,
  difficulty: Difficulty,
  band: LengthBand,
  occurrenceCount: number,
  sentenceCoverage: number,
  concentration: number,
  isTitleMatch: boolean,
): number {
  const lowercased = word.toLowerCase();
  const isCommon = isCommonEverydayWord(lowercased);
  const weights = LEVEL_WEIGHTS[difficulty];

  let score = isCommon ? weights.common : weights.specific;

  if (word.length < band.idealMin) {
    score -= Math.min(
      MAX_LENGTH_PENALTY,
      (band.idealMin - word.length) * OUT_OF_BAND_PENALTY_PER_CHAR,
    );
  } else if (word.length > band.idealMax) {
    score -= Math.min(
      MAX_LENGTH_PENALTY,
      (word.length - band.idealMax) * OUT_OF_BAND_PENALTY_PER_CHAR,
    );
  }

  score += difficultyFitBonus(word, difficulty);

  const repetitionScale = isCommon ? REPETITION_WEIGHT_COMMON_SCALE : 1;
  score += Math.min(REPETITION_CAP, (occurrenceCount - 1) * REPETITION_WEIGHT * repetitionScale);

  score += Math.min(COVERAGE_CAP, (sentenceCoverage - 1) * COVERAGE_WEIGHT);

  score += Math.min(CONCENTRATION_CAP, concentration * CONCENTRATION_WEIGHT);

  if (isTitleMatch) score += TITLE_MATCH_BONUS;

  return score;
}

/**
 * The single ranking pass every public export below is built from — see
 * this file's doc comment for the full formula and why a single pass
 * matters (the recap list and the in-context markers can never disagree
 * about which words were chosen).
 *
 * Deterministic throughout: candidates are grouped by first-encounter
 * order (Map preserves insertion order), scored with no randomness or
 * time-based state, sorted with a *stable* sort (equal scores keep story
 * order), and greedily selected with a deterministic left-to-right,
 * strict-greater-than scan (so ties resolve to the earlier candidate,
 * never arbitrarily).
 */
function selectTargetVocabulary(
  sentences: Pick<Sentence, "id" | "wordTranslations">[],
  level: number,
  title: string,
): VocabularyCandidate[] {
  const difficulty = difficultyForLevel(level);
  const band = lengthBandForLevel(difficulty);
  const titleStems = extractTitleStems(title);

  // Phase 1: collect every occurrence that survives the hard exclusions,
  // grouped by lexical stem (insertion-ordered, so the first key a stem is
  // seen under is also the first sentence/word position it occurred at).
  const groups = new Map<
    string,
    { representative: WordOccurrence; occurrences: WordOccurrence[] }
  >();

  for (const sentence of sentences) {
    if (!sentence.wordTranslations) continue;

    sentence.wordTranslations.forEach((entry, wordIndex) => {
      const clean = stripPunctuation(entry.en);
      const lowercased = clean.toLowerCase();
      const ar = entry.ar?.trim();

      if (
        clean.length < MIN_TARGET_WORD_LENGTH ||
        !ar ||
        !/^[A-Za-z']+$/.test(clean) ||
        STOPWORDS.has(lowercased) ||
        // Mid-sentence and sentence-initial capitals are almost always
        // character names or places in this content — not the kind of
        // reusable "everyday vocabulary" this feature is for.
        /^[A-Z]/.test(clean)
      ) {
        return;
      }

      const stem = naiveStem(lowercased);
      const occurrence: WordOccurrence = { sentenceId: sentence.id, wordIndex, en: clean, ar };
      const existing = groups.get(stem);
      if (existing) {
        existing.occurrences.push(occurrence);
      } else {
        groups.set(stem, { representative: occurrence, occurrences: [occurrence] });
      }
    });
  }

  // Phase 2: local concentration — for each sentence, how many *distinct*
  // eligible stems it contains (used as a weak per-candidate signal below).
  const distinctStemsBySentence = new Map<string, Set<string>>();
  for (const [stem, group] of groups) {
    for (const occurrence of group.occurrences) {
      const set = distinctStemsBySentence.get(occurrence.sentenceId) ?? new Set<string>();
      set.add(stem);
      distinctStemsBySentence.set(occurrence.sentenceId, set);
    }
  }

  // Phase 3: score every group.
  const scored: VocabularyCandidate[] = [];
  for (const group of groups.values()) {
    const { representative, occurrences } = group;
    const sentenceCoverage = new Set(occurrences.map((o) => o.sentenceId)).size;
    const stem = naiveStem(representative.en.toLowerCase());
    const concentration = (distinctStemsBySentence.get(representative.sentenceId)?.size ?? 1) - 1;
    const isTitleMatch = titleStems.has(stem);

    const score = scoreCandidate(
      representative.en,
      difficulty,
      band,
      occurrences.length,
      sentenceCoverage,
      concentration,
      isTitleMatch,
    );

    if (score < MIN_ACCEPTABLE_SCORE) continue;

    scored.push({
      representative,
      occurrences,
      score,
      shape: classifyWordShape(representative.en),
    });
  }

  // Phase 4: stable sort by score, story-order tiebreak (Map/array
  // insertion order above is already first-encounter order).
  scored.sort((a, b) => b.score - a.score);

  // Phase 5: greedy top-N selection with a soft same-shape diversity nudge
  // — never excludes a candidate, only reorders near-ties (see
  // classifyWordShape's doc comment).
  const selected: VocabularyCandidate[] = [];
  const remaining = [...scored];
  const shapeCounts = new Map<string, number>();

  while (selected.length < MAX_VOCABULARY_ITEMS && remaining.length > 0) {
    let bestIndex = 0;
    let bestEffectiveScore = -Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const candidate = remaining[i]!;
      const alreadyPicked = shapeCounts.get(candidate.shape) ?? 0;
      const penalty = alreadyPicked >= DIVERSITY_THRESHOLD ? DIVERSITY_PENALTY : 0;
      const effective = candidate.score - penalty;
      if (effective > bestEffectiveScore) {
        bestEffectiveScore = effective;
        bestIndex = i;
      }
    }
    const winner = remaining.splice(bestIndex, 1)[0]!;
    selected.push(winner);
    shapeCounts.set(winner.shape, (shapeCounts.get(winner.shape) ?? 0) + 1);
  }

  return selected;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * The one function the rest of the app should call: builds both the
 * completion-recap list and the in-context sentence markers from a single
 * ranked selection, so they're guaranteed to agree — provably: the same
 * candidate's representative occurrence is the sole source for both the
 * recap entry and its in-context marker, so the two can never list
 * different words. `sentences` should be the story's full sentence list;
 * `title` is the story's own title (used only for the title-match
 * relevance signal — see extractTitleStems).
 *
 * Only the representative (first) occurrence of a selected word is marked
 * in-context — repetition still *scores* a word higher (see
 * scoreCandidate), it just doesn't multiply how many places it's
 * underlined, preserving the previous implementation's one-marker-per-word
 * in-context behavior exactly.
 */
export function buildStoryVocabulary<S extends Sentence>(
  sentences: S[],
  level: number,
  title: string,
): { vocabulary: VocabularyItem[]; sentences: S[] } {
  const candidates = selectTargetVocabulary(sentences, level, title);

  const vocabulary: VocabularyItem[] = candidates.map((c) => ({
    id: `${c.representative.sentenceId}-vocab-${c.representative.wordIndex}`,
    en: c.representative.en,
    ar: c.representative.ar,
  }));

  if (candidates.length === 0) return { vocabulary, sentences };

  const indicesBySentence = new Map<string, number[]>();
  for (const candidate of candidates) {
    const { sentenceId, wordIndex } = candidate.representative;
    const existing = indicesBySentence.get(sentenceId);
    if (existing) existing.push(wordIndex);
    else indicesBySentence.set(sentenceId, [wordIndex]);
  }

  const annotatedSentences = sentences.map((sentence) => {
    const indices = indicesBySentence.get(sentence.id);
    return indices
      ? { ...sentence, targetVocabularyIndices: indices.sort((a, b) => a - b) }
      : sentence;
  });

  return { vocabulary, sentences: annotatedSentences };
}

/**
 * Convenience wrapper around buildStoryVocabulary for callers that only
 * need the recap list (the stories-quality audit tool, the vocabulary
 * diagnostic report, and this module's own tests) — always prefer
 * buildStoryVocabulary in the actual content read path so the recap and
 * the in-context markers stay derived together.
 */
export function deriveStoryVocabulary(
  sentences: Pick<Sentence, "id" | "wordTranslations">[],
  level: number,
  title: string,
): VocabularyItem[] {
  return selectTargetVocabulary(sentences, level, title).map((c) => ({
    id: `${c.representative.sentenceId}-vocab-${c.representative.wordIndex}`,
    en: c.representative.en,
    ar: c.representative.ar,
  }));
}

/**
 * Applies buildStoryVocabulary to a full Lesson (the shape the local static
 * seed in src/data/lessons/stories.ts already uses) — the local-fallback
 * counterpart of the two call sites in
 * src/lib/supabase/queries/content.ts, so a story reads identically with or
 * without a linked Supabase project.
 */
export function withStoryVocabulary(lesson: Lesson): Lesson {
  const { vocabulary, sentences } = buildStoryVocabulary(
    lesson.sentences,
    lesson.level,
    lesson.title,
  );
  return { ...lesson, sentences, vocabulary };
}
