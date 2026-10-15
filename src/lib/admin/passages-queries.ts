import { loadPassageNarration, planPassageNarration } from "@/lib/passages/narration";
import { narrationCost, rolesOf } from "@/lib/passages/narration-plan";
import { IN_CHUNK_SIZE, chunk } from "@/lib/passages/queries";
import type { PassageLevel, PassageTone } from "@/lib/passages/types";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * What Admin -> Passages shows. Read with the service-role client: the passages
 * tables are closed to everyone but admins by RLS, and a dev-admin cookie has no
 * Supabase session behind it for that policy to recognise — so, like the learner
 * reads, these go through the server's own client. Only ever called by pages that
 * have already passed the admin check (see requireAdmin / the console layout).
 */

export interface AdminPassageRow {
  id: string;
  order: number;
  level: PassageLevel;
  tone: PassageTone;
  title: string;
  status: "draft" | "published";
  isFree: boolean;
  sections: number;
  lines: number;
  /** Lines that have a narrated clip. */
  clips: number;
  /** The characters who speak, in the order they first do. */
  characters: string[];
  /** The word lesson's own status in Word Lists; null when it has none. */
  wordGroupStatus: "draft" | "published" | "archived" | null;
}

/** Every passage, drafts included, in list order, with what the table needs about each. */
export async function listAdminPassages(): Promise<AdminPassageRow[]> {
  const supabase = createServiceRoleClient();

  const { data: passages, error } = await supabase
    .from("passages")
    .select("*")
    .order("level")
    .order("order_index");
  if (error) throw error;
  if (!passages || passages.length === 0) return [];

  const sectionRows = (
    await Promise.all(
      chunk(
        passages.map((passage) => passage.id),
        IN_CHUNK_SIZE,
      ).map(async (ids) => {
        const { data, error: sectionsError } = await supabase
          .from("passage_sections")
          .select("id, passage_id, order_index")
          .in("passage_id", ids);
        if (sectionsError) throw sectionsError;
        return data ?? [];
      }),
    )
  ).flat();
  const passageOfSection = new Map(sectionRows.map((row) => [row.id, row.passage_id]));
  const sectionOrder = new Map(sectionRows.map((row) => [row.id, row.order_index]));

  const sentenceRows = (
    await Promise.all(
      chunk([...passageOfSection.keys()], IN_CHUNK_SIZE).map(async (ids) => {
        const { data, error: sentencesError } = await supabase
          .from("passage_sentences")
          .select("section_id, order_index, speaker, audio_url")
          .in("section_id", ids);
        if (sentencesError) throw sentencesError;
        return data ?? [];
      }),
    )
  ).flat();
  // Reading order, so a passage's characters come out in the order they first speak.
  sentenceRows.sort(
    (a, b) =>
      (sectionOrder.get(a.section_id) ?? 0) - (sectionOrder.get(b.section_id) ?? 0) ||
      a.order_index - b.order_index,
  );

  const groupIds = passages.map((passage) => passage.word_group_id).filter(Boolean) as string[];
  const groupRows = (
    await Promise.all(
      chunk(groupIds, IN_CHUNK_SIZE).map(async (ids) => {
        const { data, error: groupsError } = await supabase
          .from("word_groups")
          .select("id, status")
          .in("id", ids);
        if (groupsError) throw groupsError;
        return data ?? [];
      }),
    )
  ).flat();
  const groupStatus = new Map(groupRows.map((row) => [row.id, row.status]));

  return passages.map((passage) => {
    const ownSections = sectionRows.filter((section) => section.passage_id === passage.id);
    const ownLines = sentenceRows.filter(
      (row) => passageOfSection.get(row.section_id) === passage.id,
    );
    return {
      id: passage.id,
      order: passage.order_index,
      level: passage.level,
      tone: passage.tone,
      title: passage.title,
      status: passage.status,
      isFree: passage.is_free,
      sections: ownSections.length,
      lines: ownLines.length,
      clips: ownLines.filter((row) => row.audio_url).length,
      characters: [...new Set(ownLines.map((row) => row.speaker).filter(Boolean) as string[])],
      wordGroupStatus: passage.word_group_id
        ? (groupStatus.get(passage.word_group_id) ?? null)
        : null,
    };
  });
}

export interface AdminVoiceOption {
  id: string;
  name: string;
  gender: "female" | "male";
  sampleAudioUrl: string | null;
}

export interface AdminPassageRole {
  /** NARRATOR_ROLE or a character's name. */
  role: string;
  lines: number;
  clips: number;
  /** What narrating all of this role's lines sends to ElevenLabs. */
  characters: number;
  /** The voice chosen for the role (voices.id); null = none chosen (the site default for the narrator, the narrator for a character). */
  voiceId: string | null;
  /** The voice that will actually speak the role; null when none can be worked out. */
  speaking: AdminVoiceOption | null;
}

export interface AdminPassageDetail {
  id: string;
  order: number;
  level: PassageLevel;
  tone: PassageTone;
  title: string;
  titleAr: string;
  summary: string;
  status: "draft" | "published";
  isFree: boolean;
  wordGroupId: string | null;
  wordGroupStatus: "draft" | "published" | "archived" | null;
  sections: number;
  lines: number;
  clips: number;
  roles: AdminPassageRole[];
  /** Every ElevenLabs voice an admin can give a role, by name. */
  voices: AdminVoiceOption[];
  /** The site's default narration voice (Admin -> Voice): what reads the story when the passage has no narrator of its own. */
  defaultNarrator: AdminVoiceOption | null;
  /** What is wrong with the voice setup, in plain words; narration is refused while there is anything. */
  problems: string[];
  /** The ElevenLabs model the clips are made with. */
  model: string;
  /** What narrating the lines that have no clip yet would send. */
  missing: { lines: number; characters: number };
}

const option = (voice: {
  id: string;
  name: string;
  gender: "female" | "male";
  sampleAudioUrl: string | null;
}): AdminVoiceOption => ({
  id: voice.id,
  name: voice.name,
  gender: voice.gender,
  sampleAudioUrl: voice.sampleAudioUrl,
});

export async function getAdminPassage(id: string): Promise<AdminPassageDetail | null> {
  const supabase = createServiceRoleClient();

  const { data: passage, error } = await supabase
    .from("passages")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!passage) return null;

  const [narration, groupResult, sectionsResult] = await Promise.all([
    loadPassageNarration(supabase, id),
    passage.word_group_id
      ? supabase.from("word_groups").select("status").eq("id", passage.word_group_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("passage_sections")
      .select("id", { count: "exact", head: true })
      .eq("passage_id", id),
  ]);
  if (!narration) return null;
  if (groupResult.error) throw groupResult.error;
  if (sectionsResult.error) throw sectionsResult.error;

  const plan = planPassageNarration(narration);
  const voices = [...narration.setup.voices.values()]
    .map(option)
    .sort((a, b) => a.name.localeCompare(b.name));

  const roles: AdminPassageRole[] = rolesOf(narration.sentences).map((role) => {
    const own = plan.all.filter((job) => job.role === role);
    const speaking = plan.voiceFor.get(role);
    return {
      role,
      lines: own.length,
      clips: own.filter((job) => job.hasClip).length,
      characters: narrationCost(own).characters,
      voiceId: narration.setup.assigned.get(role) ?? null,
      speaking: speaking ? option(speaking) : null,
    };
  });

  const defaultNarratorId = narration.setup.defaultNarratorVoiceId;
  const defaultNarrator = defaultNarratorId ? narration.setup.voices.get(defaultNarratorId) : null;

  return {
    id: passage.id,
    order: passage.order_index,
    level: passage.level,
    tone: passage.tone,
    title: passage.title,
    titleAr: passage.title_ar,
    summary: passage.summary,
    status: passage.status,
    isFree: passage.is_free,
    wordGroupId: passage.word_group_id,
    wordGroupStatus: groupResult.data?.status ?? null,
    sections: sectionsResult.count ?? 0,
    lines: plan.all.length,
    clips: plan.all.filter((job) => job.hasClip).length,
    roles,
    voices,
    defaultNarrator: defaultNarrator ? option(defaultNarrator) : null,
    problems: plan.problems,
    model: narration.settings.model,
    missing: narrationCost(plan.jobs),
  };
}
