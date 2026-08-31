"use server";

import { createClient } from "@/lib/supabase/server";
import { fetchWordProgress, upsertWordCompletion } from "@/lib/supabase/queries/word-progress";
import { getWordGroupById } from "@/lib/word-lists";
import { hasPremiumAccess } from "@/lib/billing/access";
import { isAdmin } from "@/lib/admin/access";
import { emptyWordProgressState } from "@/lib/word-progress/types";
import type { WordProgressState } from "@/lib/word-progress/types";

async function getAuthenticatedUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/** Reads the signed-in learner's word progress; an empty state for guests (whose progress lives in localStorage — see src/lib/word-progress/store.ts). */
export async function fetchWordProgressAction(): Promise<WordProgressState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return emptyWordProgressState;
  return { completedWordIds: await fetchWordProgress(userId) };
}

/**
 * Records a word as completed for the signed-in learner. Re-checks access
 * server-side against the same group the practice screen itself renders
 * from (getWordGroupById already applies the real premium-access RLS
 * boundary) before writing anything — same reasoning as
 * recordCompletionAction in src/lib/progress/actions.ts: a direct POST to
 * a Server Action must never trust that the caller only ever reaches this
 * through a page that already gated access. Includes the same isAdmin()
 * alternative-"yes" WordGroupPracticePage itself grants access through (see
 * that page's `canAccess`) — without it, an admin who can open and practice
 * a locked group could never actually save a completion from it, which is
 * exactly the bug recordCompletionAction's identical check already avoids
 * for lessons.
 */
export async function recordWordCompletionAction(
  groupId: string,
  wordId: string,
): Promise<WordProgressState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) throw new Error("Sign in to save progress.");

  const group = await getWordGroupById(groupId);
  if (!group) throw new Error("That word group doesn't exist.");
  if (!group.isFree && !(await Promise.all([hasPremiumAccess(), isAdmin()])).some(Boolean)) {
    throw new Error("You don't have access to that word group.");
  }
  if (!group.words.some((word) => word.id === wordId)) {
    throw new Error("That word doesn't belong to this group.");
  }

  await upsertWordCompletion(userId, wordId);
  return fetchWordProgressAction();
}
