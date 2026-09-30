import { normalizeMistakeWord } from "@/lib/mistakes/normalize";

/**
 * Pure assembly of "today's session": several sources each offer candidate
 * words (in their own priority order); this picks which make the cut, in what
 * order, without duplicates. No I/O — the sources are read in
 * daily-session-service.ts.
 */

/**
 * Where a session word came from — decides which "you got it" action records
 * it (each source has its own schedule/ledger), see completeSessionWord.
 * Listed in priority order: an outstanding mistake is more urgent than a
 * scheduled review, which beats a merely-due recall/card, which beats
 * continuing a Word List.
 */
export const SESSION_SOURCES = [
  "mistake",
  "mistakeReview",
  "weak",
  "recall",
  "card",
  "wordList",
] as const;

export type SessionSource = (typeof SESSION_SOURCES)[number];

export interface SourceCandidates<T> {
  source: SessionSource;
  items: T[];
}

/**
 * Picks up to `size` words. Two passes so one busy source can't crowd out the
 * rest: first each source (in priority order) may contribute up to half the
 * session, then any remaining room is filled from what's left, again in
 * priority order. A word already picked from a higher-priority source is
 * skipped everywhere else (compared by its normalized text, since "Went"
 * from a mistake and "went" from a card are the same word to review once).
 * Output keeps priority order, so the most urgent words come first.
 */
export function assembleSession<T extends { targetWord: string }>(
  sources: readonly SourceCandidates<T>[],
  size: number,
): (T & { sessionSource: SessionSource })[] {
  if (size <= 0) return [];
  const seen = new Set<string>();
  const perSourceCap = Math.max(1, Math.ceil(size / 2));

  // Per-source lists with cross-source de-duplication applied up front, in
  // priority order, so a duplicate is always dropped from the LOWER source.
  const deduped = sources.map((entry) => {
    const kept: T[] = [];
    for (const item of entry.items) {
      const key = normalizeMistakeWord(item.targetWord);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      kept.push(item);
    }
    return { source: entry.source, items: kept };
  });

  const taken = deduped.map(() => 0);
  let total = 0;
  for (let pass = 0; pass < 2; pass++) {
    deduped.forEach((entry, index) => {
      const cap = pass === 0 ? perSourceCap : Number.POSITIVE_INFINITY;
      while (taken[index]! < entry.items.length && taken[index]! < cap && total < size) {
        taken[index]! += 1;
        total += 1;
      }
    });
  }

  return deduped.flatMap((entry, index) =>
    entry.items
      .slice(0, taken[index] ?? 0)
      .map((item) => ({ ...item, sessionSource: entry.source })),
  );
}

/** Rough minutes for the session, shown on the Home card ("about 4 minutes"): ~20 seconds a word, never less than a minute. */
export function estimateSessionMinutes(wordCount: number): number {
  return Math.max(1, Math.round((wordCount * 20) / 60));
}
