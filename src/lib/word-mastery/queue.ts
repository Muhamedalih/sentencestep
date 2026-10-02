import type { ReviewWord } from "@/components/learning/word-review-session";
import { fetchAllVocabularyWordsFlat } from "@/lib/supabase/queries/word-lists";
import { fetchMasteryStates } from "@/lib/supabase/queries/word-mastery";
import type { SupportLocale } from "@/lib/i18n/locales";
import type { WeakWordItem, WeakWordReason } from "@/lib/weak-words/types";
import { getWordGroupById } from "@/lib/word-lists";
import {
  REVIEW_SESSION_WORDS,
  dueWordIds,
  summarizeGroupMastery,
} from "@/lib/word-mastery/schedule";
import type { MasteryState } from "@/lib/word-mastery/schedule";
import type { LibraryMastery } from "@/lib/word-mastery/types";
import type { GroupMastery } from "@/lib/word-mastery/schedule";
import type { WordGroupSummary } from "@/types/word-lists";

/**
 * Server-side assembly of what the "Smart word practice" screens read from the
 * schedule. Every read here is optional decoration on top of Word Lists: a
 * failure (the table missing on a project that has not applied the migration,
 * a network error) is logged and reads as "nothing scheduled yet", never as an
 * error page.
 */

/** The learner's mastery rows, or an empty map when they cannot be read. */
export async function readMasteryStates(userId: string): Promise<Map<string, MasteryState>> {
  try {
    return await fetchMasteryStates(userId);
  } catch (error) {
    console.error("[word-mastery] fetchMasteryStates failed", error);
    return new Map();
  }
}

/**
 * What the Word Lists library shows on each card, and the number behind its
 * review hero: every word due on the schedule plus every weak word, each once.
 * Only words in groups this learner can open are counted (a locked group's ids
 * are not visible to them).
 */
export function summarizeLibraryMastery(
  groups: readonly WordGroupSummary[],
  states: ReadonlyMap<string, MasteryState>,
  todayISO: string,
  weakWordIds: Iterable<string>,
): LibraryMastery {
  const byGroup: Record<string, GroupMastery> = {};
  const visible = new Set<string>();
  for (const group of groups) {
    byGroup[group.id] = summarizeGroupMastery(group.wordIds, states, todayISO);
    for (const id of group.wordIds) visible.add(id);
  }
  const waiting = new Set(dueWordIds(states, todayISO).filter((id) => visible.has(id)));
  for (const id of weakWordIds) waiting.add(id);
  return { byGroup, reviewCount: waiting.size };
}

export interface SmartReviewQueue {
  /** The words this visit asks, hydrated for the review screen. */
  words: ReviewWord[];
  /** Everything waiting for review (due words plus weak words), before the per-visit cap. */
  total: number;
}

interface Candidate {
  wordId: string;
  groupId: string;
  /** Lower asks first: 0 = due and still an unfixed mistake, 1 = due, 2 = weak but not due. */
  rank: 0 | 1 | 2;
  strength: number;
  dueOn: string;
  reason: WeakWordReason;
}

/**
 * The review queue for "Review All Words" when Smart word practice is on: the
 * words due on the learner's schedule plus the weak words from the mistakes
 * ledger, each word once, weakest and longest-overdue first, capped so a visit
 * stays bite-sized (the rest wait for the next one). A word the learner cannot
 * open any more (a locked group, content removed) is quietly dropped, like every
 * other review queue.
 */
export async function buildSmartReviewQueue({
  userId,
  locale,
  todayISO,
  weak,
}: {
  userId: string;
  locale: SupportLocale | null;
  todayISO: string;
  weak: readonly WeakWordItem[];
}): Promise<SmartReviewQueue> {
  const [states, flat] = await Promise.all([
    readMasteryStates(userId),
    fetchAllVocabularyWordsFlat().catch((error: unknown) => {
      console.error("[word-mastery] fetchAllVocabularyWordsFlat failed", error);
      return [];
    }),
  ]);
  const groupOf = new Map(flat.map((word) => [word.id, word.groupId]));

  const candidates = new Map<string, Candidate>();
  for (const id of dueWordIds(states, todayISO)) {
    const groupId = groupOf.get(id);
    const state = states.get(id);
    if (!groupId || !state) continue;
    candidates.set(id, {
      wordId: id,
      groupId,
      rank: 1,
      strength: state.strength,
      dueOn: state.dueOn,
      reason: "review",
    });
  }
  for (const item of weak) {
    const existing = candidates.get(item.wordId);
    if (existing) {
      existing.reason = item.reason;
      if (item.reason === "active") existing.rank = 0;
      continue;
    }
    const state = states.get(item.wordId);
    candidates.set(item.wordId, {
      wordId: item.wordId,
      groupId: item.groupId,
      rank: 2,
      strength: state?.strength ?? 0,
      dueOn: state?.dueOn ?? todayISO,
      reason: item.reason,
    });
  }

  const ordered = [...candidates.values()].sort(
    (a, b) =>
      a.rank - b.rank ||
      a.strength - b.strength ||
      (a.dueOn < b.dueOn ? -1 : a.dueOn > b.dueOn ? 1 : 0),
  );
  const chosen = ordered.slice(0, REVIEW_SESSION_WORDS);

  // One fetch per distinct group, not per word.
  const groupIds = [...new Set(chosen.map((candidate) => candidate.groupId))];
  const groups = await Promise.all(
    groupIds.map((id) => getWordGroupById(id, locale ?? undefined).catch(() => undefined)),
  );
  const groupById = new Map(
    groups.filter((group) => group !== undefined).map((group) => [group.id, group]),
  );

  const words: ReviewWord[] = [];
  for (const candidate of chosen) {
    const match = groupById.get(candidate.groupId)?.words.find((w) => w.id === candidate.wordId);
    if (match) words.push({ ...match, reason: candidate.reason });
  }
  return { words, total: candidates.size };
}
