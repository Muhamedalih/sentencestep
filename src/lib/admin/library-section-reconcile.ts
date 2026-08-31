// Pure, no I/O — the identity-preserving matching algorithm behind
// saveBookSection's sentence persistence (see persistSectionSentences in
// library-actions.ts for how this is actually written to the database).
// Split out specifically so the matching logic itself — the part that
// determines whether a reader's progress pointer survives a section save —
// can be unit tested without a live database, the same "pure logic module +
// thin I/O caller" split library-validation.ts already uses.

export interface ExistingSentenceRow {
  id: string;
  en: string;
}

export interface ReconciledSentenceRow {
  id: string;
  en: string;
}

export interface ReconcileResult {
  /** One row per newTexts entry, same order — the section's sentences after this save. */
  finalRows: ReconciledSentenceRow[];
  /** Existing ids with no surviving counterpart in newTexts — genuinely removed, safe to delete. */
  idsToDelete: string[];
}

/**
 * Matches each line of a freshly-submitted English sentence list to the
 * most defensible existing sentence row, preserving that row's id (and
 * therefore any reader's progress pointer into it) whenever a reasonable
 * candidate exists — see persistSectionSentences's doc comment for the full
 * reasoning. Three passes, in order:
 *
 *   1. Exact text match — a line whose text exactly matches an existing
 *      row's text keeps that row's id, wherever it moves to. Handles a pure
 *      reorder (same sentences, new order) with zero identity loss.
 *   2. Positional fallback — a line with no exact match is paired with
 *      whichever existing row is left over, in original relative order.
 *      Handles an in-place wording edit ("fix a typo in sentence 3") as an
 *      UPDATE to sentence 3's own row, not a delete-and-recreate.
 *   3. Fresh id — only once every existing row is matched or has no
 *      remaining counterpart (the list grew) does a line get a brand new,
 *      never-before-used id, following the existing `${sectionId}-s{n}`
 *      convention.
 *
 * Any existing row left unmatched after all three passes has genuinely been
 * removed from the section and is reported in idsToDelete — the one case
 * where a reader's pointer into it can legitimately go null, because the
 * content it pointed to no longer exists.
 */
export function reconcileSectionSentences(
  sectionId: string,
  existing: ExistingSentenceRow[],
  newTexts: string[],
): ReconcileResult {
  const usedIds = new Set<string>();

  // Pass 1: exact text match, first-available. A queue per distinct text
  // handles duplicate sentences within a section without over/under-matching.
  const queueByText = new Map<string, string[]>();
  for (const row of existing) {
    const queue = queueByText.get(row.en) ?? [];
    queue.push(row.id);
    queueByText.set(row.en, queue);
  }

  const finalIds: (string | null)[] = newTexts.map(() => null);
  for (let i = 0; i < newTexts.length; i++) {
    const queue = queueByText.get(newTexts[i]!);
    const candidate = queue?.shift();
    if (candidate) {
      finalIds[i] = candidate;
      usedIds.add(candidate);
    }
  }

  // Pass 2: positional fallback among whatever Pass 1 left unclaimed, in
  // original relative order.
  const unclaimed = existing.filter((row) => !usedIds.has(row.id));
  let unclaimedIndex = 0;
  for (let i = 0; i < newTexts.length; i++) {
    if (finalIds[i] !== null) continue;
    const candidate = unclaimed[unclaimedIndex];
    if (candidate) {
      finalIds[i] = candidate.id;
      usedIds.add(candidate.id);
      unclaimedIndex++;
    }
  }

  // Pass 3: brand new, never-before-used ids for any position still unmatched.
  const takenIds = new Set(existing.map((row) => row.id));
  let freshCounter = 1;
  for (let i = 0; i < newTexts.length; i++) {
    if (finalIds[i] !== null) continue;
    let candidateId: string;
    do {
      candidateId = `${sectionId}-s${freshCounter}`;
      freshCounter++;
    } while (takenIds.has(candidateId));
    takenIds.add(candidateId);
    finalIds[i] = candidateId;
  }

  const idsToDelete = existing.filter((row) => !usedIds.has(row.id)).map((row) => row.id);
  const finalRows = newTexts.map((en, i) => ({ id: finalIds[i]!, en }));

  return { finalRows, idsToDelete };
}
