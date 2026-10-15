import type { PassageVoiceAlias } from "@/data/passages/types";

/**
 * The registered ElevenLabs voices (`voices` table ids) behind the aliases an
 * authored passage's cast uses. They are read once, when a passage is written
 * to the database (scripts/insert-passages.ts, the admin's JSON import): each
 * character gets a passage_speaker_voices row, and from then on that row — which
 * the admin changes in Admin -> Passages — is the only thing that decides who
 * speaks. "narrator" is not listed: the narrator is the site's default
 * Stories/Books narration voice (elevenlabs_settings.default_story_voice_id)
 * until the admin gives a passage a narrator of its own.
 */
export const PASSAGE_VOICE_IDS: Record<Exclude<PassageVoiceAlias, "narrator">, string> = {
  russ: "elevenlabs-hkfob9iktha85ukxydrt", // Russ — deep, smooth, articulate (male)
  "calm-male": "elevenlabs-vu16bytywswv5jpi8rbc", // Ash — calm, soothing narrative (male)
  zara: "elevenlabs-jqcczkn6knx8bj5tbdyr", // Zara — warm, real-world conversationalist (female)
  ash: "elevenlabs-m3yahyfefktbcim5n7gf", // Ash — conversational, kind and bright (female)
  autumn: "elevenlabs-kovihoyldrqyd4pgalbs", // Autumn Veil — warm and reflective (female)
};

/**
 * The `speaker` under which passage_speaker_voices keeps the voice that reads the
 * story itself (every line no character says). A character can never be called
 * this (see validatePassageSeed), so the two can't be mixed up.
 */
export const NARRATOR_ROLE = "narrator";
