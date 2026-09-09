import { cache } from "react";

import { wordGroups as localWordGroups } from "@/data/word-lists";
import { fetchWordGroupById, fetchWordGroupSummaries } from "@/lib/supabase/queries/word-lists";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { SupportLocale } from "@/lib/i18n/locales";
import type { WordGroup, WordGroupSummary } from "@/types/word-lists";

/**
 * The single place the app reads Word Lists content from — same
 * local-seed-until-linked pattern as src/lib/content.ts. Nothing else
 * should import src/data/word-lists or src/lib/supabase/queries/word-lists
 * directly.
 *
 * Server-only: getWordGroupById reads the session-aware Supabase client to
 * resolve premium access (see fetchWordGroupById's doc comment) — only
 * call it from a Server Component/Action, never a Client Component.
 * getWordGroupSummaries has no such restriction.
 */

function toSummary(group: WordGroup): WordGroupSummary {
  const { words, ...rest } = group;
  return { ...rest, wordCount: words.length, wordIds: words.map((word) => word.id) };
}

export async function getWordGroupSummaries(locale?: SupportLocale): Promise<WordGroupSummary[]> {
  if (isSupabaseConfigured()) return fetchWordGroupSummaries(locale);
  return localWordGroups.map(toSummary);
}

/**
 * React-cache()'d: both /learn/word-lists/[groupId] and
 * /learn/word-lists/[groupId]/learn call this same word group twice per
 * request (once from generateMetadata, once from the page component) — see
 * src/lib/content.ts's getLessonById for the identical reasoning and the
 * same per-request-only memoization guarantee.
 */
export const getWordGroupById = cache(async function getWordGroupById(
  groupId: string,
  locale?: SupportLocale,
): Promise<WordGroup | undefined> {
  if (isSupabaseConfigured()) return fetchWordGroupById(groupId, locale);
  return localWordGroups.find((group) => group.id === groupId);
});
