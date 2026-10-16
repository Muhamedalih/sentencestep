/**
 * The order of the passages inside a level — what Admin → Passages lets an admin arrange and what
 * learners see: the list, the number on each card, "Up next" and the next-passage suggestion all
 * follow `passages.order_index`, which is unique per level. Pure, so the rules the admin action,
 * the insert script and the admin's JSON import share are tested without a database.
 */

export interface PassagePlace {
  id: string;
  order: number;
}

/** Why `requested` cannot be the new order of the passages a level holds now — or null when it can. */
export function reorderProblem(currentIds: readonly string[], requested: unknown): string | null {
  if (!Array.isArray(requested) || requested.some((id) => typeof id !== "string")) {
    return "That is not a list of passages.";
  }
  const ids = requested as string[];
  if (new Set(ids).size !== ids.length) return "A passage is listed twice.";
  const known = new Set(currentIds);
  if (ids.length !== known.size || ids.some((id) => !known.has(id))) {
    // A passage was added or deleted since the page was opened.
    return "The list changed while you were arranging it. It has been reloaded — try again.";
  }
  return null;
}

/**
 * Every passage of the level takes the number of its place in `requestedIds` (1, 2, 3 …), so the
 * numbers stay gap-free. Only the passages whose number actually changes are returned.
 */
export function planRenumbering(
  current: readonly PassagePlace[],
  requestedIds: readonly string[],
): { id: string; from: number; to: number }[] {
  const was = new Map(current.map((place) => [place.id, place.order]));
  const moves: { id: string; from: number; to: number }[] = [];
  requestedIds.forEach((id, index) => {
    const from = was.get(id);
    if (from !== undefined && from !== index + 1) moves.push({ id, from, to: index + 1 });
  });
  return moves;
}

/**
 * Where a passage that has just been added goes: the place its data asks for when that place is free
 * in its level, otherwise after the last — never on top of one an admin has arranged.
 */
export function positionForNewPassage(taken: Iterable<number>, wanted: number): number {
  const used = new Set(taken);
  if (Number.isInteger(wanted) && wanted > 0 && !used.has(wanted)) return wanted;
  return Math.max(0, ...used) + 1;
}

/** `ids` with the one at `index` moved `by` places (negative = earlier); the same list when it cannot move that far. */
export function movedBy(ids: readonly string[], index: number, by: number): string[] {
  const target = index + by;
  if (index < 0 || index >= ids.length || target < 0 || target >= ids.length) return [...ids];
  const next = [...ids];
  const [moved] = next.splice(index, 1);
  next.splice(target, 0, moved!);
  return next;
}
