/**
 * Who can open a passage. A free passage opens for everybody the section is open
 * to; a Premium one (passages.is_free = false, chosen in Admin -> Passages) only
 * for a subscriber or an admin, or for a free learner on the day it is their taste of the day
 * (see lib/hybrid/picks.ts). One rule, so the list, the reader and Home can't
 * disagree about it.
 */
export function canOpenPassage(
  passage: { id?: string; isFree: boolean },
  canOpenPremium: boolean,
  openTodayId: string | null = null,
): boolean {
  return passage.isFree || canOpenPremium || passage.id === openTodayId;
}

/** The passages this viewer can open — what "Up next" and Home's card are chosen from, so neither ever points a free learner at a lock. */
export function openablePassages<T extends { id?: string; isFree: boolean }>(
  passages: readonly T[],
  canOpenPremium: boolean,
  openTodayId: string | null = null,
): T[] {
  return passages.filter((passage) => canOpenPassage(passage, canOpenPremium, openTodayId));
}
