/**
 * Who can open a passage. A free passage opens for everybody the section is open
 * to; a Premium one (passages.is_free = false, chosen in Admin -> Passages) only
 * for a subscriber or an admin. One rule, so the list, the reader and Home can't
 * disagree about it.
 */
export function canOpenPassage(passage: { isFree: boolean }, canOpenPremium: boolean): boolean {
  return passage.isFree || canOpenPremium;
}

/** The passages this viewer can open — what "Up next" and Home's card are chosen from, so neither ever points a free learner at a lock. */
export function openablePassages<T extends { isFree: boolean }>(
  passages: readonly T[],
  canOpenPremium: boolean,
): T[] {
  return passages.filter((passage) => canOpenPassage(passage, canOpenPremium));
}
