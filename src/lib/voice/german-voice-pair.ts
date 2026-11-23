/**
 * German Word Lists are spoken by two people, a woman and a man, each word by ONE of them: in a topic's
 * words (by their order) the 1st, 3rd, 5th... are the woman's and the 2nd, 4th... the man's, so a round of
 * four consecutive words has two of each. The topic's own voice (word_groups.voice_id) is the woman; this
 * module names the man who goes with her. Both are studio voices made on the owner's PC
 * (scripts/voice-studio, whose `words:<id>~f` / `~m` halves use the same rule).
 */
export const GERMAN_FEMALE_VOICE_ID = "voicestudio-8a6b1085";
export const GERMAN_MALE_VOICE_ID = "voicestudio-29633a7a";

/** The man's voice that pairs with this voice, or null when the voice has no pair (every English topic). */
export function secondVoiceFor(voiceId: string | null | undefined): string | null {
  return voiceId === GERMAN_FEMALE_VOICE_ID ? GERMAN_MALE_VOICE_ID : null;
}

/**
 * The voice that speaks the word at this position (0-based, by the word's order in its topic): for a topic
 * with a pair the woman on even positions and the man on odd ones; for any other voice, that voice.
 */
export function voiceForWordAt(
  topicVoiceId: string | null | undefined,
  position: number,
): string | null {
  if (!topicVoiceId) return null;
  const second = secondVoiceFor(topicVoiceId);
  return second && position % 2 === 1 ? second : topicVoiceId;
}
