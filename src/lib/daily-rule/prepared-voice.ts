/**
 * The two voices that read the prepared sentences of a rule (prepared.ts: the sentences a rule is taught and
 * asked with when the learner's own texts do not show it). The owner chose to split them half and half between the
 * Stories narrator (ElevenLabs, "The Pharaoh 4 - Narration & Audio books") and Emma (Edge-TTS, the voice of the
 * Word Lists): the 1st, 3rd and 5th sentence of a rule are read by the first, the 2nd, 4th and 6th by Emma, so every
 * rule has both and the voice of a sentence never depends on a setting that can be changed later.
 *
 * The two ids are pinned here on purpose (not read from the site's voice settings): a recording is stored under
 * the voice that made it, so repointing "the Stories voice" or "the Word Lists voice" in the admin must not silence
 * half of the rules' sentences. Changing a voice here means recording the sentences again
 * (scripts/generate-rule-sentence-audio.ts only fills the sentences that have no recording under the new voice).
 */

/** "The Pharaoh 4 - Narration & Audio books", the ElevenLabs voice of the Stories narration. */
export const PREPARED_PREMIUM_VOICE_ID = "elevenlabs-j2fglqg8gd7x8uedt2h8";

/** Emma, the free Edge-TTS voice of the Word Lists. */
export const PREPARED_FREE_VOICE_ID = "edge-tts-en-us-emma";

export type PreparedNarrator = "premium" | "free";

/** Who reads the prepared sentence at this place in its rule (0 is the first one written): the premium voice reads the even places. */
export function preparedNarratorAt(index: number): PreparedNarrator {
  return index % 2 === 0 ? "premium" : "free";
}

export function preparedVoiceIdOf(narrator: PreparedNarrator): string {
  return narrator === "premium" ? PREPARED_PREMIUM_VOICE_ID : PREPARED_FREE_VOICE_ID;
}

/** The voice that reads a prepared sentence, from its id (`prep:<rule>:<place>`, see preparedSentenceId): Emma when the id has no place. */
export function preparedVoiceIdFor(sentenceId: string): string {
  const place = Number(sentenceId.split(":")[2]);
  return preparedVoiceIdOf(Number.isInteger(place) ? preparedNarratorAt(place) : "free");
}
