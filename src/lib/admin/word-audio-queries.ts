import type { SupabaseClient } from "@supabase/supabase-js";

import { getDefaultPronunciationVoiceId } from "@/lib/admin/voices-queries";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { isWordListProvider } from "@/lib/voice/content-provider-map";
import { hashText, normalizeTextForVoice } from "@/lib/voice/resolution";
import type { Database } from "@/types/database";

type DbClient = SupabaseClient<Database>;

/** voice_audio_cache reads in batches this size — a PostgREST `in (...)` list rides in the URL. */
const LOOKUP_BATCH = 60;
/** PostgREST returns at most this many rows per request. */
const PAGE_SIZE = 1000;

/** How much of one word group has audio, under the voice that group actually plays. */
export interface WordGroupAudioStatus {
  /** The voice generation and playback target: the group's own voice when it is a valid Word Lists voice, else the site default. */
  effectiveVoiceId: string;
  /** Distinct words (by cache hash) in the group. */
  total: number;
  ready: number;
  failed: number;
  /** vocabulary_words ids whose clip failed (and has no ready clip) — what a manual Generate forces a retry for. */
  failedWordIds: string[];
}

export interface WordAudioDashboardRow extends WordGroupAudioStatus {
  id: string;
  title: string;
  level: number;
  orderIndex: number;
  status: "draft" | "published" | "archived";
  /** The group's saved voice override, null = site default. */
  voiceId: string | null;
}

interface GroupInput {
  id: string;
  voice_id: string | null;
}

interface WordInput {
  id: string;
  group_id: string;
  target_word: string;
}

async function effectiveVoiceIds(
  supabase: DbClient,
  groups: readonly GroupInput[],
  defaultVoiceId: string,
): Promise<Map<string, string>> {
  const overrideIds = [
    ...new Set(groups.map((group) => group.voice_id).filter((id): id is string => Boolean(id))),
  ];
  const valid = new Set<string>();
  if (overrideIds.length > 0) {
    const { data, error } = await supabase
      .from("voices")
      .select("id, source")
      .in("id", overrideIds);
    if (error) throw error;
    for (const voice of data ?? []) if (isWordListProvider(voice.source)) valid.add(voice.id);
  }
  return new Map(
    groups.map((group) => [
      group.id,
      group.voice_id && valid.has(group.voice_id) ? group.voice_id : defaultVoiceId,
    ]),
  );
}

async function computeStatuses(
  supabase: DbClient,
  groups: readonly GroupInput[],
  words: readonly WordInput[],
  defaultVoiceId: string,
): Promise<Map<string, WordGroupAudioStatus>> {
  const voiceByGroup = await effectiveVoiceIds(supabase, groups, defaultVoiceId);

  const wordsByGroup = new Map<string, { id: string; hash: string }[]>();
  for (const word of words) {
    const list = wordsByGroup.get(word.group_id) ?? [];
    list.push({ id: word.id, hash: hashText(normalizeTextForVoice(word.target_word)) });
    wordsByGroup.set(word.group_id, list);
  }

  // Which hashes each voice has to be looked up for.
  const hashesByVoice = new Map<string, Set<string>>();
  for (const group of groups) {
    const voiceId = voiceByGroup.get(group.id) as string;
    const set = hashesByVoice.get(voiceId) ?? new Set<string>();
    for (const word of wordsByGroup.get(group.id) ?? []) set.add(word.hash);
    hashesByVoice.set(voiceId, set);
  }

  // voice -> hash -> best status seen (a ready clip with a URL always wins, like playback's lookup).
  const statusByVoice = new Map<string, Map<string, "ready" | "failed" | "pending">>();
  await Promise.all(
    [...hashesByVoice].map(async ([voiceId, hashSet]) => {
      const byHash = new Map<string, "ready" | "failed" | "pending">();
      const hashes = [...hashSet];
      for (let i = 0; i < hashes.length; i += LOOKUP_BATCH) {
        const { data, error } = await supabase
          .from("voice_audio_cache")
          .select("text_hash, status, audio_url")
          .eq("voice_id", voiceId)
          .in("text_hash", hashes.slice(i, i + LOOKUP_BATCH));
        if (error) throw error;
        for (const row of data ?? []) {
          const next =
            row.status === "ready" && row.audio_url
              ? "ready"
              : row.status === "failed"
                ? "failed"
                : "pending";
          const prev = byHash.get(row.text_hash);
          if (prev === "ready") continue;
          if (next === "ready" || prev === undefined || (prev === "pending" && next === "failed")) {
            byHash.set(row.text_hash, next);
          }
        }
      }
      statusByVoice.set(voiceId, byHash);
    }),
  );

  const result = new Map<string, WordGroupAudioStatus>();
  for (const group of groups) {
    const voiceId = voiceByGroup.get(group.id) as string;
    const byHash = statusByVoice.get(voiceId) ?? new Map();
    const groupWords = wordsByGroup.get(group.id) ?? [];
    const distinct = new Set(groupWords.map((word) => word.hash));
    let ready = 0;
    let failed = 0;
    for (const hash of distinct) {
      const status = byHash.get(hash);
      if (status === "ready") ready += 1;
      else if (status === "failed") failed += 1;
    }
    result.set(group.id, {
      effectiveVoiceId: voiceId,
      total: distinct.size,
      ready,
      failed,
      failedWordIds: groupWords
        .filter((word) => byHash.get(word.hash) === "failed")
        .map((word) => word.id),
    });
  }
  return result;
}

/**
 * One row per non-archived word group for the "Word audio status" dashboard
 * — the Word Lists counterpart to listVoiceGenerationDashboardRows (Stories),
 * read-only. Counts how many of each group's words already have a clip under
 * the voice that group actually plays (see WordGroupAudioStatus). Service
 * role like the rest of the voice cache reads: voice_audio_cache has no
 * session-scoped read policy for an admin.
 */
export async function listWordAudioDashboardRows(): Promise<{
  rows: WordAudioDashboardRow[];
  defaultVoiceId: string;
}> {
  const supabase = createServiceRoleClient();
  const defaultVoiceId = await getDefaultPronunciationVoiceId();

  const { data: groups, error: groupsError } = await supabase
    .from("word_groups")
    .select("id, title, level, order_index, status, voice_id")
    .neq("status", "archived")
    .order("level")
    .order("order_index");
  if (groupsError) throw groupsError;

  const words: WordInput[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("vocabulary_words")
      .select("id, group_id, target_word")
      .order("id")
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    words.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) break;
  }

  const statuses = await computeStatuses(supabase, groups ?? [], words, defaultVoiceId);
  const rows = (groups ?? []).map((group): WordAudioDashboardRow => {
    const status = statuses.get(group.id) as WordGroupAudioStatus;
    return {
      ...status,
      id: group.id,
      title: group.title,
      level: group.level,
      orderIndex: group.order_index,
      status: group.status,
      voiceId: group.voice_id,
    };
  });
  return { rows, defaultVoiceId };
}

/** Fresh status for a single group — what a row refreshes itself with after a voice change or a Generate round. Null when the group doesn't exist. */
export async function getWordGroupAudioStatus(
  groupId: string,
): Promise<WordGroupAudioStatus | null> {
  const supabase = createServiceRoleClient();
  const [defaultVoiceId, { data: group }, { data: words, error }] = await Promise.all([
    getDefaultPronunciationVoiceId(),
    supabase.from("word_groups").select("id, voice_id").eq("id", groupId).maybeSingle(),
    supabase.from("vocabulary_words").select("id, group_id, target_word").eq("group_id", groupId),
  ]);
  if (error) throw error;
  if (!group) return null;
  const statuses = await computeStatuses(supabase, [group], words ?? [], defaultVoiceId);
  return statuses.get(group.id) ?? null;
}
