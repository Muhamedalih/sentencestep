import { isTrackableWord, normalizeMistakeWord } from "@/lib/mistakes/normalize";
import { isAutoSkipChar, tokenize } from "@/lib/typing";

/**
 * Pure grading for Dictation and From-memory: the learner types a whole
 * sentence, presses Enter, and gets a word-by-word verdict. Follows the
 * same rules the per-keystroke engine (src/lib/typing.ts) already applies —
 * case-insensitive, and punctuation/apostrophes are never required — so a
 * sentence that would have been accepted letter-by-letter is also accepted
 * here. Hyphens and dashes split words (a learner may type "well-known" or
 * "well known"); apostrophes and other punctuation are simply dropped
 * ("don't" and "dont" are the same).
 */

const WORD_SPLIT = /[\s\-–—]+/;

/** A single raw token reduced to its comparable form: lower-cased, with every auto-skip character (punctuation, apostrophes) removed. */
export function normalizeDictationToken(token: string): string {
  return Array.from(token.toLowerCase())
    .filter((char) => !isAutoSkipChar(char))
    .join("");
}

/** Raw whitespace/hyphen-separated tokens of a sentence that still contain something comparable after normalization — index-aligned with normalizeDictationWords(text). */
export function rawDictationTokens(text: string): string[] {
  return text
    .split(WORD_SPLIT)
    .filter((token) => token.length > 0 && normalizeDictationToken(token).length > 0);
}

export function normalizeDictationWords(text: string): string[] {
  return rawDictationTokens(text).map(normalizeDictationToken);
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  let previous = Array.from({ length: b.length + 1 }, (_unused, index) => index);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        (previous[j] ?? 0) + 1,
        (current[j - 1] ?? 0) + 1,
        (previous[j - 1] ?? 0) + cost,
      );
    }
    previous = current;
  }
  return previous[b.length] ?? 0;
}

/** correct = exact; close = a small typo (still counted mostly right, still a word worth reviewing); wrong = a different word; missing = never typed. */
export type DictationWordStatus = "correct" | "close" | "wrong" | "missing";

export interface DictationWord {
  /** The expected word, normalized. */
  target: string;
  /** The raw token from the original sentence this word came from (punctuation intact) — what the mistakes ledger records. */
  raw: string;
  /** What the learner typed in this slot, or null when they typed nothing for it. */
  typed: string | null;
  status: DictationWordStatus;
  /** Positions within `raw` (not within the normalized word) whose letter was wrong or absent — feeds Fix Your Mistakes' red-letter hint. */
  errorIndexes: number[];
}

export interface DictationTypedWord {
  text: string;
  status: "correct" | "wrong" | "extra";
  /** The expected word (normalized) this typed word was matched against, when it was paired with one — lets the feedback mark exactly which letters of `text` were wrong. Absent for extra words and exact matches. */
  against?: string;
}

export interface DictationResult {
  words: DictationWord[];
  typedWords: DictationTypedWord[];
  /** Letters credited as right / wrong, on the same scale a keystroke engine reports (used to fold this sentence into the lesson's accuracy). */
  correctChars: number;
  errorChars: number;
  /** True only when every word matched exactly and nothing extra was typed. */
  exact: boolean;
}

/** Maps positions within a normalized word back to positions within its raw token, skipping the punctuation the normalization removed. */
export function normalizedIndexesToRaw(raw: string, normalizedIndexes: number[]): number[] {
  const rawPositions: number[] = [];
  const chars = Array.from(raw);
  chars.forEach((char, index) => {
    if (!isAutoSkipChar(char)) rawPositions.push(index);
  });
  return normalizedIndexes
    .map((normalizedIndex) => rawPositions[normalizedIndex])
    .filter((value): value is number => value !== undefined);
}

/**
 * Positions in `target` that the learner's word didn't produce, taken from
 * an optimal edit-distance alignment — so one dropped letter marks that one
 * letter, not every letter after it the way a position-by-position compare
 * would. A word that was never typed (`typed` null) marks every position.
 */
function differingIndexes(target: string, typed: string | null): number[] {
  if (typed === null) return Array.from({ length: target.length }, (_unused, index) => index);
  const rows = target.length + 1;
  const cols = typed.length + 1;
  const table: number[][] = Array.from({ length: rows }, () => new Array<number>(cols).fill(0));
  for (let i = 0; i < rows; i++) table[i]![0] = i;
  for (let j = 0; j < cols; j++) table[0]![j] = j;
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = target[i - 1] === typed[j - 1] ? 0 : 1;
      table[i]![j] = Math.min(
        (table[i - 1]![j] ?? 0) + 1,
        (table[i]![j - 1] ?? 0) + 1,
        (table[i - 1]![j - 1] ?? 0) + cost,
      );
    }
  }
  const wrong: number[] = [];
  let i = target.length;
  let j = typed.length;
  while (i > 0) {
    if (j > 0 && target[i - 1] === typed[j - 1] && table[i]![j] === table[i - 1]![j - 1]) {
      i--;
      j--;
    } else if (j > 0 && table[i]![j] === (table[i - 1]![j - 1] ?? 0) + 1) {
      wrong.push(i - 1);
      i--;
      j--;
    } else if (table[i]![j] === (table[i - 1]![j] ?? 0) + 1) {
      wrong.push(i - 1);
      i--;
    } else {
      j--;
    }
  }
  return wrong.sort((a, b) => a - b);
}

/**
 * Positions in `word` that `against` doesn't produce — the letters of a typed
 * word to mark as wrong ("replie" against "reply" marks the "i" and the "e"),
 * or, called the other way round, the letters of the correct word the learner
 * missed. Same optimal alignment the mistakes ledger uses.
 */
export function wrongLetterPositions(word: string, against: string): number[] {
  return differingIndexes(word, against);
}

/** Longest-common-subsequence alignment of two word lists on exact equality; returns matched (targetIndex, typedIndex) pairs in order. */
function alignExact(target: string[], typed: string[]): [number, number][] {
  const rows = target.length + 1;
  const cols = typed.length + 1;
  const table: number[][] = Array.from({ length: rows }, () => new Array<number>(cols).fill(0));
  for (let i = target.length - 1; i >= 0; i--) {
    for (let j = typed.length - 1; j >= 0; j--) {
      table[i]![j] =
        target[i] === typed[j]
          ? (table[i + 1]![j + 1] ?? 0) + 1
          : Math.max(table[i + 1]![j] ?? 0, table[i]![j + 1] ?? 0);
    }
  }
  const pairs: [number, number][] = [];
  let i = 0;
  let j = 0;
  while (i < target.length && j < typed.length) {
    if (target[i] === typed[j]) {
      pairs.push([i, j]);
      i++;
      j++;
    } else if ((table[i + 1]![j] ?? 0) >= (table[i]![j + 1] ?? 0)) {
      i++;
    } else {
      j++;
    }
  }
  return pairs;
}

export function compareDictation(target: string, typed: string): DictationResult {
  const rawTokens = rawDictationTokens(target);
  const targetWords = rawTokens.map(normalizeDictationToken);
  const typedWords = normalizeDictationWords(typed);

  const words: DictationWord[] = targetWords.map((word, index) => ({
    target: word,
    raw: rawTokens[index] ?? word,
    typed: null,
    status: "missing",
    errorIndexes: [],
  }));
  const typedResults: DictationTypedWord[] = typedWords.map((text) => ({
    text,
    status: "extra",
  }));

  const matches = alignExact(targetWords, typedWords);
  const boundaries: [number, number][] = [...matches, [targetWords.length, typedWords.length]];

  let targetCursor = 0;
  let typedCursor = 0;
  for (const [matchTarget, matchTyped] of boundaries) {
    // The unmatched stretch before this match: pair up positionally as
    // substitutions; whatever is left over on either side is missing/extra.
    const targetGap = matchTarget - targetCursor;
    const typedGap = matchTyped - typedCursor;
    const paired = Math.min(targetGap, typedGap);
    for (let k = 0; k < paired; k++) {
      const wordIndex = targetCursor + k;
      const typedIndex = typedCursor + k;
      const expected = targetWords[wordIndex] ?? "";
      const got = typedWords[typedIndex] ?? "";
      const distance = levenshtein(expected, got);
      const isClose = distance <= Math.max(1, Math.ceil(expected.length / 3));
      const entry = words[wordIndex];
      if (entry) {
        entry.typed = got;
        entry.status = isClose ? "close" : "wrong";
        entry.errorIndexes = normalizedIndexesToRaw(entry.raw, differingIndexes(expected, got));
      }
      const typedEntry = typedResults[typedIndex];
      if (typedEntry) {
        typedEntry.status = "wrong";
        typedEntry.against = expected;
      }
    }
    for (let k = paired; k < targetGap; k++) {
      const entry = words[targetCursor + k];
      if (entry) {
        entry.errorIndexes = normalizedIndexesToRaw(
          entry.raw,
          differingIndexes(entry.target, null),
        );
      }
    }
    if (matchTarget < targetWords.length) {
      const entry = words[matchTarget];
      if (entry) {
        entry.typed = entry.target;
        entry.status = "correct";
      }
      const typedEntry = typedResults[matchTyped];
      if (typedEntry) typedEntry.status = "correct";
    }
    targetCursor = matchTarget + 1;
    typedCursor = matchTyped + 1;
  }

  let correctChars = 0;
  let errorChars = 0;
  for (const word of words) {
    if (word.status === "correct") {
      correctChars += word.target.length;
    } else if (word.status === "missing" || word.typed === null) {
      errorChars += word.target.length;
    } else {
      const wrong = Math.min(word.target.length, levenshtein(word.target, word.typed));
      errorChars += wrong;
      correctChars += word.target.length - wrong;
    }
  }
  for (const entry of typedResults) {
    if (entry.status === "extra") errorChars += entry.text.length;
  }

  const exact =
    words.every((word) => word.status === "correct") &&
    typedResults.every((entry) => entry.status === "correct");

  return { words, typedWords: typedResults, correctChars, errorChars, exact };
}

/** 0–1 share of letters that were right. 1 when nothing was graded, matching calculateAccuracy's "no data isn't failing". */
export function dictationAccuracy(
  result: Pick<DictationResult, "correctChars" | "errorChars">,
): number {
  const total = result.correctChars + result.errorChars;
  return total === 0 ? 1 : result.correctChars / total;
}

/** Words the learner got wrong or missed — what Fix Your Mistakes should hear about. "close" typos are included: a near-miss on a word is still a word to review. */
export function dictationMistakes(
  result: DictationResult,
): { word: string; errorIndexes: number[] }[] {
  return result.words
    .filter((word) => word.status !== "correct")
    .map((word) => ({ word: word.raw, errorIndexes: word.errorIndexes }));
}

/** One cell of the hidden sentence as it is drawn in place. */
export type DictationCell =
  /** A letter or digit the learner has to type. `char` is the real character (only ever used to size the slot and for the reveal animation), `typed` what they typed there so far, or null while it is still blank. */
  | { kind: "slot"; word: number; letter: number; char: string; typed: string | null }
  /** A letter typed past the end of its word. */
  | { kind: "extra"; typed: string }
  /** Punctuation, an apostrophe or a hyphen: shown as printed, never typed. */
  | { kind: "mark"; char: string };

export type DictationToken =
  | { kind: "space" }
  | {
      kind: "word";
      cells: DictationCell[];
      /** Index (into normalizeDictationWords) of the first graded word in this token — a hyphenated compound holds several — or null for a token with no letters at all. Also the blank a tap speaks. */
      firstWord: number | null;
    };

export interface DictationView {
  tokens: DictationToken[];
  /** Whole words typed past the last word of the sentence. */
  extraWords: string[];
  /** True while the learner is partway through a word (the text doesn't end in a space or hyphen). */
  typingWord: boolean;
  /** The next slot to fill, for the moving cursor; null when the sentence has no letters. Once every word is complete it rests on the last slot. */
  cursor: { word: number; letter: number } | null;
}

/** The letters of what has been typed so far, grouped by graded word: same splitting as grading (whitespace and hyphens separate words, punctuation is dropped) but case as typed. */
function typedLetterWords(typed: string): { words: string[]; open: boolean } {
  const pieces = typed.split(WORD_SPLIT);
  const words: string[] = [];
  let open = false;
  pieces.forEach((piece, index) => {
    const letters = Array.from(piece)
      .filter((char) => !isAutoSkipChar(char))
      .join("");
    if (letters.length > 0) words.push(letters);
    if (index === pieces.length - 1) open = letters.length > 0;
  });
  return { words, open };
}

/**
 * The hidden sentence laid out the way the typing view lays out the real one
 * (same tokens, same spaces), with a blank slot per letter and whatever the
 * learner has typed so far dropped into the slots of the word it belongs to.
 * Words are matched by position in the same way grading splits them, so the
 * picture follows the learner's own spacing: typing a hyphenated compound with
 * a space fills the same two blanks. Nothing here says whether a typed letter
 * is right — that only happens when the learner presses Enter. Pass an empty
 * `target` to get just an echo of what was typed (the admin option that hides
 * the blanks).
 */
export function dictationView(target: string, typed: string): DictationView {
  const { words: typedWords, open } = typedLetterWords(typed);
  const typedChars = typedWords.map((word) => Array.from(word));
  const slotCounts: number[] = [];
  const tokens: DictationToken[] = [];
  let word = 0;

  for (const token of tokenize(target)) {
    if (/^\s$/.test(token)) {
      tokens.push({ kind: "space" });
      continue;
    }

    const cells: DictationCell[] = [];
    let firstWord: number | null = null;
    let letters = 0;
    let lastSlot = -1;

    // Ends the current hyphen-separated piece: letters typed beyond its last
    // slot are shown right after it (before any trailing punctuation).
    const closePiece = () => {
      if (letters === 0) return;
      const overflow = (typedChars[word] ?? []).slice(letters);
      if (overflow.length > 0) {
        cells.splice(
          lastSlot + 1,
          0,
          ...overflow.map((char): DictationCell => ({ kind: "extra", typed: char })),
        );
      }
      slotCounts[word] = letters;
      word += 1;
      letters = 0;
      lastSlot = -1;
    };

    for (const char of Array.from(token)) {
      if (isAutoSkipChar(char)) {
        cells.push({ kind: "mark", char });
        if (/[-–—]/.test(char)) closePiece();
        continue;
      }
      if (firstWord === null) firstWord = word;
      cells.push({
        kind: "slot",
        word,
        letter: letters,
        char,
        typed: typedChars[word]?.[letters] ?? null,
      });
      lastSlot = cells.length - 1;
      letters += 1;
    }
    closePiece();
    tokens.push({ kind: "word", cells, firstWord });
  }

  let cursor: DictationView["cursor"] = null;
  if (word > 0) {
    const last = { word: word - 1, letter: (slotCounts[word - 1] ?? 1) - 1 };
    const cursorWord = open ? typedWords.length - 1 : typedWords.length;
    if (cursorWord >= word) {
      cursor = last;
    } else {
      const filled = typedChars[cursorWord]?.length ?? 0;
      if (filled < (slotCounts[cursorWord] ?? 0)) cursor = { word: cursorWord, letter: filled };
      else cursor = cursorWord + 1 < word ? { word: cursorWord + 1, letter: 0 } : last;
    }
  }

  return { tokens, extraWords: typedWords.slice(word), typingWord: open, cursor };
}

/**
 * For each graded word of the sentence — same order and count as the word
 * indexes in dictationView — the key of the lesson word it belongs to, or null
 * when there is no pronunciation for it (a bare dash or symbol). The keys are
 * exactly the ones the normal typing view uses for a word's audio
 * (normalizeMistakeWord of the whitespace-separated token), so tapping a blank
 * plays the same clip a word click does. A hyphenated word ("well-known") is
 * one word for audio but two graded words here, so both point at the whole
 * compound.
 */
export function dictationAudioWords(text: string): (string | null)[] {
  const keys: (string | null)[] = [];
  for (const token of text.split(/\s+/).filter((part) => part.length > 0)) {
    const key = isTrackableWord(token) ? normalizeMistakeWord(token) : null;
    for (let piece = 0; piece < rawDictationTokens(token).length; piece++) keys.push(key);
  }
  return keys;
}

/** First letter of every word, for From-memory's "hint" (a single word, or all of them). */
export function firstLetterHint(target: string): string {
  return normalizeDictationWords(target)
    .map((word) => `${word.charAt(0)}${"·".repeat(Math.max(0, word.length - 1))}`)
    .join(" ");
}
