/**
 * Text tools: caption lines become cues, cues become sentences ("units") the learner types, and long
 * sentences are cut only at places a speaker can pause. Punctuation is kept exactly; only typographic
 * variants are straightened (the typing screen shows punctuation but never asks for a key for it).
 */
import { bareWord, splitWords } from "./util.mjs";

const CONJUNCTIONS = new Set([
  "and",
  "but",
  "so",
  "because",
  "which",
  "who",
  "where",
  "when",
  "while",
  "if",
  "or",
  "then",
  "although",
  "though",
  "until",
]);

/** NBSP and odd spaces to a plain space, typographic quotes straightened, sound tags and music notes removed. */
export function normalizeText(input) {
  return String(input ?? "")
    .normalize("NFC")
    .replace(/[   -   　]/g, " ")
    .replace(/[​-‍⁠﻿]/g, "")
    .replace(/[‘’‚′`´]/g, "'")
    .replace(/[“”„″«»]/g, '"')
    .replace(/…/g, "...")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/[♪♫♬]/g, " ")
    .replace(/^\s*>>\s*/g, "")
    .replace(/^\s*[-–—]\s+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** A token with no letter or digit (a lone dash) would need a meaning of its own: glue it to the word before it. */
export function attachLonePunct(text) {
  const out = [];
  let pending = "";
  for (const token of splitWords(text)) {
    if (!/[\p{L}\p{N}]/u.test(token)) {
      if (out.length) out[out.length - 1] += token;
      else pending += token;
      continue;
    }
    out.push(pending + token);
    pending = "";
  }
  return out.join(" ");
}

/** Caption changes [[time, text]] (a blank text = the caption left the screen) to cues with start and end. */
export function capsToCues(caps) {
  const cues = [];
  for (let i = 0; i < caps.length; i++) {
    const [t, raw] = caps[i];
    const text = normalizeText(raw);
    if (!text) continue;
    const next = caps[i + 1] ? caps[i + 1][0] : null;
    const prev = cues[cues.length - 1];
    if (prev && prev.text === text) {
      prev.endSeconds = next;
      continue;
    }
    cues.push({ startSeconds: t, endSeconds: next, text });
  }
  return cues;
}

/** Words a sentence cannot end on, so a cut never goes after them ("... which is | where ..."). */
const NO_CUT_AFTER = new Set(
  "a an the of to in on at for with from by as is are was were be been am will would can could should may might must has have had do does did not no my your his her its our their this that these those which who whose than between both either neither into onto about over under through very more most some any every each all and or but so if because when while where".split(
    " ",
  ),
);
const NUMBER_WORDS = new Set(
  "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty thirty forty fifty sixty seventy eighty ninety hundred thousand million billion".split(
    " ",
  ),
);

/**
 * A cue that ends with no . ! ? and is followed by a cue that starts with a capital is a sentence the caption writer
 * left unfinished ("... from global warming | That's a lot."): the missing period is added and reported.
 */
export function repairCueEnds(cues) {
  const notes = [];
  const out = cues.map((cue, i) => {
    const next = cues[i + 1];
    if (!next) return cue;
    const closed = /[.!?]["')\]]*$/.test(cue.text) || /[,;:—–]$/.test(cue.text);
    const words = splitWords(cue.text);
    const last = bareWord(words[words.length - 1] ?? "");
    if (!closed && /^["'(]?[A-Z]/.test(next.text) && words.length >= 4 && !NO_CUT_AFTER.has(last)) {
      notes.push(`added "." after "...${cue.text.slice(-28)}" (next cue starts "${next.text.slice(0, 18)}")`);
      return { ...cue, text: `${cue.text}.` };
    }
    return cue;
  });
  return { cues: out, notes };
}

/** A cue that trails off with "..." and a next one that goes on in lower case are one sentence. */
export function mergeContinuations(cues) {
  const out = [];
  for (const cue of cues) {
    const prev = out[out.length - 1];
    if (prev && /(\.\.\.)$/.test(prev.text) && /^[a-z]/.test(cue.text)) {
      prev.text = `${prev.text.replace(/\s*\.\.\.$/, "")} ${cue.text}`;
      prev.endSeconds = cue.endSeconds;
    } else out.push({ ...cue });
  }
  return out;
}

/** Roll-up (automatic) captions repeat the line before: pop-on cues rarely do. Returns the share of cues that overlap the one before. */
export function rollUpShare(cues) {
  if (cues.length < 2) return 0;
  let overlap = 0;
  for (let i = 1; i < cues.length; i++) {
    const a = splitWords(cues[i - 1].text).slice(-3).join(" ").toLowerCase();
    if (a && cues[i].text.toLowerCase().includes(a)) overlap++;
  }
  return overlap / (cues.length - 1);
}

/** Syllables of an English word, counted from vowel groups (silent final e and -es/-ed handled): good to within one. */
export function syllables(word) {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return /[0-9]/.test(word) ? 1 : 0;
  let groups = (w.match(/[aeiouy]+/g) ?? []).length;
  if (groups > 1 && (/[^aeiouyl]e$/.test(w) || /[^aeiouytd]es$/.test(w) || /[^aeiouytd]ed$/.test(w))) groups--;
  return Math.max(1, groups);
}

/** Syllables per second `check` refuses (err*) and finds unusual (warn*), and the least speech it accepts in a sentence; `plan` judges with the same numbers. */
export const SPEECH_RATE = { errLow: 1.8, errHigh: 11, warnLow: 3, warnHigh: 8.5, minVoiced: 0.2 };

/** How long a text takes to say, in comparable units: its syllables plus a little for every word boundary. */
export function unitWeight(text) {
  const tokens = splitWords(text);
  return tokens.reduce((sum, w) => sum + syllables(w), 0) + 0.35 * tokens.length;
}

/**
 * Cuts a sentence longer than `maxWords` at a comma, semicolon, colon or dash, else before a conjunction,
 * choosing the most balanced cut that leaves at least `minPart` words on each side. A piece that still
 * cannot be cut is returned with `long: true`. `cut` is the kind of the boundary AFTER a piece.
 */
export function splitLong(text, { maxWords = 12, minPart = 3 } = {}) {
  const tokens = splitWords(text);
  if (tokens.length <= maxWords) return [{ text, cut: null }];
  let best = null;
  for (let k = minPart; k <= tokens.length - minPart; k++) {
    const left = tokens[k - 1];
    const right = tokens[k];
    const clause = /[,;:]$|[—–]$/.test(left);
    const conj = CONJUNCTIONS.has(bareWord(right));
    if (!clause && !conj) continue;
    const leftWord = bareWord(left);
    // Never leave a function word dangling at the end of a piece, and never cut a number range ("between one | and four").
    if (!clause && (NO_CUT_AFTER.has(leftWord) || NUMBER_WORDS.has(leftWord) || /^\d+$/.test(leftWord))) continue;
    if (!clause && /^(and|or|to)$/.test(bareWord(right)) && tokens.slice(Math.max(0, k - 5), k).some((t) => bareWord(t) === "between")) continue;
    const cost = (clause ? 0 : 4) + Math.abs(k - tokens.length / 2);
    if (!best || cost < best.cost) best = { k, kind: clause ? "clause" : "conj", cost };
  }
  if (!best) return [{ text, cut: null, long: true }];
  const left = splitLong(tokens.slice(0, best.k).join(" "), { maxWords, minPart });
  const right = splitLong(tokens.slice(best.k).join(" "), { maxWords, minPart });
  left[left.length - 1].cut = best.kind;
  return [...left, ...right];
}

/**
 * Cues -> units. Sentences are cut at . ! ? by the repo's own splitSentences (numbers, Mr., closing quotes
 * stay whole); a long sentence is cut by splitLong. Every unit carries `approx` [start, end] (its time spread
 * over the letters of the cue it sits in: a hint, never a measurement) and `exact` when it starts exactly at
 * a cue start, which is a reliable anchor for where its first sound is (captions lead the voice by 0.1-1.2 s).
 */
export function unitsFromCues(cues, splitSentences, { maxWords = 12 } = {}) {
  let joined = "";
  const cells = cues.map((cue, i) => {
    if (joined) joined += " ";
    const from = joined.length;
    joined += cue.text;
    const next = cues[i + 1]?.startSeconds ?? null;
    const end = cue.endSeconds ?? next ?? cue.startSeconds + cue.text.length * 0.065;
    return { from, to: joined.length, start: cue.startSeconds, end: Math.max(end, cue.startSeconds) };
  });
  const timeAt = (offset) => {
    const cell = cells.find((c) => offset <= c.to) ?? cells[cells.length - 1];
    if (!cell) return 0;
    const share = Math.min(1, Math.max(0, (offset - cell.from) / Math.max(1, cell.to - cell.from)));
    return cell.start + share * (cell.end - cell.start);
  };

  const units = [];
  for (const span of splitSentences(joined)) {
    const cell = cells.find((c) => span.start >= c.from && span.start < c.to) ?? cells[cells.length - 1];
    const exactStart = Boolean(cell) && span.start === cell.from;
    const a = timeAt(span.start);
    const b = timeAt(span.end);
    const text = attachLonePunct(normalizeText(span.text));
    if (!text) continue;
    const pieces = splitLong(text, { maxWords });
    const total = pieces.reduce((sum, p) => sum + unitWeight(p.text), 0) || 1;
    let used = 0;
    pieces.forEach((piece, k) => {
      const w = unitWeight(piece.text);
      const s = a + (used / total) * (b - a);
      used += w;
      const e = a + (used / total) * (b - a);
      units.push({
        en: piece.text,
        approx: [Math.round(s * 100) / 100, Math.round(e * 100) / 100],
        exact: exactStart && k === 0,
        cutAfter: k < pieces.length - 1 ? piece.cut : "sentence",
        long: Boolean(piece.long),
      });
    });
  }
  return units;
}

/** Problems that make a text hard or impossible to type from what is heard. */
export function typingProblems(text) {
  const problems = [];
  const odd = [...new Set((text.match(/[\p{L}\p{N}]/gu) ?? []).filter((c) => /[^\x00-\x7F]/.test(c)))];
  if (odd.length) problems.push(`letters a US keyboard cannot type: ${odd.join(" ")}`);
  if (/\d/.test(text)) problems.push("digits: spell numbers the way they are said (ninety percent)");
  if (/[%&$#@+=<>]/.test(text)) problems.push("a symbol that is said as a word (%, &, $...): write the word");
  if (/\s{2,}/.test(text) || text !== text.trim()) problems.push("extra spaces");
  if (/[ ]/.test(text)) problems.push("non-breaking space");
  if (/[()]/.test(text)) problems.push("parentheses (a sound tag?)");
  return problems;
}
