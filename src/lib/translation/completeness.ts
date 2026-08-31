export interface RequiredField {
  contentType: "lesson" | "sentence";
  contentId: string;
  field: "title" | "description" | "text";
}

/**
 * The actual set of translatable fields for one lesson, derived from its
 * real current content — never a hardcoded sentence count (a 9-sentence
 * normal lesson and a 12-sentence story are handled identically, and a
 * lesson without a description simply has one fewer required field, not a
 * "missing" one). See the architecture proposal's completeness formula.
 */
export function requiredTranslationFields(
  lesson: { id: string; description: string | null },
  sentenceIds: string[],
): RequiredField[] {
  return [
    { contentType: "lesson", contentId: lesson.id, field: "title" },
    ...(lesson.description
      ? [{ contentType: "lesson" as const, contentId: lesson.id, field: "description" as const }]
      : []),
    ...sentenceIds.map((id) => ({
      contentType: "sentence" as const,
      contentId: id,
      field: "text" as const,
    })),
  ];
}

export interface ExistingTranslationRow {
  contentType: string;
  contentId: string;
  field: string;
  status: "ai_generated" | "approved" | "failed";
  isStale: boolean;
}

export interface CompletenessSummary {
  total: number;
  approved: number;
  aiGenerated: number;
  failed: number;
  missing: number;
  /** Counted independently of status — an ai_generated draft can be stale too, not only an approved translation. */
  stale: number;
}

function keyFor(f: { contentType: string; contentId: string; field: string }): string {
  return `${f.contentType}:${f.contentId}:${f.field}`;
}

/**
 * Tallies exactly one lesson×locale's translation state from its required
 * fields and whatever content_translations rows actually exist — pure, no
 * database access, so the dashboard's per-row and per-page math is
 * testable without touching Supabase. Never stored: recomputed from
 * current rows every time the dashboard renders, per the explicit
 * "calculate, don't store completeness" instruction.
 */
export function summarizeCompleteness(
  required: RequiredField[],
  existing: ExistingTranslationRow[],
): CompletenessSummary {
  const byKey = new Map(existing.map((row) => [keyFor(row), row]));
  let approved = 0;
  let aiGenerated = 0;
  let failed = 0;
  let missing = 0;
  let stale = 0;

  for (const field of required) {
    const row = byKey.get(keyFor(field));
    if (!row) {
      missing += 1;
      continue;
    }
    if (row.status === "approved") approved += 1;
    else if (row.status === "ai_generated") aiGenerated += 1;
    else if (row.status === "failed") failed += 1;
    if (row.isStale) stale += 1;
  }

  return { total: required.length, approved, aiGenerated, failed, missing, stale };
}

export type DerivedTranslationState = "APPROVED" | "NEEDS_REVIEW" | "STALE" | "MISSING" | "FAILED";

/**
 * The single overall badge for a lesson×locale row — priority order
 * matters: a failed field always needs attention first, then a stale one
 * (a previously-good translation that's now suspect), then whether
 * everything required is fully approved, then whether nothing has been
 * attempted at all, and otherwise a partial state (some ai_generated
 * drafts exist, not yet all reviewed).
 */
export function deriveOverallState(summary: CompletenessSummary): DerivedTranslationState {
  if (summary.total === 0) return "APPROVED";
  if (summary.failed > 0) return "FAILED";
  if (summary.stale > 0) return "STALE";
  if (summary.approved === summary.total) return "APPROVED";
  if (summary.approved === 0 && summary.aiGenerated === 0) return "MISSING";
  return "NEEDS_REVIEW";
}
