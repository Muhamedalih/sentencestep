import { wordsBefore } from "@/lib/passages/narration-pauses";
import type { PauseHint, PauseLength, PauseMark } from "@/lib/passages/narration-pauses";
import { narrationPlanFor, narrationTextFor, spokenTextFor } from "@/lib/passages/spoken-text";
import type { NarrationLine } from "@/lib/passages/spoken-text";
import { NARRATOR_ROLE } from "@/lib/passages/voice-aliases";

/**
 * What narrating a passage needs, worked out from its rows — pure, so the same
 * plan drives the audio script, the admin's Generate button and the pause
 * markers an admin sees in the reader, and it is tested without a database.
 *
 * A passage line is spoken by a ROLE: the character who says it, or the narrator
 * (NARRATOR_ROLE) for every line without one. Each role has its own voice
 * (passage_speaker_voices): the narrator's falls back to the site's default
 * narration voice, and a character nobody gave a voice to — an email, a sign —
 * is simply read by the narrator.
 */

/** A passage line as the narration needs it, as stored in passage_sentences. */
export interface NarrationSentence {
  id: string;
  /** The part the line belongs to: the line "before" a line is looked up inside its own part only. */
  sectionId: string;
  speaker: string | null;
  en: string;
  say: string | null;
  /** The raw jsonb of passage_sentences.pause — read with parsePauseHint, never trusted as it is. */
  pause: unknown;
  audioUrl: string | null;
}

/** The pause hint stored with a line, or undefined when there is none or it is not a hint (the rules then decide). */
export function parsePauseHint(value: unknown): PauseHint | undefined {
  if (value === "none") return "none";
  if (typeof value !== "object" || value === null) return undefined;
  const entry = value as Record<string, unknown>;
  const length: PauseLength | undefined =
    entry.length === "long" ? "long" : entry.length === "short" ? "short" : undefined;
  const withLength = length ? { length } : {};
  if (typeof entry.after === "string" && entry.after) return { after: entry.after, ...withLength };
  if (entry.before === true) return { before: true, ...withLength };
  return undefined;
}

function lineOf(sentence: NarrationSentence): NarrationLine {
  return {
    en: sentence.en,
    say: sentence.say ?? undefined,
    who: sentence.speaker ?? undefined,
    pause: parsePauseHint(sentence.pause),
  };
}

/** The line just before this one in the same part — what a reaction answers. */
function previousInPart(
  sentences: readonly NarrationSentence[],
  index: number,
): string | undefined {
  const before = sentences[index - 1];
  return before && before.sectionId === sentences[index]?.sectionId ? before.en : undefined;
}

export interface NarrationJob {
  sentenceId: string;
  /** NARRATOR_ROLE, or the character's name: whose voice speaks the line. */
  role: string;
  /** What is sent to the voice: the spoken text with the small pause a person would take in it (if any). */
  text: string;
  /** The spoken text without that pause — what `text` is compared with to see which lines got one. */
  plain: string;
  hasClip: boolean;
}

/** One job per line, in reading order (the sentences must already be). */
export function narrationJobsFor(
  sentences: readonly NarrationSentence[],
  options: { model?: string | null; pauses?: boolean } = {},
): NarrationJob[] {
  return sentences.map((sentence, index) => {
    const line = lineOf(sentence);
    return {
      sentenceId: sentence.id,
      role: sentence.speaker ?? NARRATOR_ROLE,
      text: narrationTextFor(line, {
        model: options.model,
        previousEn: previousInPart(sentences, index),
        pauses: options.pauses,
      }),
      plain: spokenTextFor(line),
      hasClip: Boolean(sentence.audioUrl),
    };
  });
}

/** Where the narrator will pause, by sentence id — for the admin's eyes only (see PassageText). The same plans the jobs are made from. */
export function pauseMarksForSentences(
  sentences: readonly NarrationSentence[],
): Record<string, PauseMark> {
  const marks: Record<string, PauseMark> = {};
  sentences.forEach((sentence, index) => {
    const { spoken, plan } = narrationPlanFor(lineOf(sentence), previousInPart(sentences, index));
    if (!plan) return;
    marks[sentence.id] = { afterWord: wordsBefore(spoken, plan.at), length: plan.length };
  });
  return marks;
}

/** The roles of a passage in reading order: the narrator first, then each character as they first speak. */
export function rolesOf(sentences: readonly NarrationSentence[]): string[] {
  const roles = [NARRATOR_ROLE];
  for (const sentence of sentences) {
    if (sentence.speaker && !roles.includes(sentence.speaker)) roles.push(sentence.speaker);
  }
  return roles;
}

// --- Voices -------------------------------------------------------------------

export interface NarrationVoice {
  /** The `voices` table id. */
  id: string;
  name: string;
  gender: "female" | "male";
  /** The id ElevenLabs knows the voice by — what "the same voice" means. */
  providerVoiceId: string;
  /** A short sample of the voice an admin can listen to before choosing it. */
  sampleAudioUrl: string | null;
}

export interface VoiceSetup {
  /** passage_speaker_voices: a character's name (or NARRATOR_ROLE) -> the voices.id chosen for it. */
  assigned: ReadonlyMap<string, string>;
  /** The site's default narration voice: it reads the story when the passage has no narrator of its own. */
  defaultNarratorVoiceId: string | null;
  /** Every registered ElevenLabs voice, by voices.id. */
  voices: ReadonlyMap<string, NarrationVoice>;
}

export interface ResolvedVoices {
  /** The voice that speaks each role. */
  voiceFor: Map<string, NarrationVoice>;
  /** Plain-language reasons the passage can't be narrated as set up; empty = fine. */
  problems: string[];
}

const roleLabel = (role: string) => (role === NARRATOR_ROLE ? "the narrator" : role);

/** Which voice speaks which role, and what is wrong with the setup: one voice reads the story and every character has one of their own — two roles never share a voice. */
export function resolveNarrationVoices(roles: Iterable<string>, setup: VoiceSetup): ResolvedVoices {
  const problems: string[] = [];
  const voiceFor = new Map<string, NarrationVoice>();

  const choose = (role: string, voiceId: string) => {
    const voice = setup.voices.get(voiceId);
    if (!voice) {
      problems.push(
        `The voice chosen for ${roleLabel(role)} is not a registered ElevenLabs voice.`,
      );
    }
    return voice;
  };

  const narratorId = setup.assigned.get(NARRATOR_ROLE) ?? setup.defaultNarratorVoiceId;
  const narrator = narratorId ? choose(NARRATOR_ROLE, narratorId) : undefined;
  if (!narratorId) {
    problems.push(
      "The story has no narrator voice: choose one here, or set the site's default narration voice in Admin → Voice.",
    );
  }
  if (narrator) voiceFor.set(NARRATOR_ROLE, narrator);

  const owners = new Map<string, string>();
  if (narrator) owners.set(narrator.providerVoiceId, NARRATOR_ROLE);

  for (const role of new Set(roles)) {
    if (role === NARRATOR_ROLE) continue;
    const voiceId = setup.assigned.get(role);
    if (!voiceId) {
      // Nobody gave this character a voice (an email, a sign): the narrator reads it.
      if (narrator) voiceFor.set(role, narrator);
      continue;
    }
    const voice = choose(role, voiceId);
    if (!voice) continue;
    voiceFor.set(role, voice);
    const owner = owners.get(voice.providerVoiceId);
    if (owner) {
      problems.push(
        `${roleLabel(role)} and ${roleLabel(owner)} would speak with the same voice — give each their own.`,
      );
    } else {
      owners.set(voice.providerVoiceId, role);
    }
  }
  return { voiceFor, problems };
}

// --- The plan -----------------------------------------------------------------

export interface NarrationPlan {
  /** The lines to narrate now, in reading order. */
  jobs: NarrationJob[];
  /** Every line of the passage — what regenerating all of it would send. */
  all: NarrationJob[];
  voiceFor: Map<string, NarrationVoice>;
  problems: string[];
}

export interface NarrationRequest {
  /** Lines that already have a clip are narrated again. */
  force?: boolean;
  /** Only the lines this role speaks (NARRATOR_ROLE or a character's name). */
  role?: string;
  /** Lines to leave out: the ones an earlier round of the same run already handled. */
  skip?: ReadonlySet<string>;
  /** false: send every line exactly as spoken, without the small pauses. */
  pauses?: boolean;
}

export function planNarration(
  sentences: readonly NarrationSentence[],
  setup: VoiceSetup,
  model: string | null | undefined,
  request: NarrationRequest = {},
): NarrationPlan {
  const all = narrationJobsFor(sentences, { model, pauses: request.pauses });
  const { voiceFor, problems } = resolveNarrationVoices(rolesOf(sentences), setup);
  const jobs = all.filter(
    (job) =>
      (request.force || !job.hasClip) &&
      (request.role === undefined || job.role === request.role) &&
      !request.skip?.has(job.sentenceId),
  );
  return { jobs, all, voiceFor, problems };
}

/** What sending these lines costs: ElevenLabs bills the characters of the text it is given. */
export function narrationCost(jobs: readonly NarrationJob[]): {
  lines: number;
  characters: number;
} {
  return { lines: jobs.length, characters: jobs.reduce((sum, job) => sum + job.text.length, 0) };
}
