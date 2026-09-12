"use server";

import { createClient } from "@/lib/supabase/server";
import { hasSupabaseAuthCookie } from "@/lib/supabase/has-session-cookie";
import { isBookProgressComplete } from "@/lib/book-progress/completion";
import { getLocale } from "@/lib/i18n/get-locale";
import { getStreakMilestone } from "@/lib/email/milestones";
import { isDailyGoalMet } from "@/lib/progress/daily-goal";
import { getLearnerLevel } from "@/lib/progress/learner-level";
import { todayLocalISODate, updateStreak } from "@/lib/progress/streak";
import { calculateLessonXp } from "@/lib/progress/xp";
import { DEFAULT_DAILY_GOAL, emptyProgressState } from "@/lib/progress/types";
import {
  fetchBookContentCounts,
  fetchBookSectionWithSentences,
  fetchFirstBookSection,
  fetchFirstSentenceRef,
  fetchSectionAfter,
} from "@/lib/supabase/queries/book-content";
import { completeBookSentence, fetchBookProgressRow } from "@/lib/supabase/queries/book-progress";
import {
  fetchDailyProgress,
  fetchStreak,
  fetchXp,
  incrementDailyProgress,
  incrementXp,
  upsertStreak,
} from "@/lib/supabase/queries/progress";
import type { BookSentenceCompletionResult } from "@/lib/book-progress/types";
import type { BookProgressSummary, BookSectionWithSentences } from "@/types/library";

async function getAuthenticatedUserId(): Promise<string | null> {
  // Same fast path as getCurrentUser (src/lib/supabase/auth.ts) — a guest
  // with no session cookie can never produce claims, so skip standing up a
  // client and calling getClaims() at all for that guaranteed-null case.
  if (!(await hasSupabaseAuthCookie())) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims.sub ?? null;
}

/**
 * This learner's real reading position for a book — always a full summary,
 * never null (see BookProgressSummary's doc comment in types/library.ts): a
 * never-started book resolves to "here's the first sentence," the same
 * shape every other case already has, so callers (Book Overview, the
 * reading page) never need a separate branch for "no progress yet." Guests
 * always resolve to "not started" — there is no server-side position to
 * read for them (see BookReadingSession's doc comment for why Continue
 * Reading has always been signed-in-only).
 *
 * isComplete is deliberately NOT `currentSentenceId === null` — see
 * isBookProgressComplete's own doc comment for why that alone can't
 * distinguish "the reader genuinely finished the book" from "an admin edit
 * (or content deletion) happened to null this reader's pointer." A pointer
 * nulled by a routine section edit (persistSectionSentences in
 * library-actions.ts keeps this to genuine content removal only, not saves
 * in general — see its own doc comment) no longer reads as completion: the
 * reader's completed count hasn't reached the book's current total, so
 * isComplete stays false and the reading page falls back to its "resume
 * position lost" branch instead of the wrong "book complete" one.
 *
 * `countsPromise` lets a caller that already needs this book's section/
 * sentence counts for its own purposes (the Home dashboard renders them
 * directly alongside this summary — see (dashboard)/page.tsx) hand over
 * that same in-flight request instead of this function firing its own,
 * identical `fetchBookContentCounts` query a second time. Every other
 * caller (Book Overview, the reading page) omits it and gets the exact
 * same behavior as before.
 *
 * Counts are only ever needed for the final totalSentenceCount/isComplete
 * fields below — nothing about which branch runs (userId, then row vs.
 * first-sentence) depends on them — so the counts fetch is kicked off
 * up front and only actually awaited at the end, letting it run fully
 * alongside the auth check + row/first-sentence lookup instead of that
 * chain waiting on it (or vice versa) first.
 */
export async function fetchBookProgressAction(
  bookId: string,
  countsPromise?: ReturnType<typeof fetchBookContentCounts>,
): Promise<BookProgressSummary> {
  const counts = countsPromise ?? fetchBookContentCounts(bookId);
  const userId = await getAuthenticatedUserId();

  if (userId) {
    const row = await fetchBookProgressRow(userId, bookId);
    if (row) {
      const { sentenceCount } = await counts;
      return {
        completedSentenceCount: row.completedSentenceCount,
        totalSentenceCount: sentenceCount,
        currentSectionId: row.currentSectionId,
        currentSentenceId: row.currentSentenceId,
        isComplete: isBookProgressComplete(row.completedSentenceCount, sentenceCount),
      };
    }
  }

  const [{ sentenceCount }, first] = await Promise.all([counts, fetchFirstSentenceRef(bookId)]);
  return {
    completedSentenceCount: 0,
    totalSentenceCount: sentenceCount,
    currentSectionId: first?.sectionId ?? null,
    currentSentenceId: first?.sentenceId ?? null,
    isComplete: false,
  };
}

/**
 * The section a reader should see right now, with its sentences — a null
 * sectionId means "the book's first section" (a fresh start). Used both for
 * the reading page's first render and, mid-session, to load whichever
 * section a completion just crossed into (see BookReadingSession) — the
 * reading experience never fetches more than one section's sentences at a
 * time (Section 26 of the spec: performance).
 */
export async function fetchSectionForReadingAction(
  bookId: string,
  sectionId: string | null,
): Promise<BookSectionWithSentences | null> {
  const locale = await getLocale();
  if (!sectionId) return fetchFirstBookSection(bookId, locale ?? undefined);
  return fetchBookSectionWithSentences(sectionId, locale ?? undefined);
}

/**
 * The section immediately after `afterOrderIndex`, with its sentences —
 * null when it was the book's last section (the reading session's cue to
 * show Book Completion instead). The one navigation step used to move the
 * reading UI forward, for guest and signed-in readers alike — see
 * fetchSectionAfter's own doc comment. Takes the current section's
 * order_index (not its id — see fetchSectionAfter's doc comment for why)
 * since the caller always already has it from the section it's currently on.
 *
 * Deliberately does NOT also pre-resolve the new section's first sentence's
 * audio (a 2026-09-11 attempt at exactly that was reverted the same day):
 * doing it here means the CLIENT's own await on this action — which drives
 * how long the "loadingNextSection" spinner stays up before the section-
 * complete card can even appear — pays for that extra work too, directly
 * lengthening the one delay reader feedback flagged as the worst ("catastrophic")
 * of all of them, in exchange for shortening a different, less noticeable one.
 * BookReadingSession now prefetches that first sentence's audio itself once
 * this resolves and the section-complete card is already showing (see its
 * own doc comment) — the learner reading that card and clicking Continue
 * gives it real background time to finish without this fetch ever blocking
 * on it.
 */
export async function fetchSectionAfterAction(
  bookId: string,
  afterOrderIndex: number,
): Promise<BookSectionWithSentences | null> {
  const locale = await getLocale();
  return fetchSectionAfter(bookId, afterOrderIndex, locale ?? undefined);
}

/**
 * Records one sentence completion for the signed-in learner, atomically
 * (see completeBookSentence/complete_book_sentence for the idempotency
 * guarantee — a duplicate/replayed call for the same sentence is a safe
 * no-op, never double-counted).
 *
 * XP is awarded exactly when this completion crosses a section boundary,
 * using the SAME calculateLessonXp formula lesson/story completion already
 * uses (Section 17 of the spec this implements: reuse the existing
 * completion/reward architecture, never a parallel Book XP system) — a book
 * section (title + a handful of sentences, "20 sections x 10 sentences" per
 * the spec's own example) is the closest existing analogue to "one lesson,"
 * so section-crossing is where XP is earned, not every individual sentence:
 * awarding a full lesson's XP per sentence would inflate a 200-sentence book
 * to roughly 10x a comparable lesson's total reward for the same amount of
 * English actually learned. isFirstCompletion is always passed true for
 * that award — the underlying RPC's compare-and-swap guarantees a given
 * section can only ever be crossed once per (user, book), so there's no
 * "recompleting a section" case to distinguish the way lessons (which CAN
 * be replayed) need to. Streak and daily-goal progress instead advance on
 * EVERY sentence, not just section boundaries — updateDailyProgress/
 * updateStreak are already exactly that granular ("sentences completed
 * today"), no adaptation needed.
 */
export async function recordBookSentenceCompletionAction(
  bookId: string,
  sectionId: string,
  sentenceId: string,
  sectionAccuracy: number,
): Promise<BookSentenceCompletionResult> {
  const userId = await getAuthenticatedUserId();
  if (!userId) throw new Error("Sign in to save progress.");

  const result = await completeBookSentence(bookId, sentenceId);

  if (!result.advanced) {
    // A duplicate/replayed request — the reader had already moved past this
    // sentence (see the RPC's compare-and-swap). Report the CURRENT real
    // state with no reward, rather than throwing: the caller only ever sees
    // this from a network retry, never as something to surface to a learner.
    const [xp, streak, dailyProgress] = await Promise.all([
      fetchXp(userId),
      fetchStreak(userId).then((streak) => streak ?? emptyProgressState.streak),
      fetchDailyProgress(userId, todayLocalISODate()),
    ]);
    return {
      completedSentenceCount: result.completedSentenceCount,
      currentSectionId: result.currentSectionId,
      currentSentenceId: result.currentSentenceId,
      sectionCompleted: false,
      bookCompleted: false,
      xpEarned: 0,
      xp,
      streak,
      dailyProgress,
      rewards: [],
    };
  }

  const sectionCompleted = result.currentSectionId !== sectionId;
  const bookCompleted = result.currentSentenceId === null;
  const todayISO = todayLocalISODate();

  // Streak is read up front (safe — see incrementXp/incrementDailyProgress's
  // own doc comments for why XP and daily progress are deliberately NOT
  // read this way). XP/daily-progress "before" values instead come back
  // from the atomic increments below, never a separate prior read.
  const beforeStreak = (await fetchStreak(userId)) ?? emptyProgressState.streak;

  const nextStreak = updateStreak(beforeStreak, todayISO);
  const streakJustMilestoned =
    nextStreak.currentStreak !== beforeStreak.currentStreak &&
    getStreakMilestone(nextStreak.currentStreak) !== null;

  // Every sentence advances daily progress (see this function's own doc
  // comment on why streak/daily-goal are per-sentence while XP is only
  // per-section) — always incremented, atomically, by exactly 1.
  const nextDailyProgress = await incrementDailyProgress(todayISO, 1, DEFAULT_DAILY_GOAL);
  const dailyGoalMetBefore = isDailyGoalMet({
    ...nextDailyProgress,
    sentencesCompleted: nextDailyProgress.sentencesCompleted - 1,
  });
  const dailyGoalJustMet = !dailyGoalMetBefore && isDailyGoalMet(nextDailyProgress);

  const xpEarned = sectionCompleted
    ? calculateLessonXp({
        accuracy: sectionAccuracy,
        isFirstCompletion: true,
        dailyGoalMet: dailyGoalJustMet,
      })
    : 0;
  // Only a section crossing ever earns XP (see this function's own doc
  // comment) — the far more common non-crossing sentence skips the
  // increment RPC entirely rather than calling it with a delta of 0, since
  // there is nothing to add and no "before" value a plain read can't give
  // just as correctly.
  const { previousXp: beforeXp, xp: nextXp } =
    xpEarned > 0
      ? await incrementXp(xpEarned)
      : await fetchXp(userId).then((xp) => ({ previousXp: xp, xp }));
  const levelBefore = getLearnerLevel(beforeXp).level.name;
  const levelAfter = getLearnerLevel(nextXp).level.name;

  const rewards: string[] = [];
  if (levelBefore !== levelAfter) rewards.push(`Level up: ${levelAfter}`);
  if (streakJustMilestoned) rewards.push(`${nextStreak.currentStreak} day streak`);
  if (dailyGoalJustMet) rewards.push("Daily goal reached");

  await upsertStreak(userId, {
    currentStreak: nextStreak.currentStreak,
    longestStreak: nextStreak.longestStreak,
    lastActiveDate: nextStreak.lastActiveDate as string,
  });

  return {
    completedSentenceCount: result.completedSentenceCount,
    currentSectionId: result.currentSectionId,
    currentSentenceId: result.currentSentenceId,
    sectionCompleted,
    bookCompleted,
    xpEarned,
    xp: nextXp,
    streak: nextStreak,
    dailyProgress: nextDailyProgress,
    rewards,
  };
}
