import { cache } from "react";

import { createPublicClient } from "@/lib/supabase/public-client";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { isLearnerVisibleStatus } from "@/lib/content-helpers";
import {
  getContentTranslations,
  resolveScalarField,
  warnIfMissing,
} from "@/lib/i18n/content-translations";
import type { SupportLocale } from "@/lib/i18n/locales";
import type { WordGroup, WordGroupSummary } from "@/types/word-lists";

/**
 * Word Lists content reads, matching the shape of the local seed in
 * src/data/word-lists. Only called once isSupabaseConfigured() is true —
 * see src/lib/word-lists.ts, the single place the rest of the app reads
 * word groups/words from.
 *
 * fetchWordGroupSummaries reads the groups with the public client:
 * word_groups rows themselves are fully public-readable regardless of
 * premium status (same as `lessons` — only the content *inside* a premium
 * group is gated). The word ids and counts come from the service-role
 * client instead: vocabulary_words RLS hides a premium group's rows
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

export async function fetchWordGroupSummaries(locale?: SupportLocale): Promise<WordGroupSummary[]> {
  const supabase = createPublicClient();

  const [{ data: groupRows, error: groupsError }, { data: words, error: wordsError }] =
    await Promise.all([
      supabase.from("word_groups").select("*").eq("status", "published").order("order_index"),
      // Service-role, not the public client above: a group's real word ids and
      // count have to be accurate regardless of whether THIS viewer can read
      // its rows (a locked group viewed by a free learner, or a premium group
      // viewed by a subscriber, which the anonymous client can never resolve
      // as one). Ids only — see the doc comment above.
      createServiceRoleClient().from("vocabulary_words").select("id, group_id"),
    ]);

  if (groupsError) throw groupsError;
  if (wordsError) throw wordsError;
  // Defensive double-check, see isLearnerVisibleStatus's doc comment.
  const groups = (groupRows ?? []).filter((group) => isLearnerVisibleStatus(group.status));

  const idsByGroup = new Map<string, string[]>();
  for (const word of words ?? []) {
    const list = idsByGroup.get(word.group_id) ?? [];
    list.push(word.id);
    idsByGroup.set(word.group_id, list);
  }

  const translations = locale
    ? await getContentTranslations(
        "word_group",
        (groups ?? []).map((group) => group.id),
        locale,
      )
    : undefined;

  return (groups ?? []).map((group) => {
    const summary: WordGroupSummary = {
      id: group.id,
      level: group.level,
      order: group.order_index,
      title: group.title,
      titleAr: group.title_ar,
      description: group.description ?? undefined,
      descriptionAr: group.description_ar ?? undefined,
      isFree: group.is_free,
      // Both come from the service-role read above, so they are every
      // group's true figures whatever this viewer's access: a locked group
      // is never misreported as empty, and a subscriber's progress on a
      // premium group counts its real words.
      wordCount: idsByGroup.get(group.id)?.length ?? 0,
      wordIds: idsByGroup.get(group.id) ?? [],
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
  const { data, error } = await supabase
    .from("vocabulary_words")
    .select("id, group_id, target_word");
  if (error) throw error;
  return (data ?? []).map((row) => ({
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
