/**
 * The taste of the day (طعم اليوم): what a free learner gets once the free passages and stories are
 * finished. Each day one Premium passage and one Premium story, from the learner's own level, are open
 * to them for that day only. Pure: the same learner on the same day always gets the same two, with
 * nothing stored, and every candidate comes back only after the others have had their turn (the
 * order is shuffled per learner, then walked one day at a time).
 */

export interface TasteCandidate {
  id: string;
  /** A numeric level, lowest = easiest: a passage's place in A1…B2, a story's level. */
  level: number;
}

export interface TasteStep<Candidate extends TasteCandidate> {
  candidates: readonly Candidate[];
  /** The lowest level the learner's own level starts on; higher levels follow, lower ones never come up. */
  minLevel: number;
  /** Whether the step still has free content to offer. The taste only starts once it does not. */
  freeLeft: boolean;
}

/** FNV-1a, 32 bits: the hash the rollout buckets use, so the same text always gives the same number. */
export function tasteHash(text: string): number {
  let value = 0x811c9dc5;
  for (let index = 0; index < text.length; index++) {
    value ^= text.charCodeAt(index);
    value = Math.imul(value, 0x01000193);
  }
  return value >>> 0;
}

/** A small seeded generator (mulberry32): the same seed always gives the same sequence. */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** The day as a whole number of days since the Unix epoch, read from a calendar date (YYYY-MM-DD). */
export function dayNumber(todayISO: string): number {
  const [year = 1970, month = 1, day = 1] = todayISO.split("-").map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

/**
 * The taste item for one step of one day. Only candidates at the learner's level or above are
 * considered; among those, the lowest level that has any is used, so the taste sits at the learner's
 * own level whenever there is something there. When nothing is at or above that level, any level
 * is used rather than offering nothing. Null when there is no candidate at all.
 */
export function pickTaste<Candidate extends TasteCandidate>(
  candidates: readonly Candidate[],
  input: { userId: string; kind: "passage" | "story"; todayISO: string; minLevel: number },
): Candidate | null {
  if (candidates.length === 0) return null;
  const atOrAbove = candidates.filter((candidate) => candidate.level >= input.minLevel);
  const pool = atOrAbove.length > 0 ? atOrAbove : candidates;
  const lowest = Math.min(...pool.map((candidate) => candidate.level));
  const group = pool
    .filter((candidate) => candidate.level === lowest)
    .sort((a, b) => a.id.localeCompare(b.id));
  const random = seededRandom(tasteHash(`${input.userId}:taste:${input.kind}`));
  const order = [...group];
  for (let index = order.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    [order[index], order[swap]] = [order[swap]!, order[index]!];
  }
  return order[dayNumber(input.todayISO) % order.length] ?? null;
}

/**
 * Today's taste for both steps. A step gets its taste only when its free content is finished
 * (`freeLeft` false); a step with free content left keeps its free item, and the other step can
 * already be on its taste.
 */
export function todayTaste<Passage extends TasteCandidate, Story extends TasteCandidate>(input: {
  userId: string;
  todayISO: string;
  passages: TasteStep<Passage>;
  stories: TasteStep<Story>;
}): { passage: Passage | null; story: Story | null } {
  const { userId, todayISO } = input;
  return {
    passage: input.passages.freeLeft
      ? null
      : pickTaste(input.passages.candidates, {
          userId,
          kind: "passage",
          todayISO,
          minLevel: input.passages.minLevel,
        }),
    story: input.stories.freeLeft
      ? null
      : pickTaste(input.stories.candidates, {
          userId,
          kind: "story",
          todayISO,
          minLevel: input.stories.minLevel,
        }),
  };
}
