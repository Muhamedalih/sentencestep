import { isTrackableWord, normalizeMistakeWord } from "@/lib/mistakes/normalize";
import { advanceAutoSkip, isAutoSkipChar, tokenize } from "@/lib/typing";

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

/** How many letters (or digits) each graded word of the sentence takes to type — same order and count as the word indexes in dictationView. */
export function dictationWordLengths(target: string): number[] {
  return rawDictationTokens(target).map(
    (token) => Array.from(token).filter((char) => !isAutoSkipChar(char)).length,
  );
}

const SEPARATOR = /[\s\-–—]/;

/** Adds one typed character to what is already there, enforcing the word boundaries the sentence dictates. */
function appendDictationChar(lengths: number[], value: string, char: string): string {
  if (SEPARATOR.test(char)) {
    // Moves on to the next word early; a separator with nothing before it does nothing.
    return value === "" || value.endsWith(" ") ? value : `${value} `;
  }
  if (isAutoSkipChar(char)) return value; // punctuation is never typed
  if (lengths.length === 0) return value + char; // nothing to count against

  const { words, open } = typedLetterWords(value);
  let word = open ? words.length - 1 : words.length;
  let typedLength = open ? Array.from(words[word] ?? "").length : 0;
  let next = value;
  if (word < lengths.length && typedLength >= (lengths[word] ?? 0)) {
    // The word is already full (the learner backspaced into it): this letter starts the next one.
    word += 1;
    typedLength = 0;
    next = `${value} `;
  }
  if (word >= lengths.length) return value; // the whole sentence is already typed
  next += char;
  typedLength += 1;
  // A full word moves on by itself, right or wrong — the learner never types the space.
  if (typedLength >= (lengths[word] ?? 0) && word + 1 < lengths.length) next += " ";
  return next;
}

/**
 * What the Dictation answer becomes when the learner's input changes from
 * `previous` to `next` — the system, not the learner, decides where words end:
 * a word that has received all its letters hands over to the next word at
 * once (even if a letter is wrong), so the learner never types the space and
 * can't type more letters than a word has; letters past the end of the
 * sentence are ignored; punctuation is dropped; a hyphen or space typed
 * early moves on to the next word. Only adding at the end and deleting from
 * the end are accepted (any other edit is ignored), and Backspace over the
 * automatic hand-over also takes the last letter of the word, so it never
 * needs a press that changes nothing. Pass an empty `target` to accept
 * everything (the admin option that hides the blanks).
 */
export function applyDictationInput(target: string, previous: string, next: string): string {
  if (next === previous) return previous;
  const lengths = dictationWordLengths(target);

  if (next.length < previous.length) {
    if (!previous.startsWith(next)) return previous;
    const { words, open } = typedLetterWords(next);
    const word = words.length - 1;
    const full =
      open &&
      word + 1 < lengths.length &&
      Array.from(words[word] ?? "").length >= (lengths[word] ?? 0);
    return full ? next.slice(0, -1) : next;
  }

  if (!next.startsWith(previous)) return previous;
  let value = previous;
  for (const char of Array.from(next.slice(previous.length))) {
    value = appendDictationChar(lengths, value, char);
  }
  return value;
}

/** The letters (and digits) of every graded word, as printed — what a letter-by-letter answer is checked against. */
function dictationWordLetters(target: string): string[][] {
  return rawDictationTokens(target).map((token) =>
    Array.from(token).filter((char) => !isAutoSkipChar(char)),
  );
}

/** The blank the next letter belongs to, or null once every word is complete. */
function nextBlank(letters: string[][], value: string): { word: number; letter: number } | null {
  const { words, open } = typedLetterWords(value);
  let word = open ? words.length - 1 : words.length;
  let letter = open ? Array.from(words[word] ?? "").length : 0;
  if (word < letters.length && letter >= (letters[word]?.length ?? 0)) {
    word += 1;
    letter = 0;
  }
  return word < letters.length ? { word, letter } : null;
}

/** True once every letter of the sentence has been typed (a sentence with no letters is never complete: there is nothing to type). */
export function isDictationComplete(target: string, value: string): boolean {
  const letters = dictationWordLetters(target);
  return letters.length > 0 && nextBlank(letters, value) === null;
}

/** How many letters (or digits) an answer holds. */
export function dictationLetterCount(value: string): number {
  return typedLetterWords(value).words.reduce((sum, word) => sum + Array.from(word).length, 0);
}

export interface StrictDictationInput {
  /** The answer after this input: the accepted letters, or unchanged when the keystroke was turned away. */
  value: string;
  /** The wrong character that was rejected (the first one, if several arrived at once), or null. */
  rejected: string | null;
  /** The blank the rejected character was aimed at: which graded word, and which letter of it. Null when nothing was rejected. */
  at: { word: number; letter: number } | null;
}

/**
 * What a letter-by-letter Dictation answer becomes when the learner's input
 * changes from `previous` to `next`. The same word-boundary rules as
 * applyDictationInput — a finished word hands over to the next one by itself,
 * punctuation is never typed, only the end of the answer can change — but every
 * letter is checked the moment it is typed, like the keystroke engine does for
 * the visible sentence: a wrong letter (case never matters) is turned away and
 * the answer stays as it was, so an answer only ever holds correct letters.
 * A space or hyphen typed in the middle of a word counts as a wrong letter
 * (the learner skipped ahead); one typed between words is the habitual space
 * the hand-over already supplied, and does nothing.
 */
export function applyStrictDictationInput(
  target: string,
  previous: string,
  next: string,
): StrictDictationInput {
  const unchanged: StrictDictationInput = { value: previous, rejected: null, at: null };
  if (next === previous) return unchanged;
  if (next.length < previous.length) {
    return { value: applyDictationInput(target, previous, next), rejected: null, at: null };
  }
  if (!next.startsWith(previous)) return unchanged;

  const letters = dictationWordLetters(target);
  const lengths = letters.map((word) => word.length);
  let value = previous;
  for (const char of Array.from(next.slice(previous.length))) {
    if (!SEPARATOR.test(char) && isAutoSkipChar(char)) continue; // punctuation is never typed
    const blank = nextBlank(letters, value);
    if (blank === null) break; // the whole sentence is already typed
    if (SEPARATOR.test(char)) {
      if (value === "" || value.endsWith(" ")) continue; // the hand-over already moved on
      return { value, rejected: char, at: blank };
    }
    const expected = letters[blank.word]?.[blank.letter] ?? "";
    if (char.toLowerCase() !== expected.toLowerCase()) {
      return { value, rejected: char, at: blank };
    }
    value = appendDictationChar(lengths, value, char);
  }
  return { value, rejected: null, at: null };
}

/**
 * The part of `target` an answer has covered, written the way the keystroke
 * engine's own buffer is (spaces and punctuation included, the space after a
 * finished word too) — what the normal typing view needs to carry on from
 * where a letter-by-letter answer stopped. Only meaningful for an answer made
 * of correct letters, which is all a letter-by-letter answer can hold.
 */
export function dictationTypedPrefix(target: string, value: string): string {
  let remaining = dictationLetterCount(value);
  if (remaining === 0) return advanceAutoSkip(target, "");
  let end = 0;
  for (let index = 0; index < target.length; index++) {
    const char = target.charAt(index);
    if (isAutoSkipChar(char) || /\s/.test(char)) continue;
    remaining -= 1;
    if (remaining === 0) {
      end = index + 1;
      break;
    }
  }
  if (remaining > 0) return target; // more letters than the sentence has: it is complete
  let prefix = advanceAutoSkip(target, target.slice(0, end));
  // A finished word has already handed over to the next one: the space after it
  // (and the punctuation that follows the space) is typed too.
  if (value.endsWith(" ")) {
    while (prefix.length < target.length && /\s/.test(target.charAt(prefix.length))) {
      prefix += target.charAt(prefix.length);
    }
    prefix = advanceAutoSkip(target, prefix);
  }
  return prefix;
}

/**
 * 1–3 stars for one letter-by-letter sentence, simple enough to show live: it
 * starts at three, every time the word is shown costs one, and every third
 * wrong letter costs one. Never below one. A slip or two is not a loss (they
 * show in the count of wrong letters, and keep the sentence from being
 * "Perfect"), so the stars in front of the learner never drop on a first typo.
 */
export function dictationStars(slips: number, helps: number): 1 | 2 | 3 {
  const lost = helps + Math.floor(slips / 3);
  return Math.max(1, 3 - lost) as 1 | 2 | 3;
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
