import { NARRATOR_ROLE } from "@/lib/passages/voice-aliases";

export type VoiceGender = "female" | "male";

/**
 * The sentence every German voice reads for the audition card in Admin → Passages: the clips
 * (voices.sample_audio_url of the German voices) were made from exactly this text.
 */
export const GERMAN_AUDITION_SENTENCE =
  "Natürlich. Es ist die Gitarre deines Großvaters. Er hat mir jedes Jahr ein Lied vorgespielt.";

/** The id prefix of a German passage: `de-<slug>` is the German version of the English passage `<slug>`. */
export const GERMAN_PASSAGE_PREFIX = "de-";

export const isGermanPassage = (passageId: string) => passageId.startsWith(GERMAN_PASSAGE_PREFIX);

/** The English passage a German one was made from, or null when this is not a German passage. */
export const englishTwinId = (passageId: string) =>
  isGermanPassage(passageId) ? passageId.slice(GERMAN_PASSAGE_PREFIX.length) : null;

export interface TwinRole {
  /** The English character (or NARRATOR_ROLE) who says the same lines. */
  twin: string;
  /** Whether that English role is a man or a woman, from the voice the English passage gives them; null when it has none. */
  gender: VoiceGender | null;
}

/**
 * Who each role of a German passage is, taken from the English passage it translates: the
 * two have the same parts and the same lines in the same order, so the character who says
 * line N in German is the one who says line N in English (the names differ: "Frau Walker" /
 * "Mrs. Walker"). An admin therefore never has to read the story to know whether a German
 * character is a woman or a man. Returns an empty map when the two don't line up (a passage
 * edited on one side only), so nothing is guessed.
 */
export function germanTwinRoles(
  german: readonly { speaker: string | null }[],
  english: readonly { speaker: string | null }[],
  genderOfEnglishRole: (role: string) => VoiceGender | null,
): Map<string, TwinRole> {
  const roles = new Map<string, TwinRole>();
  if (german.length === 0 || german.length !== english.length) return roles;

  // For each German role, how often each English role says the same line: the most frequent wins.
  const votes = new Map<string, Map<string, number>>();
  german.forEach((line, index) => {
    const mine = line.speaker ?? NARRATOR_ROLE;
    const theirs = english[index]?.speaker ?? NARRATOR_ROLE;
    const counts = votes.get(mine) ?? new Map<string, number>();
    counts.set(theirs, (counts.get(theirs) ?? 0) + 1);
    votes.set(mine, counts);
  });
  for (const [role, counts] of votes) {
    const best = [...counts].sort((a, b) => b[1] - a[1])[0];
    if (!best) continue;
    roles.set(role, { twin: best[0], gender: genderOfEnglishRole(best[0]) });
  }
  return roles;
}
