/**
 * Today's scene (permission dailyScene): the day is built around ONE passage. The learner listens to
 * it, then completes it from the ear (for each of its words, the sentence that holds the word), then
 * works with those same words. This is the pure part: which words, which lines, which part of each
 * line is typed, which words are written for the learner, and which lines the stage shows. Nothing
 * here reads or writes anything.
 */

import {
  applyDictationInput,
  dictationView,
  isDictationComplete,
  rawDictationTokens,
  type DictationView,
} from "@/lib/features/dictation";
import { normalizeMistakeWord } from "@/lib/mistakes/normalize";
import { containsWholeWord, splitAroundWord } from "@/lib/passages/text";
import type { Passage, PassageProgress } from "@/lib/passages/types";
import { isImportantWord } from "@/lib/today/important-words";
import { isAutoSkipChar } from "@/lib/typing";
import type { SessionReviewWord } from "@/lib/today/session-words";
import { definitionOf, meaningChoices, termOf } from "@/lib/word-ladder/options";
import type { LadderWord } from "@/lib/word-ladder/types";
import { BLANK_TOKEN } from "@/types/word-lists";

/** The most words (and so the most typed lines) a scene has. */
export const SCENE_WORDS = 5;
/** With fewer usable words than this the passage makes no scene, and the day keeps its usual tasks. */
export const SCENE_MIN_WORDS = 3;
/** A sentence longer than this is typed in part: a run of it around the day's word. */
export const SCENE_MAX_TYPED_WORDS = 14;
/** How many words that run has when the sentence gives no better place to cut. */
const SCENE_WINDOW_WORDS = 10;
/** The shortest part a long sentence is cut to, when its clauses allow a longer one. */
const SCENE_MIN_CLAUSE_WORDS = 4;
/** About how long the words step takes: three moves for each word. */
export const SCENE_WORDS_MINUTES = 3;

export interface SceneWord {
  /** The passage word's id (its Word Lists row). */
  id: string;
  word: string;
  hintAr: string;
  /** The recorded clip of the word. */
  audioUrl: string;
}

export interface SceneLine {
  id: string;
  /** Position of the line in the whole passage, from 0. */
  index: number;
  speaker: string | null;
  en: string;
  ar: string;
  audioUrl: string | null;
}

/** One typed line of the scene. `before + typed + after` is exactly the line. */
export interface SceneStep {
  line: SceneLine;
  /** Shown with the line, never typed. */
  before: string;
  /** Typed from the ear: it holds the day's word. */
  typed: string;
  after: string;
  /** The day's words this line holds (nearly always one). */
  words: SceneWord[];
}

export interface Scene {
  lines: SceneLine[];
  /** In the passage's own order. */
  steps: SceneStep[];
  /** Every word of the scene, in the order of the lines. */
  words: SceneWord[];
}

const ABBREVIATION = /(?:^|\s)(?:mr|mrs|ms|dr|st|prof|mt|jr|sr|vs)\.$/i;
/** The end of a sentence: its stop, any closing quote or bracket, then a gap before a capital or a digit. */
const SENTENCE_END = /[.!?…]+["'”’)\]]*(\s+)(?=["'“‘(\[]?[\p{Lu}\p{N}])/gu;

/** Where each sentence of a line starts and ends (the gap between two sentences belongs to neither). */
export function sentenceSpans(line: string): [number, number][] {
  const spans: [number, number][] = [];
  let start = 0;
  for (const match of line.matchAll(SENTENCE_END)) {
    const gap = match[1]?.length ?? 0;
    const end = match.index + match[0].length - gap;
    if (ABBREVIATION.test(line.slice(start, end))) continue;
    spans.push([start, end]);
    start = end + gap;
  }
  spans.push([start, line.length]);
  return spans;
}

interface Token {
  start: number;
  end: number;
  text: string;
}

/** The words of a stretch of text with where each stands. A piece with no letter or digit (a lone dash) is not a word. */
function tokensOf(text: string, offset: number): Token[] {
  const tokens: Token[] = [];
  for (const match of text.matchAll(/\S+/g)) {
    if (!/[\p{L}\p{N}]/u.test(match[0])) continue;
    tokens.push({
      start: offset + match.index,
      end: offset + match.index + match[0].length,
      text: match[0],
    });
  }
  return tokens;
}

/** The run of a long sentence that is typed: the clause holding the word, grown or cut to a fair length. */
function partOfLongSentence(
  line: string,
  from: number,
  to: number,
  word: string,
): [number, number] {
  const tokens = tokensOf(line.slice(from, to), from);
  const target = tokens.findIndex((token) => containsWholeWord(token.text, word));
  if (target < 0) return [from, to];

  // Clauses: a run of words up to a comma, semicolon, colon or dash.
  const clauses: [number, number][] = [];
  let first = 0;
  tokens.forEach((token, index) => {
    const breaks = /[,;:—–]["'”’)\]]*$/.test(token.text) || index === tokens.length - 1;
    if (!breaks) return;
    clauses.push([first, index]);
    first = index + 1;
  });
  const at = clauses.findIndex(([a, b]) => target >= a && target <= b);
  let [low, high] = clauses[at]!;
  const length = () => high - low + 1;

  if (length() <= SCENE_MAX_TYPED_WORDS) {
    let previous = at - 1;
    let next = at + 1;
    // Too short to be worth hearing out: take the clause after it, then the one before.
    while (length() < SCENE_MIN_CLAUSE_WORDS) {
      const after = clauses[next];
      const before = clauses[previous];
      if (after && after[1] - low + 1 <= SCENE_MAX_TYPED_WORDS) {
        high = after[1];
        next += 1;
      } else if (before && high - before[0] + 1 <= SCENE_MAX_TYPED_WORDS) {
        low = before[0];
        previous -= 1;
      } else {
        break;
      }
    }
  } else {
    [low, high] = runInside(tokens, low, high, target);
  }
  return [tokens[low]!.start, tokens[high]!.end];
}

/** Words a phrase can start at: a run is cut before one of them rather than in the middle of a phrase. */
const PHRASE_STARTS = new Set(
  (
    "and but so because who which that when while where if as although until after before " +
    "with to like for from"
  ).split(" "),
);

/**
 * A run of a clause too long to type whole: it starts at the clause's start or at a connecting word,
 * ends at the clause's end or just before one, holds the day's word, and is as near ten words as can
 * be (the clause's own end is preferred). With no such place, ten words around the day's word.
 */
function runInside(tokens: Token[], low: number, high: number, target: number): [number, number] {
  const connects = (index: number) =>
    PHRASE_STARTS.has((tokens[index]?.text ?? "").toLowerCase().replace(/[^\p{L}]/gu, ""));
  let best: { from: number; to: number; score: number } | null = null;
  for (let from = low; from <= target; from++) {
    if (from !== low && !connects(from)) continue;
    for (let to = target; to <= high; to++) {
      if (to !== high && !connects(to + 1)) continue;
      const length = to - from + 1;
      if (length < SCENE_MIN_CLAUSE_WORDS + 1 || length > SCENE_MAX_TYPED_WORDS) continue;
      const score = Math.abs(length - SCENE_WINDOW_WORDS) + (to === high ? 0 : 4);
      if (!best || score < best.score) best = { from, to, score };
    }
  }
  if (best) return [best.from, best.to];
  const half = Math.floor(SCENE_WINDOW_WORDS / 2);
  const from = Math.max(low, Math.min(target - half, high - SCENE_WINDOW_WORDS + 1));
  return [from, Math.min(high, from + SCENE_WINDOW_WORDS - 1)];
}

/**
 * What is typed of a line: the sentence that holds the word, or the run from the first to the last
 * sentence holding one of the words when there are two. A stretch too long to hold in the head is
 * cut to the part around the (first) word.
 */
export function typedSpan(line: string, words: readonly string[]): [number, number] {
  const spans = sentenceSpans(line);
  const sentenceOf = (word: string) =>
    spans.findIndex(([a, b]) => containsWholeWord(line.slice(a, b), word));
  const hits = words.map(sentenceOf).filter((index) => index >= 0);
  if (hits.length === 0) return [0, line.length];
  const from = spans[Math.min(...hits)]![0];
  const to = spans[Math.max(...hits)]![1];
  if (tokensOf(line.slice(from, to), from).length <= SCENE_MAX_TYPED_WORDS) return [from, to];

  const word = words.find((candidate) => sentenceOf(candidate) >= 0)!;
  const [a, b] = spans[sentenceOf(word)]!;
  if (tokensOf(line.slice(a, b), a).length <= SCENE_MAX_TYPED_WORDS) return [a, b];
  return partOfLongSentence(line, a, b, word);
}

/** Every line of the passage, in order, numbered. */
export function passageLines(passage: Pick<Passage, "sections">): SceneLine[] {
  return passage.sections
    .flatMap((section) => section.sentences)
    .map((sentence, index) => ({
      id: sentence.id,
      index,
      speaker: sentence.speaker,
      en: sentence.en,
      ar: sentence.ar,
      audioUrl: sentence.audioUrl,
    }));
}

/**
 * The scene of a passage, or null when it can't make one. A word counts when it is a content word with
 * a recorded clip and it stands in a line that has one too. Up to SCENE_WORDS of them are taken, one
 * line each where that is possible, in the passage's order.
 */
export function buildScene(passage: Pick<Passage, "sections" | "words">): Scene | null {
  const lines = passageLines(passage);
  const seen = new Set<string>();
  const candidates: { word: SceneWord; lines: number[] }[] = [];
  for (const entry of passage.words) {
    const key = normalizeMistakeWord(entry.word);
    if (!entry.audioUrl || !isImportantWord(entry.word) || seen.has(key)) continue;
    const found = lines
      .filter((line) => line.audioUrl && containsWholeWord(line.en, entry.word))
      .map((line) => line.index);
    if (found.length === 0) continue;
    seen.add(key);
    candidates.push({
      word: { id: entry.id, word: entry.word, hintAr: entry.hintAr, audioUrl: entry.audioUrl },
      lines: found,
    });
  }
  candidates.sort((a, b) => a.lines[0]! - b.lines[0]!);

  // First one word per line; then, if places are left, a second word on a line already used.
  const used = new Set<number>();
  const picked: { word: SceneWord; line: number }[] = [];
  const left: typeof candidates = [];
  for (const candidate of candidates) {
    const free = candidate.lines.find((index) => !used.has(index));
    if (picked.length < SCENE_WORDS && free !== undefined) {
      used.add(free);
      picked.push({ word: candidate.word, line: free });
    } else {
      left.push(candidate);
    }
  }
  for (const candidate of left) {
    if (picked.length >= SCENE_WORDS) break;
    picked.push({ word: candidate.word, line: candidate.lines[0]! });
  }
  if (picked.length < SCENE_MIN_WORDS) return null;

  const byLine = new Map<number, SceneWord[]>();
  for (const entry of picked) {
    byLine.set(entry.line, [...(byLine.get(entry.line) ?? []), entry.word]);
  }
  const steps: SceneStep[] = [...byLine.entries()]
    .sort(([a], [b]) => a - b)
    .map(([index, words]) => {
      const line = lines[index]!;
      const [from, to] = typedSpan(
        line.en,
        words.map((word) => word.word),
      );
      return {
        line,
        before: line.en.slice(0, from),
        typed: line.en.slice(from, to),
        after: line.en.slice(to),
        words,
      };
    });
  return { lines, steps, words: steps.flatMap((step) => step.words) };
}

/**
 * Which passage the day's scene is: the first one finished today (so reading a second passage later
 * does not move the day to it), else the one open next.
 */
export function sceneDayPassageId(args: {
  progress: readonly Pick<PassageProgress, "passageId" | "completedAt">[];
  todayISO: string;
  dayOf: (iso: string) => string;
  /** Whether a passage is still in the list (a retired one never anchors the day). */
  known: (passageId: string) => boolean;
  next: string | null;
}): string | null {
  const first = args.progress
    .filter(
      (entry) =>
        entry.completedAt !== null &&
        args.dayOf(entry.completedAt) === args.todayISO &&
        args.known(entry.passageId),
    )
    .sort((a, b) => a.completedAt!.localeCompare(b.completedAt!))[0];
  return first?.passageId ?? args.next;
}

/** About how long typing the scene's lines takes at this speed: the typing itself plus hearing each line. */
export function sceneLinesMinutes(scene: Scene, wpm: number): number {
  const words = scene.steps.reduce((sum, step) => sum + tokensOf(step.typed, 0).length, 0);
  const seconds = (words / Math.max(wpm, 1)) * 60 + scene.steps.length * 8;
  return Math.max(2, Math.ceil(seconds / 60));
}

/** One word of the words step: what its moves show, and its line with the word blanked for the last one. */
export interface SceneWordCard {
  word: LadderWord;
  blanked: string;
}

/** The line of the scene a word is typed in. */
function lineOf(scene: Scene, wordId: string): SceneLine {
  return scene.steps.find((step) => step.words.some((word) => word.id === wordId))!.line;
}

/**
 * The words step of a scene: each word with its meaning (and the other words' meanings to choose it
 * from), its line and its clip, in the order of the lines.
 */
export function sceneWordCards(passageId: string, scene: Scene): SceneWordCard[] {
  const pool = scene.words.map((word) => ({ id: word.id, term: termOf(word.hintAr) }));
  return scene.words.map((word) => {
    const line = lineOf(scene, word.id).en;
    const parts = splitAroundWord(line, word.word);
    const term = termOf(word.hintAr);
    const typed = normalizeMistakeWord(word.word);
    return {
      word: {
        id: word.id,
        word: typed,
        term,
        definition: definitionOf(word.hintAr),
        sentence: line,
        meaningOptions: meaningChoices({ id: word.id, term }, pool, null, `${passageId}:${typed}`),
        spellingOptions: [],
        audioUrl: word.audioUrl,
      },
      blanked: parts ? `${parts[0]}${BLANK_TOKEN}${parts[2]}` : BLANK_TOKEN,
    };
  });
}

/**
 * The same words as review words, so each one finished is recorded where a passage's word of Today's
 * words step is (its Word Lists progress and, for a learner it is open to, the words bank).
 */
export function sceneReviewWords(
  passage: Pick<Passage, "id" | "title" | "wordGroupId">,
  scene: Scene,
): SessionReviewWord[] {
  return sceneWordCards(passage.id, scene).map((card, order) => {
    const word = scene.words[order]!;
    return {
      id: word.id,
      groupId: passage.wordGroupId ?? "",
      order,
      targetWord: card.word.word,
      sentence: card.blanked,
      hintAr: word.hintAr,
      supportHint: word.hintAr,
      reason: "review",
      lessonTitle: passage.title,
      fromToday: "passage",
      audioUrl: word.audioUrl,
      sessionSource: "wordList",
      bank: {
        source: "passage",
        lessonId: passage.id,
        lessonTitle: passage.title,
        ar: word.hintAr,
        homeSentence: card.word.sentence,
      },
    };
  });
}

/** How many lines above and below the current one the stage keeps. */
const STAGE_ABOVE = 3;
const STAGE_BELOW = 2;

export interface StageRow {
  line: SceneLine;
  /** Lines from the one being typed: 0 itself, below zero above it, above zero below it. */
  distance: number;
  /** `locked`: the line is still to be typed, or spells a word still to be typed, so it is not shown. */
  role: "current" | "done" | "context" | "locked";
  /** The typed line's step, for `current` and `done`. */
  step?: SceneStep;
}

/**
 * The lines the stage draws while step `current` is being typed: from a few above (and always the
 * last typed one, so it can slide up) to a couple below. A line still to be typed is NEVER shown, nor
 * is a line that spells a word still to be typed, so the stage cannot give an answer away.
 */
export function stageRows(scene: Scene, current: number): StageRow[] {
  const step = scene.steps[current];
  if (!step) return [];
  const at = step.line.index;
  const previous = scene.steps[current - 1]?.line.index ?? at;
  const from = Math.max(0, Math.min(at - STAGE_ABOVE, previous));
  const to = Math.min(scene.lines.length - 1, at + STAGE_BELOW);
  const stepOf = new Map(scene.steps.map((entry, index) => [entry.line.index, index]));
  const waiting = scene.steps.slice(current).flatMap((entry) => entry.words);
  const gives = (line: SceneLine) => waiting.some((word) => containsWholeWord(line.en, word.word));

  return scene.lines.slice(from, to + 1).map((line) => {
    const distance = line.index - at;
    const index = stepOf.get(line.index);
    if (index === current) return { line, distance, role: "current", step };
    if (index !== undefined) {
      return index < current
        ? { line, distance, role: "done", step: scene.steps[index]! }
        : { line, distance, role: "locked" };
    }
    return { line, distance, role: gives(line) ? "locked" : "context" };
  });
}

// --- What the learner does not have to type -------------------------------

/** Capitalized words that are still worth typing: they are English words a learner must spell. */
const TYPED_ANYWAY = new Set(
  (
    "I Monday Tuesday Wednesday Thursday Friday Saturday Sunday January February March April May June " +
    "July August September October November December English Arabic Spanish French German American " +
    "British Christmas Mom Dad Grandma Grandpa Mr Mrs Ms Dr Coach Aunt Uncle God OK"
  ).split(" "),
);

/** A token without the punctuation around it and without a possessive ending. */
export const bareWord = (token: string) =>
  token.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "").replace(/['’]s$/, "");

/**
 * The names of people and places of a passage: a speaker's name, or a word written with a capital in
 * the middle of a sentence, that never appears in the passage in lowercase and is not a day, a month,
 * a language or a family word. They are written for the learner on the stage: spelling "Millbrook" is
 * not what the day is for.
 */
export function passageNames(lines: readonly Pick<SceneLine, "en" | "speaker">[]): Set<string> {
  const lower = new Set<string>();
  const candidates = new Set<string>();
  for (const line of lines) {
    for (const word of line.en.match(/(?<![\p{L}'’])\p{Ll}[\p{L}'’]*/gu) ?? []) {
      lower.add(word.replace(/['’]s$/, ""));
    }
    for (const part of (line.speaker ?? "").split(/\s+/)) {
      const word = bareWord(part);
      if (/^\p{Lu}\p{Ll}+$/u.test(word)) candidates.add(word);
    }
    // A capital also opens a quotation, or follows a colon or a dash: such a word is not a sign.
    for (const [from, to] of sentenceSpans(line.en)) {
      for (const part of line.en.slice(from, to).split(/[:;!?…—–"“”()]+/)) {
        const tokens = part.split(/[\s-]+/).filter((token) => /[\p{L}\p{N}]/u.test(token));
        for (const token of tokens.slice(1)) {
          const word = bareWord(token);
          if (/^\p{Lu}\p{Ll}+$/u.test(word)) candidates.add(word);
        }
      }
    }
  }
  return new Set(
    [...candidates].filter((word) => !TYPED_ANYWAY.has(word) && !lower.has(word.toLowerCase())),
  );
}

/** Which graded words of a typed part (see dictationView) are names the learner does not type. */
export function nameWordIndexes(typed: string, names: ReadonlySet<string>): Set<number> {
  const indexes = rawDictationTokens(typed).flatMap((token, index) =>
    names.has(bareWord(token)) ? [index] : [],
  );
  return new Set(indexes);
}

/** Which graded words of a typed part are the day's own words. */
export function targetWordIndexes(typed: string, words: readonly SceneWord[]): Set<number> {
  const wanted = new Set(words.map((word) => normalizeMistakeWord(word.word)));
  const indexes = rawDictationTokens(typed).flatMap((token, index) =>
    wanted.has(bareWord(token).toLowerCase()) ? [index] : [],
  );
  return new Set(indexes);
}

/** The line as drawn: a given word stands written from the start, before the learner reaches it. */
export function showGiven(view: DictationView, given: ReadonlySet<number>): DictationView {
  if (given.size === 0) return view;
  return {
    ...view,
    tokens: view.tokens.map((token) =>
      token.kind === "space"
        ? token
        : {
            ...token,
            cells: token.cells.map((cell) =>
              cell.kind === "slot" && given.has(cell.word)
                ? { ...cell, typed: cell.typed ?? cell.char }
                : cell,
            ),
          },
    ),
  };
}

/** The answer with every given word that comes next written in (a word the learner began is left to them). */
export function fillGiven(typed: string, value: string, given: ReadonlySet<number>): string {
  const tokens = rawDictationTokens(typed);
  let filled = value;
  while (!isDictationComplete(typed, filled)) {
    const cursor = dictationView(typed, filled).cursor;
    if (!cursor || cursor.letter !== 0 || !given.has(cursor.word)) break;
    const letters = Array.from(tokens[cursor.word] ?? "")
      .filter((char) => !isAutoSkipChar(char))
      .join("");
    const next = applyDictationInput(typed, filled, filled + letters);
    if (next === filled) break;
    filled = next;
  }
  return filled;
}
