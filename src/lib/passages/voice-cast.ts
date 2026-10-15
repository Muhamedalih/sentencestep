import { resolveNarrationVoices } from "@/lib/passages/narration-plan";
import type { NarrationVoice } from "@/lib/passages/narration-plan";
import { NARRATOR_ROLE } from "@/lib/passages/voice-aliases";

/**
 * Choosing the voices of every passage at once. The characters of all the passages
 * speak with a handful of voices (the five the authored cast names), and the story
 * is read by one narrator: so instead of opening twenty-six passages one by one, an
 * admin replaces a voice everywhere — "every character who speaks with Russ speaks
 * with David now" — or sets the narrator of every passage. Pure, so the rules (a voice
 * is never given to two roles of one passage) are tested without a database.
 */

/** One passage's chosen voices (passage_speaker_voices): a character's name — or NARRATOR_ROLE — to a voices.id. */
export interface PassageVoiceRows {
  passageId: string;
  title: string;
  assigned: ReadonlyMap<string, string>;
}

/** The passages whose characters speak with `from`, with `from` replaced by `to` (a passage's narrator row is never touched). Passages without `from` are not returned. */
export function withCharacterVoiceReplaced(
  passages: readonly PassageVoiceRows[],
  from: string,
  to: string,
): PassageVoiceRows[] {
  const changed: PassageVoiceRows[] = [];
  for (const passage of passages) {
    const assigned = new Map(passage.assigned);
    let touched = false;
    for (const [speaker, voiceId] of passage.assigned) {
      if (speaker !== NARRATOR_ROLE && voiceId === from) {
        assigned.set(speaker, to);
        touched = true;
      }
    }
    if (touched) changed.push({ ...passage, assigned });
  }
  return changed;
}

/** The passages whose narrator is not yet `voiceId`, with it set (null: the passage's own narrator row removed, so the site's default voice reads the story). */
export function withNarratorSet(
  passages: readonly PassageVoiceRows[],
  voiceId: string | null,
): PassageVoiceRows[] {
  const changed: PassageVoiceRows[] = [];
  for (const passage of passages) {
    if ((passage.assigned.get(NARRATOR_ROLE) ?? null) === voiceId) continue;
    const assigned = new Map(passage.assigned);
    if (voiceId === null) assigned.delete(NARRATOR_ROLE);
    else assigned.set(NARRATOR_ROLE, voiceId);
    changed.push({ ...passage, assigned });
  }
  return changed;
}

/** What would be wrong in these passages as they are set up: a voice that is not registered, or two roles on one voice. One plain sentence each, naming the passage. */
export function voiceClashes(
  passages: readonly PassageVoiceRows[],
  defaultNarratorVoiceId: string | null,
  voices: ReadonlyMap<string, NarrationVoice>,
): string[] {
  const clashes: string[] = [];
  for (const passage of passages) {
    const { problems } = resolveNarrationVoices([NARRATOR_ROLE, ...passage.assigned.keys()], {
      assigned: passage.assigned,
      defaultNarratorVoiceId,
      voices,
    });
    for (const problem of problems) clashes.push(`“${passage.title}”: ${problem}`);
  }
  return clashes;
}

export interface VoiceUse {
  voiceId: string;
  /** How many characters speak with it, over all the passages. */
  characters: number;
  /** In how many passages. */
  passages: number;
}

export interface NarratorUse {
  /** "default": no passage has a narrator of its own; "same": every passage has this one; "mixed": anything else. */
  mode: "default" | "same" | "mixed";
  /** The shared voice when `mode` is "same". */
  voiceId: string | null;
  /** How many passages have a narrator of their own. */
  passagesWithOwn: number;
}

/** The voices the characters speak with (the most used first) and how the narrator stands. */
export function summarizeVoiceCast(passages: readonly PassageVoiceRows[]): {
  characters: VoiceUse[];
  narrator: NarratorUse;
} {
  const uses = new Map<string, { characters: number; passages: Set<string> }>();
  const narrators: string[] = [];
  for (const passage of passages) {
    for (const [speaker, voiceId] of passage.assigned) {
      if (speaker === NARRATOR_ROLE) {
        narrators.push(voiceId);
        continue;
      }
      const use = uses.get(voiceId) ?? { characters: 0, passages: new Set<string>() };
      use.characters += 1;
      use.passages.add(passage.passageId);
      uses.set(voiceId, use);
    }
  }

  const characters = [...uses]
    .map(([voiceId, use]) => ({ voiceId, characters: use.characters, passages: use.passages.size }))
    .sort((a, b) => b.characters - a.characters || a.voiceId.localeCompare(b.voiceId));

  const distinct = new Set(narrators);
  const narrator: NarratorUse =
    narrators.length === 0
      ? { mode: "default", voiceId: null, passagesWithOwn: 0 }
      : distinct.size === 1 && narrators.length === passages.length
        ? { mode: "same", voiceId: narrators[0]!, passagesWithOwn: narrators.length }
        : { mode: "mixed", voiceId: null, passagesWithOwn: narrators.length };
  return { characters, narrator };
}
