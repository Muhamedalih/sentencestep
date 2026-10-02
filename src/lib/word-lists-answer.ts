/**
 * What counts as a right answer for a Word Lists blank.
 *
 * A word is stored with ONE spelling (the American one, usually), but a learner
 * can be perfectly right with another: the British spelling they were taught in
 * school (grey, neighbour, licence) or a plain synonym that fits the sentence
 * and the Arabic hint (flat for apartment, holiday for vacation). Those used to
 * be marked wrong, cost the learner the long missed-word screen and landed in
 * their weak words — the quickest way to lose their trust. A word may now list
 * `alternates` (vocabulary_words.accepted_answers); typing one settles the word
 * as correct and says "also correct", crediting the word exactly as the stored
 * spelling would.
 *
 * Pure and client-safe, shared by the typing engine and its tests.
 */

/**
 * The comparable form of an answer: lower-case, accents dropped (so "fiancé" and
 * "résumé" are the words they are), surrounding space ignored and inner runs of
 * space collapsed.
 */
export function normalizeAnswer(raw: string): string {
  return raw.normalize("NFD").replace(/\p{M}/gu, "").trim().toLowerCase().replace(/\s+/g, " ");
}

/** Every accepted answer, normalized and without repeats, the stored word first. */
export function acceptedAnswers(
  target: string,
  alternates?: readonly string[] | null,
): readonly string[] {
  const seen = new Set<string>();
  const answers: string[] = [];
  for (const raw of [target, ...(alternates ?? [])]) {
    const answer = normalizeAnswer(raw);
    if (answer.length === 0 || seen.has(answer)) continue;
    seen.add(answer);
    answers.push(answer);
  }
  return answers;
}

/** exact: the stored word. alternate: another accepted spelling or synonym. */
export type AnswerMatch = { kind: "exact" } | { kind: "alternate" };

export function matchAnswer(
  typed: string,
  target: string,
  alternates?: readonly string[] | null,
): AnswerMatch | null {
  const answer = normalizeAnswer(typed);
  if (answer.length === 0) return null;
  if (answer === normalizeAnswer(target)) return { kind: "exact" };
  return acceptedAnswers(target, alternates).includes(answer) ? { kind: "alternate" } : null;
}

/**
 * True while another accepted answer starts with what has been typed and is
 * longer — the learner may be half way through it ("colo" on the way to
 * "colour"), so the word must not settle on a shorter match yet. They finish it
 * (or press Enter) and it settles then.
 */
export function mayStillBeTypingLonger(
  typed: string,
  target: string,
  alternates?: readonly string[] | null,
): boolean {
  const answer = normalizeAnswer(typed);
  if (answer.length === 0) return false;
  return acceptedAnswers(target, alternates).some(
    (candidate) => candidate.length > answer.length && candidate.startsWith(answer),
  );
}

/** The longest accepted answer — the typing field's own length limit is measured from it. */
export function longestAnswerLength(target: string, alternates?: readonly string[] | null): number {
  return acceptedAnswers(target, alternates).reduce(
    (longest, answer) => Math.max(longest, answer.length),
    target.length,
  );
}

/** Longest alternate an admin can save, and how many a word may carry. */
export const MAX_ALTERNATE_LENGTH = 40;
export const MAX_ALTERNATES = 8;

/**
 * The pieces of an admin's comma-, semicolon- or line-separated list of
 * alternates, each tidied (trimmed, lower-cased, inner runs of space collapsed)
 * and the empty ones dropped. Shared by the validator, which names the pieces it
 * rejects, and parseAlternates, which keeps the ones it can store.
 */
export function splitAlternates(raw: string): string[] {
  return raw
    .split(/[,\n;]/)
    .map((piece) => piece.trim().toLowerCase().replace(/\s+/g, " "))
    .filter((piece) => piece.length > 0);
}

/** An alternate starts with a letter and holds only letters, spaces, hyphens and apostrophes. */
export function isAlternateShape(piece: string): boolean {
  return /^[\p{L}][\p{L} '-]*$/u.test(piece);
}

/**
 * Cleans an admin's list of alternates into what is stored: lower-cased, no
 * repeats, never the stored word itself, only plain words, bounded in length and
 * number. Anything that does not qualify is dropped here — the validator is what
 * tells the admin about it before they save.
 */
export function parseAlternates(raw: string, target: string): string[] {
  const seen = new Set<string>([normalizeAnswer(target)]);
  const alternates: string[] = [];
  for (const piece of splitAlternates(raw)) {
    if (piece.length > MAX_ALTERNATE_LENGTH || !isAlternateShape(piece)) continue;
    const key = normalizeAnswer(piece);
    if (seen.has(key)) continue;
    seen.add(key);
    alternates.push(piece);
    if (alternates.length >= MAX_ALTERNATES) break;
  }
  return alternates;
}
