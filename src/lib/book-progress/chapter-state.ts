import type { BookSection } from "@/types/library";

/**
 * Per-section unlock state for the Book Overview's section list (sequential
 * chapter unlocking). Reuses the Book Learning Engine's existing linear
 * reading pointer — book_progress.current_section_id, surfaced as
 * BookProgressSummary.currentSectionId/isComplete (see
 * fetchBookProgressAction) — rather than introducing a second, parallel
 * per-section completion record: complete_book_sentence already only ever
 * advances current_section_id past a section once every sentence in it (and
 * every section before it) has been completed in order, so "has this reader
 * passed this section?" is fully answered by comparing order_index against
 * the pointer's section, with no new schema needed.
 */
export type ChapterState = "completed" | "available" | "locked";

export interface ChapterStateInfo {
  section: BookSection;
  state: ChapterState;
}

/**
 * Derives every section's state from `sections` (must be ordered by
 * orderIndex ascending — see fetchBookSections) and the reader's current
 * progress. Works identically for a 5-section or a 50-section book: the
 * only inputs are the sections' real order and where the reading pointer
 * currently sits, never a hardcoded section count or id.
 *
 * A never-started book has no book_progress row yet, but
 * fetchBookProgressAction already resolves that case to `currentSectionId`
 * pointing at the book's real first section (see BookProgressSummary's own
 * doc comment) — so "first section available, the rest locked" falls out of
 * the same comparison as every other state, no separate branch needed.
 *
 * If `currentSectionId` doesn't match any section in `sections` (a stale
 * pointer into a section an admin has since removed), this fails closed:
 * only the first section is treated as available, everything else stays
 * locked, rather than defaulting to "everything unlocked."
 */
export function deriveChapterStates(
  sections: BookSection[],
  progress: { currentSectionId: string | null; isComplete: boolean },
): ChapterStateInfo[] {
  if (sections.length === 0) return [];
  if (progress.isComplete) {
    return sections.map((section) => ({ section, state: "completed" as const }));
  }

  const pointerIndex = progress.currentSectionId
    ? sections.findIndex((section) => section.id === progress.currentSectionId)
    : -1;
  const activeIndex = pointerIndex === -1 ? 0 : pointerIndex;

  return sections.map((section, index) => ({
    section,
    state: index < activeIndex ? "completed" : index === activeIndex ? "available" : "locked",
  }));
}

/** Whether `sectionId` is currently reachable (completed or available, never locked) — the server-side gate for direct/deep navigation into a specific section. See BookReadingPage. */
export function isSectionUnlocked(
  sections: BookSection[],
  progress: { currentSectionId: string | null; isComplete: boolean },
  sectionId: string,
): boolean {
  const match = deriveChapterStates(sections, progress).find(
    (entry) => entry.section.id === sectionId,
  );
  return match !== undefined && match.state !== "locked";
}
