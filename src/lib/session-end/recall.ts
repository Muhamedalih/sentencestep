import type { FromMemoryItem } from "@/lib/features/from-memory";

/** How many sentences the recall round after a lesson asks back. */
export const RECALL_COUNT = 3;

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * The sentences the recall round asks: `count` of them spread evenly through the lesson (so the ones
 * typed first are asked too, not only the last few still fresh in the head), preferring sentences
 * of three words or more — "Hi!" is not worth a recall. Fewer come back when the lesson has fewer
 * askable sentences, and none when it has none.
 */
export function pickRecallItems(
  items: readonly FromMemoryItem[],
  count: number = RECALL_COUNT,
): FromMemoryItem[] {
  const meaningful = items.filter((item) => wordCount(item.sentence.en) >= 3);
  const pool = meaningful.length >= count ? meaningful : items;
  if (pool.length <= count) return [...pool];
  // The middle of each of `count` equal slices of the pool.
  return Array.from(
    { length: count },
    (_unused, slice) => pool[Math.floor(((2 * slice + 1) * pool.length) / (2 * count))]!,
  );
}
