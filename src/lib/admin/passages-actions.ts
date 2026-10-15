"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { requireAdmin } from "@/lib/admin/access";
import { logAdminAction } from "@/lib/admin/audit-log";
import { parsePassageJson } from "@/lib/passages/import";
import { loadPassageNarration, planPassageNarration, runNarration } from "@/lib/passages/narration";
import { narrationCost, resolveNarrationVoices, rolesOf } from "@/lib/passages/narration-plan";
import { passageIdFor, wordGroupIdFor } from "@/lib/passages/ids";
import { syncPassageWordGroups } from "@/lib/passages/publish";
import {
  passageFieldsFor,
  sectionRowsFor,
  sentenceRowsFor,
  speakerVoiceRowsFor,
  wordGroupRowFor,
  wordRowsFor,
} from "@/lib/passages/seed-rows";
import { PASSAGES_CACHE_TAG } from "@/lib/passages/types";
import { NARRATOR_ROLE } from "@/lib/passages/voice-aliases";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { createElevenLabsProvider } from "@/lib/voice/providers/elevenlabs";
import { deleteVoiceClips, voiceAudioPathFromUrl } from "@/lib/voice/storage";

/**
 * Admin -> Passages: publishing, Free / Premium, the voices, adding and deleting
 * a passage, and narrating it. Every action checks admin first (the console and the
 * middleware are not the only line of defence) and writes through the server's own
 * client, because the passages tables are closed to everyone else by RLS and a
 * dev-admin cookie has no Supabase session behind it for that policy to recognise.
 */

export interface ActionResult {
  error?: string;
  success?: string;
}

const NOT_FOUND = "That passage no longer exists.";

const roleLabel = (role: string) => (role === NARRATOR_ROLE ? "The narrator" : role);

/** The learner's share-cached reads and the admin pages pick a change up at once. */
function refresh(passageId?: string) {
  revalidateTag(PASSAGES_CACHE_TAG);
  revalidatePath("/admin/passages");
  if (passageId) revalidatePath(`/admin/passages/${passageId}`);
}

/** Publish a passage, or hold it back as a draft (an admin still opens it, as a preview). */
export async function setPassageStatus(
  passageId: string,
  status: "draft" | "published",
): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };
  if (status !== "draft" && status !== "published") return { error: "Unknown status." };

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("passages")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", passageId)
    .select("id");
  if (error) return { error: "Couldn't change the status. Please try again." };
  if (!data || data.length === 0) return { error: NOT_FOUND };

  // The passage's word lesson in Word Lists follows it (see syncPassageWordGroups).
  const warning = await syncPassageWordGroups();

  void logAdminAction("passage.status_changed", "passage", passageId, { status });
  refresh(passageId);
  const done = status === "published" ? "Published." : "Moved back to draft.";
  return { success: warning ? `${done} ${warning}` : done };
}

/** Make a passage Free, or Premium (only a subscriber or an admin can open it). Its word lesson follows. */
export async function setPassageAccess(passageId: string, isFree: boolean): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };
  if (typeof isFree !== "boolean") return { error: "Unknown access." };

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("passages")
    .update({ is_free: isFree, updated_at: new Date().toISOString() })
    .eq("id", passageId)
    .select("id, word_group_id");
  if (error) return { error: "Couldn't change the access. Please try again." };
  const row = data?.[0];
  if (!row) return { error: NOT_FOUND };

  // The words of a Premium passage are Premium too: its own Word Lists group (and only that one) follows.
  if (row.word_group_id === wordGroupIdFor(passageId)) {
    const { error: groupError } = await supabase
      .from("word_groups")
      .update({ is_free: isFree, updated_at: new Date().toISOString() })
      .eq("id", row.word_group_id);
    if (groupError) {
      return { error: "The passage was changed, but its word lesson could not follow. Try again." };
    }
  }

  void logAdminAction("passage.access_changed", "passage", passageId, { isFree });
  refresh(passageId);
  return { success: isFree ? "Now free for everyone." : "Now Premium." };
}

/**
 * Chooses the voice that speaks one role of a passage: a character, or the
 * narrator (NARRATOR_ROLE). No voice (`null`) means the default — the site's
 * narration voice for the narrator, the narrator's own voice for a character.
 * One voice reads the story and every character has one of their own, so a voice
 * another role already has is refused.
 */
export async function setPassageVoice(input: {
  passageId: string;
  role: string;
  voiceId: string | null;
}): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const { passageId, role } = input;
  const voiceId = input.voiceId || null;
  const supabase = createServiceRoleClient();

  let narration;
  try {
    narration = await loadPassageNarration(supabase, passageId);
  } catch {
    return { error: "Couldn't read the passage. Please try again." };
  }
  if (!narration) return { error: NOT_FOUND };
  const roles = rolesOf(narration.sentences);
  if (!roles.includes(role)) return { error: "That character is not in the passage." };

  if (voiceId === null) {
    const { error } = await supabase
      .from("passage_speaker_voices")
      .delete()
      .eq("passage_id", passageId)
      .eq("speaker", role);
    if (error) return { error: "Couldn't save the voice. Please try again." };
  } else {
    const voice = narration.setup.voices.get(voiceId);
    if (!voice) return { error: "That is not a registered ElevenLabs voice." };

    // Compared with every role that has a voice of its own (and the narrator, who always does).
    const assigned = new Map(narration.setup.assigned);
    assigned.set(role, voiceId);
    const { voiceFor } = resolveNarrationVoices(roles, { ...narration.setup, assigned });
    const own = new Set([NARRATOR_ROLE, ...[...assigned.keys()].filter((r) => roles.includes(r))]);
    const taken = [...voiceFor].find(
      ([other, v]) =>
        other !== role && own.has(other) && v.providerVoiceId === voice.providerVoiceId,
    );
    if (taken) {
      return {
        error: `${roleLabel(taken[0])} already speaks with "${voice.name}" — each role needs its own voice.`,
      };
    }

    const { error } = await supabase.from("passage_speaker_voices").upsert(
      {
        passage_id: passageId,
        speaker: role,
        voice_id: voiceId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "passage_id,speaker" },
    );
    if (error) return { error: "Couldn't save the voice. Please try again." };
  }

  void logAdminAction("passage.voice_changed", "passage", passageId, { role, voiceId });
  refresh(passageId);
  const stale = narration.sentences.filter(
    (sentence) => (sentence.speaker ?? NARRATOR_ROLE) === role && sentence.audioUrl,
  ).length;
  return {
    success:
      stale > 0
        ? `Voice saved. ${stale} line${stale === 1 ? "" : "s"} already narrated still sound${stale === 1 ? "s" : ""} like the old voice — regenerate ${stale === 1 ? "it" : "them"} to hear the new one.`
        : "Voice saved.",
  };
}

/**
 * Deletes a passage for good: its parts, lines, questions, every learner's progress on it,
 * its own word lesson in Word Lists and its narrated clips. Only a draft can be deleted —
 * a published passage is taken back to draft first, so a live one is never removed by a
 * slip of the mouse.
 */
export async function deletePassage(passageId: string): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const supabase = createServiceRoleClient();
  const { data: passage, error: readError } = await supabase
    .from("passages")
    .select("id, status, word_group_id")
    .eq("id", passageId)
    .maybeSingle();
  if (readError) return { error: "Couldn't read the passage. Please try again." };
  if (!passage) return { error: NOT_FOUND };
  if (passage.status === "published") {
    return { error: "Move the passage back to draft before deleting it." };
  }

  // The clips are listed first: once the rows are gone, so are the URLs.
  const { data: sections } = await supabase
    .from("passage_sections")
    .select("id")
    .eq("passage_id", passageId);
  const { data: clips } = await supabase
    .from("passage_sentences")
    .select("audio_url")
    .in(
      "section_id",
      (sections ?? []).map((section) => section.id),
    )
    .not("audio_url", "is", null);

  const { error } = await supabase.from("passages").delete().eq("id", passageId);
  if (error) return { error: "Couldn't delete the passage. Please try again." };

  // Its own word lesson goes with it; a group a passage merely points at is never touched.
  if (passage.word_group_id === wordGroupIdFor(passageId)) {
    const { error: groupError } = await supabase
      .from("word_groups")
      .delete()
      .eq("id", passage.word_group_id);
    if (groupError) console.error("[passages] deleting the word lesson failed", groupError);
  }

  const paths = (clips ?? [])
    .map((clip) => (clip.audio_url ? voiceAudioPathFromUrl(clip.audio_url) : null))
    .filter((path): path is string => Boolean(path));
  await deleteVoiceClips(paths);

  void logAdminAction("passage.deleted", "passage", passageId, { clips: paths.length });
  refresh();
  return { success: "Passage deleted." };
}

export interface ImportResult {
  error?: string;
  /** Plain-language reasons the passage can't be added; shown as a list. */
  problems?: string[];
  success?: string;
  id?: string;
}

/**
 * Adds a passage from the JSON an admin pasted (the authored shape — see
 * src/data/passages/types.ts). `check` only says whether it can be added; `add`
 * writes it as a DRAFT, Free, with its own draft word lesson and one voice per
 * character taken from its cast. Everything is checked first, and a write that fails
 * half way takes back what it wrote.
 */
export async function importPassage(raw: string, mode: "check" | "add"): Promise<ImportResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const parsed = parsePassageJson(typeof raw === "string" ? raw : "");
  const seed = parsed.seed;
  if (!seed) return { problems: parsed.problems };

  const supabase = createServiceRoleClient();
  const passageId = passageIdFor(seed.slug);
  const groupId = wordGroupIdFor(seed.slug);
  const voiceRows = speakerVoiceRowsFor(seed);

  // What only the database knows.
  const [existing, positionTaken, groupTaken, wordsTaken, voicesKnown] = await Promise.all([
    supabase.from("passages").select("id").eq("id", passageId).maybeSingle(),
    supabase
      .from("passages")
      .select("id")
      .eq("level", seed.level)
      .eq("order_index", seed.order)
      .maybeSingle(),
    supabase.from("word_groups").select("id").eq("id", groupId).maybeSingle(),
    supabase
      .from("vocabulary_words")
      .select("group_id, target_word")
      .or(seed.words.map((word) => `target_word.ilike.${word.word}`).join(",")),
    voiceRows.length === 0
      ? Promise.resolve({ data: [], error: null })
      : supabase
          .from("voices")
          .select("id")
          .in(
            "id",
            voiceRows.map((row) => row.voice_id),
          ),
  ]);
  if (
    existing.error ||
    positionTaken.error ||
    groupTaken.error ||
    wordsTaken.error ||
    voicesKnown.error
  ) {
    return { error: "Couldn't check the passage against the database. Please try again." };
  }

  const problems: string[] = [];
  if (existing.data) problems.push(`A passage with the slug "${seed.slug}" already exists.`);
  if (positionTaken.data) {
    problems.push(
      `Level ${seed.level} already has a passage in position ${seed.order} ("${positionTaken.data.id}") — pick a free position.`,
    );
  }
  if (groupTaken.data) problems.push(`The Word Lists group "${groupId}" already exists.`);
  for (const row of wordsTaken.data ?? []) {
    problems.push(
      `The word "${row.target_word}" is already taught in the Word Lists group "${row.group_id}".`,
    );
  }
  const known = new Set((voicesKnown.data ?? []).map((voice) => voice.id));
  for (const row of voiceRows) {
    if (!known.has(row.voice_id)) {
      problems.push(`The voice of ${row.speaker} is not registered (Admin → Voice).`);
    }
  }
  if (problems.length > 0) return { problems };

  const lines = seed.sections.reduce((sum, section) => sum + section.lines.length, 0);
  const summary = `${seed.sections.length} parts, ${lines} lines, ${seed.words.length} words, ${voiceRows.length} character voice${voiceRows.length === 1 ? "" : "s"}`;
  if (mode === "check")
    return { success: `This passage can be added: ${summary}. Nothing was saved.` };

  // word_groups.order_index is unique across all groups: the new lesson goes after the last one.
  const { data: last, error: orderError } = await supabase
    .from("word_groups")
    .select("order_index")
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (orderError) return { error: "Couldn't add the passage. Please try again." };

  const steps: (() => PromiseLike<{ error: unknown }>)[] = [
    () =>
      supabase
        .from("word_groups")
        .insert(wordGroupRowFor(seed, (last?.order_index ?? 0) + 1, true)),
    () => supabase.from("vocabulary_words").insert(wordRowsFor(seed)),
    () =>
      supabase
        .from("passages")
        .insert({ id: passageId, status: "draft", is_free: true, ...passageFieldsFor(seed) }),
    () => supabase.from("passage_sections").insert(sectionRowsFor(seed)),
    () => supabase.from("passage_sentences").insert(sentenceRowsFor(seed)),
    () =>
      voiceRows.length === 0
        ? Promise.resolve({ error: null })
        : supabase.from("passage_speaker_voices").insert(voiceRows),
  ];
  for (const step of steps) {
    const { error } = await step();
    if (error) {
      // Take back what was written: the passage's rows cascade, then the group's words.
      await supabase.from("passages").delete().eq("id", passageId);
      await supabase.from("word_groups").delete().eq("id", groupId);
      console.error("[passages] importPassage failed", error);
      return { error: "Couldn't add the passage, so nothing was saved. Please try again." };
    }
  }

  void logAdminAction("passage.imported", "passage", passageId, { title: seed.title });
  refresh();
  return {
    success: `Added "${seed.title}" as a draft (${summary}). Choose its voices, generate its audio, then publish it.`,
    id: passageId,
  };
}

export interface GenerateAudioInput {
  passageId: string;
  /** Narrate lines that already have a clip again. */
  force?: boolean;
  /** Only the lines this role speaks (NARRATOR_ROLE or a character's name). */
  role?: string;
  /** The lines the earlier rounds of this same run already dealt with. */
  skip?: string[];
}

export interface GenerateAudioResult {
  /** Something that stops the run (the key, the payment, the quota, a setup problem). */
  error?: string;
  /** Why the lines that failed in this round failed — they are left out of the run, not a reason to stop it. */
  failedReason?: string;
  /** Narrated in this round. */
  done?: number;
  /** Failed every attempt in this round. */
  failed?: number;
  /** Lines of this run still to do after this round. */
  remaining?: number;
  /** The lines this round dealt with: the next round's `skip`. */
  handled?: string[];
}

/** A round is kept short — about as many lines as a request can narrate in a few seconds — so no single call runs for long; the page calls again until `remaining` is 0. */
const ROUND_SIZE = 6;

/**
 * Narrates a passage's lines with ElevenLabs, a few at a time (see ROUND_SIZE): the
 * lines with no clip yet — or all of them with `force` — of the whole passage or just one
 * role's. Uses the voices set up for the passage and refuses to start while the setup is
 * wrong (two roles with one voice, no narrator voice). Costs ElevenLabs characters, so it
 * only ever runs when an admin presses the button.
 */
export async function generatePassageAudio(
  input: GenerateAudioInput,
): Promise<GenerateAudioResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return { error: "ELEVENLABS_API_KEY is not configured on the server." };

  const skip = Array.isArray(input.skip) ? input.skip.filter((id) => typeof id === "string") : [];
  const supabase = createServiceRoleClient();

  let narration;
  try {
    narration = await loadPassageNarration(supabase, input.passageId);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Couldn't read the passage." };
  }
  if (!narration) return { error: NOT_FOUND };
  if (input.role !== undefined && !rolesOf(narration.sentences).includes(input.role)) {
    return { error: "That character is not in the passage." };
  }

  const plan = planPassageNarration(narration, {
    force: Boolean(input.force),
    role: input.role,
    skip: new Set(skip),
  });
  if (plan.problems.length > 0) return { error: plan.problems.join(" ") };
  if (plan.jobs.length === 0) return { done: 0, failed: 0, remaining: 0, handled: [] };

  // One entry per run, on its first round: what the admin asked ElevenLabs to narrate.
  if (skip.length === 0) {
    void logAdminAction("passage.audio_generated", "passage", input.passageId, {
      role: input.role ?? null,
      force: Boolean(input.force),
      ...narrationCost(plan.jobs),
    });
  }

  const outcome = await runNarration({
    supabase,
    provider: createElevenLabsProvider(apiKey),
    settings: narration.settings,
    jobs: plan.jobs.slice(0, ROUND_SIZE),
    voiceFor: plan.voiceFor,
    concurrency: 3,
  });

  const remaining = plan.jobs.length - outcome.handled.length;
  revalidateTag(PASSAGES_CACHE_TAG);
  if (remaining === 0 || outcome.fatal) revalidatePath(`/admin/passages/${input.passageId}`);
  return {
    error: outcome.fatal ?? undefined,
    failedReason: outcome.failed[0]?.error,
    done: outcome.done,
    failed: outcome.failed.length,
    remaining,
    handled: outcome.handled,
  };
}
