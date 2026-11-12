import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import { readAllPages } from "@/lib/supabase/read-all-pages";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { isLearnerVisibleStatus } from "@/lib/content-helpers";
import {
  getContentTranslations,
  resolveScalarField,
  warnIfMissing,
} from "@/lib/i18n/content-translations";
import type { SupportLocale } from "@/lib/i18n/locales";
import type { Database } from "@/types/database";
import type { WordGroup, WordGroupSummary } from "@/types/word-lists";

/**
 * Word Lists content reads, matching the shape of the local seed in
 * src/data/word-lists. Only called once isSupabaseConfigured() is true —
 * see src/lib/word-lists.ts, the single place the rest of the app reads
 * word groups/words from.
 *
 * fetchWordGroupSummaries reads the groups AND their word ids with the
 * service-role client: word_groups rows themselves are fully public-readable
 * regardless of premium status (same as `lessons` — only the content
 * *inside* a premium group is gated), but the word ids and counts must not
 * depend on who is looking: vocabulary_words RLS hides a premium group's rows
 * entirely (ids included) from the anonymous client, so reading ids there
 * made a paying subscriber's progress on every premium group read as 0
 * whenever the sitewide free-for-all switch was off. Only ids and group ids
 * are read, never a gated column (target_word, sentences), so nothing a
 * locked group protects reaches the client.
 *
 * fetchWordGroupById fetches the actual words, so it needs the
 * session-aware client — exactly the same reasoning as fetchLessonById in
 * content.ts: the vocabulary_words RLS policy checks auth.uid() against a
 * real subscription, and the anonymous public client can never resolve to
 * a real subscriber, which would silently return zero words even for a
 * paying user.
 */

/** A word_groups row with the ids of its words embedded (PostgREST resource embedding over the group_id foreign key). */
type GroupWithWordIds = Database["public"]["Tables"]["word_groups"]["Row"] & {
  vocabulary_words: Array<{ id: string }> | null;
};

/**
 * Every published group, in one request, with the ids of its words embedded. The word ids and counts
 * are read with the service-role client for the reason in the doc comment above, and they used to
 * come from a read of the WHOLE vocabulary_words table: PostgREST answers at most 1,000 rows to a
 * request and says nothing when it cuts, and that table (every topic, the drafts and the hidden
 * passage lists) is past 1,000 rows once a few more topics are added, which would have shown a
 * published list with missing words and wrong progress. The 1,000 cap counts the GROUPS here, a few
 * dozen, never their words.
 */
export async function fetchWordGroupSummaries(locale?: SupportLocale): Promise<WordGroupSummary[]> {
  const { data, error } = await createServiceRoleClient()
    .from("word_groups")
    .select("*, vocabulary_words(id)")
    .eq("status", "published")
    .order("order_index");
  if (error) throw error;
  // Defensive double-check, see isLearnerVisibleStatus's doc comment.
  const groups = ((data ?? []) as unknown as GroupWithWordIds[]).filter((group) =>
    isLearnerVisibleStatus(group.status),
  );
  return summarizeGroups(groups, locale);
}

/**
 * The topics nobody has published yet (drafts), as summaries, so the library can show them to an
 * ADMIN and to nobody else: the public client cannot read a draft at all, so this uses the
 * service-role client, and its caller MUST have checked isAdmin() first. A passage's own word list
 * (id passage-..., a draft for good) stays out. Each summary is marked `draft`.
 */
export async function fetchDraftWordGroupSummaries(
  locale?: SupportLocale,
): Promise<WordGroupSummary[]> {
  const { data, error } = await createServiceRoleClient()
    .from("word_groups")
    .select("*, vocabulary_words(id)")
    .eq("status", "draft")
    .not("id", "like", "passage-%")
    .order("order_index");
  if (error) throw error;
  const drafts = await summarizeGroups((data ?? []) as unknown as GroupWithWordIds[], locale);
  return drafts.map((group) => ({ ...group, draft: true }));
}

async function summarizeGroups(
  groups: GroupWithWordIds[],
  locale?: SupportLocale,
): Promise<WordGroupSummary[]> {
  const translations = locale
    ? await getContentTranslations(
        "word_group",
        groups.map((group) => group.id),
        locale,
      )
    : undefined;

  return groups.map((group) => {
    const wordIds = (group.vocabulary_words ?? []).map((word) => word.id);
    const summary: WordGroupSummary = {
      id: group.id,
      level: group.level,
      order: group.order_index,
      title: group.title,
      titleAr: group.title_ar,
      description: group.description ?? undefined,
      descriptionAr: group.description_ar ?? undefined,
      isFree: group.is_free,
      // Both are every group's true figures whatever this viewer's access (service-role read): a
      // locked group is never misreported as empty, and a subscriber's progress on a premium group
      // counts its real words.
      wordCount: wordIds.length,
      wordIds,
      // Absent until 20250359000000_word_group_covers.sql is applied: no chosen picture.
      coverUrl: group.cover_url ?? null,
    };

    if (locale && translations) {
      const supportTitle = resolveScalarField(
        translations,
        group.id,
        "title",
        group.title_ar,
        locale,
      );
      warnIfMissing(supportTitle, "word_group", group.id, "title", locale);
      if (supportTitle !== undefined) summary.supportTitle = supportTitle;

      const supportDescription = resolveScalarField(
        translations,
        group.id,
        "description",
        group.description_ar,
        locale,
      );
      if (supportDescription !== undefined) summary.supportDescription = supportDescription;
    }

    return summary;
  });
}

export interface VocabularyWordFlatRow {
  id: string;
  groupId: string;
  targetWord: string;
}

/**
 * Every vocabulary word this session can see, across every group, in one
 * query — used only by fetchWeakWordsAction (src/lib/weak-words/actions.ts)
 * to match a learner's mistake words against Word Lists vocabulary by text.
 * The session-aware client (not the public one fetchWordGroupSummaries
 * uses) so RLS naturally limits target_word to groups this viewer can
 * actually see — a free learner's premium-group words are silently absent
 * here, the same "just doesn't come back" precedent fetchWordGroupById's
 * own RLS reasoning already relies on, so a mistake matching a
 * premium-only word simply never surfaces as a weak Word Lists item for
 * them. The whole catalog is small (a few hundred words across every
 * group) and doesn't grow per-user, so one unfiltered read here is cheaper
 * and simpler than a per-word lookup. cache()'d per request: Home's weak-word
 * card and its daily-session count both need this same catalog, and used to
 * each scan the whole table. Callers must treat the rows as read-only.
 */
export const fetchAllVocabularyWordsFlat = cache(async (): Promise<VocabularyWordFlatRow[]> => {
  const supabase = await createClient();
  // Page by page: an admin's session sees every row of the table (drafts and the hidden passage
  // lists too), and one request would be cut silently at 1,000 rows. See readAllPages.
  const data = await readAllPages((from, to) =>
    supabase
      .from("vocabulary_words")
      .select("id, group_id, target_word")
      .order("id")
      .range(from, to),
  );
  return data.map((row) => ({
    id: row.id,
    groupId: row.group_id,
    targetWord: row.target_word,
  }));
});

export async function fetchWordGroupById(
  groupId: string,
  locale?: SupportLocale,
): Promise<WordGroup | undefined> {
  const supabase = await createClient();

  const { data: group, error: groupError } = await supabase
    .from("word_groups")
    .select("*")
    .eq("id", groupId)
    .eq("status", "published")
    .maybeSingle();
  if (groupError) throw groupError;
  // Defensive double-check, see isLearnerVisibleStatus's doc comment.
  if (!group || !isLearnerVisibleStatus(group.status)) return undefined;

  const { data: words, error: wordsError } = await supabase
    .from("vocabulary_words")
    .select("*")
    .eq("group_id", groupId)
    .order("order_index");
  if (wordsError) throw wordsError;

  const wordIds = (words ?? []).map((w) => w.id);
  const [groupTranslations, wordTranslations] = locale
    ? await Promise.all([
        getContentTranslations("word_group", [group.id], locale),
        getContentTranslations("vocabulary_word", wordIds, locale),
      ])
    : [undefined, undefined];

  const result: WordGroup = {
    id: group.id,
    level: group.level,
    order: group.order_index,
    title: group.title,
    titleAr: group.title_ar,
    description: group.description ?? undefined,
    descriptionAr: group.description_ar ?? undefined,
    isFree: group.is_free,
    voiceId: group.voice_id ?? undefined,
    words: (words ?? []).map((w) => {
      const word = {
        id: w.id,
        groupId: w.group_id,
        order: w.order_index,
        targetWord: w.target_word,
        sentence: w.sentence,
        hintAr: w.hint_ar,
        ipa: w.ipa,
        // Absent until 20250324000000_word_accepted_answers.sql is applied.
        alternates: w.accepted_answers ?? [],
      };

      if (locale && wordTranslations) {
        const supportHint = resolveScalarField(wordTranslations, w.id, "hint", w.hint_ar, locale);
        warnIfMissing(supportHint, "vocabulary_word", w.id, "hint", locale);
        if (supportHint !== undefined) return { ...word, supportHint };
      }
      return word;
    }),
  };

  if (locale && groupTranslations) {
    const supportTitle = resolveScalarField(
      groupTranslations,
      group.id,
      "title",
      group.title_ar,
      locale,
    );
    warnIfMissing(supportTitle, "word_group", group.id, "title", locale);
    if (supportTitle !== undefined) result.supportTitle = supportTitle;

    const supportDescription = resolveScalarField(
      groupTranslations,
      group.id,
      "description",
      group.description_ar,
      locale,
    );
    if (supportDescription !== undefined) result.supportDescription = supportDescription;
  }

  return result;
}
