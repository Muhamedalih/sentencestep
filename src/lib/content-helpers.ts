import { unitsByMode } from "@/data/units";
import { modeMeta } from "@/lib/learning-modes";
import { OPENING_LESSON_ID } from "@/lib/progress/starting-level";
import type { ContentStatus } from "@/lib/admin/validation";
import type { SupportLocale } from "@/lib/i18n/locales";
import type {
  Course,
  LearningMode,
  LessonUnit,
  PreviewSentence,
  Unit,
  VocabularyItem,
} from "@/types/content";

/**
 * Pure, synchronous helpers that only ever operate on an already-fetched
 * lesson list or static metadata — no Supabase/session access, so they're
 * safe to import from Client Components (see mode-progress-card.tsx,
 * lesson-list-view.tsx). Kept in their own module rather than src/lib/content.ts
 * because that file also pulls in the session-aware Supabase client (for
 * fetchLessonById's premium-access check), which Next.js won't let a Client
 * Component's bundle transitively depend on.
 */

/**
 * Whether a `lessons`/`word_groups` row with this status may ever be
 * returned to a learner. Draft and archived content is authoring/retired
 * state only — visible in the admin CMS (src/lib/admin/content-queries.ts,
 * which deliberately has no such filter), never through a learner-facing
 * fetch. Applied both as the actual `.eq("status", ...)` query filter and,
 * defensively, as a post-fetch `.filter()` in the same functions, so a
 * regression in the query itself doesn't silently leak retired content.
 */
export function isLearnerVisibleStatus(status: ContentStatus): boolean {
  return status === "published";
}

export function getUnits(mode: LearningMode): Unit[] {
  return unitsByMode[mode];
}

export function getCourse(mode: LearningMode): Course {
  const meta = modeMeta[mode];
  return { id: mode, title: meta.title, description: meta.description, units: getUnits(mode) };
}

export function filterFree(units: LessonUnit[]): LessonUnit[] {
  return units.filter((unit) => unit.isFree);
}

export function sentenceCount(units: LessonUnit[]): number {
  return units.reduce((total, unit) => total + unit.sentences.length, 0);
}

export function getLevels(units: LessonUnit[]): number[] {
  const levels = new Set(units.map((unit) => unit.level));
  return Array.from(levels).sort((a, b) => a - b);
}

export function getLessonsByLevel(units: LessonUnit[], level: number): LessonUnit[] {
  return units.filter((unit) => unit.level === level);
}

/**
 * The onboarding "First Steps" lesson exists as three near-identical rows —
 * onboarding-beginner/intermediate/advanced, one per starting-level tier
 * (see OPENING_LESSON_ID in starting-level.ts) — each reached directly by
 * the get-started flow's own routing, never by browsing the Daily Lessons
 * catalog. Left as plain published lessons, all three surface in this
 * catalog too: once per level section, wherever their order_index happens
 * to land them. This trims that down to what a learner browsing the catalog
 * should actually see: only the Beginner copy, pinned as the first card of
 * its level, since a learner placed into Intermediate/Advanced already met
 * "First Steps" during onboarding and doesn't need it repeated in every
 * level section (or buried at the end of Beginner's).
 */
export function withOpeningLessonPlacement<T extends { id: string; level: number }>(
  units: T[],
): T[] {
  const hidden = [OPENING_LESSON_ID.intermediate, OPENING_LESSON_ID.advanced] as string[];
  const visible = units.filter((unit) => !hidden.includes(unit.id));

  const openingIndex = visible.findIndex((unit) => unit.id === OPENING_LESSON_ID.beginner);
  if (openingIndex <= 0) return visible;

  const opening = visible[openingIndex]!;
  const rest = [...visible.slice(0, openingIndex), ...visible.slice(openingIndex + 1)];
  const firstOfLevel = rest.findIndex((unit) => unit.level === opening.level);
  if (firstOfLevel === -1) return [...rest, opening];
  return [...rest.slice(0, firstOfLevel), opening, ...rest.slice(firstOfLevel)];
}

/**
 * Sorted by level first, `order` only as the tiebreaker within a level — see
 * findCurrentLesson's doc comment (src/lib/progress/level.ts) for why `order`
 * alone isn't safe to sort a whole mode by: it's one sequence per mode, not
 * guaranteed to stay level-monotonic as content is added over time, so
 * sorting by it alone could hand back a "next lesson" from a lower level
 * than the one the learner is currently on.
 *
 * Generic over anything shaped like `{id, level, order}` — not just a full
 * Lesson — so a caller that only needs to know *which* lesson comes next
 * (e.g. to build a `/learn/{mode}/{id}` link) can pass a lightweight
 * id/level/order-only list instead of a full Lesson[] with every sentence
 * body loaded. See fetchLessonNav's doc comment for why that distinction
 * matters.
 */
export function findNextLesson<T extends { id: string; level: number; order: number }>(
  units: T[],
  currentId: string,
): T | undefined {
  const sorted = [...units].sort((a, b) => a.level - b.level || a.order - b.order);
  const index = sorted.findIndex((unit) => unit.id === currentId);
  if (index === -1) return undefined;
  return sorted[index + 1];
}

/**
 * The static src/data/units.ts previews (used for local/no-Supabase dev,
 * and as a per-level fallback whenever an admin hasn't authored one) have
 * no content_translations equivalent to resolve against — they're plain
 * {en,ar,es} triples (see PreviewSentence's doc comment). Backfills
 * `supportText` from the matching field for the active locale exactly like
 * resolveScalarField's fallback chain does everywhere else, so the
 * component never has to special-case "this one came from the static
 * fallback." Explicitly locale === "ar" / locale === "es" rather than an
 * ar-or-else ternary — a locale this function doesn't recognize correctly
 * falls through to undefined (the caller's own English fallback) instead of
 * silently returning another locale's text.
 */
export function withSupportTextFallback(
  previews: Record<number, PreviewSentence[]>,
  locale: SupportLocale | undefined,
): Record<number, PreviewSentence[]> {
  if (!locale) return previews;
  const result: Record<number, PreviewSentence[]> = {};
  for (const [level, sentences] of Object.entries(previews)) {
    result[Number(level)] = sentences.map((sentence) => {
      if (sentence.supportText !== undefined) return sentence;
      const fallback =
        locale === "ar"
          ? sentence.ar
          : locale === "es"
            ? sentence.es
            : locale === "tr"
              ? sentence.tr
              : undefined;
      return fallback !== undefined ? { ...sentence, supportText: fallback } : sentence;
    });
  }
  return result;
}

/**
 * Vocabulary recap text for the active locale (see lesson-completion.tsx):
 * the resolved content_translations value if present, else this item's own
 * same-locale field, else English. Explicitly locale === "ar" / "es" rather
 * than an ar-or-else ternary, so a locale this function doesn't recognize
 * falls through to English instead of silently showing another locale's
 * text.
 */
export function resolveVocabularySupportText(
  item: VocabularyItem,
  locale: SupportLocale | null,
): string {
  if (item.supportText !== undefined) return item.supportText;
  if (locale === "ar") return item.ar;
  if (locale === "es") return item.es ?? item.en;
  if (locale === "tr") return item.tr ?? item.en;
  return item.en;
}

/**
 * Level-section subtitle for the active locale (see home-level-section.tsx)
 * — same safe, locale-generic fallback shape as resolveVocabularySupportText:
 * an unrecognized locale gets the English title, never another locale's.
 */
export function resolveLevelSupportTitle(
  locale: SupportLocale | null,
  titleEs: string,
  titleAr: string,
  title: string,
  titleTr?: string,
): string {
  if (locale === "es") return titleEs;
  if (locale === "ar") return titleAr;
  if (locale === "tr") return titleTr ?? title;
  return title;
}
