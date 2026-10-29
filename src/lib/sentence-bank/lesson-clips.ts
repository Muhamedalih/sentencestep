import { getDefaultNormalLessonVoiceId, getDefaultVoiceId } from "@/lib/admin/voices-queries";
import { fetchStoredClips } from "@/lib/sentence-bank/clips";
import type { ClipRequest } from "@/lib/sentence-bank/clips";
import { fetchLessonVoices } from "@/lib/sentence-bank/pool";
import type { SentenceCandidate } from "@/lib/sentence-bank/select";

/**
 * Sentence bank: the stored clip of each sentence in the voice of ITS OWN lesson — the only sound the
 * exam ever plays. Never the browser's voice (the exam turns that fallback off) and never a clip
 * made for the occasion: a sentence with no stored clip simply has no entry in the result, and the
 * exam does not ask it. A lesson with no narrator of its own uses its section's default, exactly as
 * its page does. Two reads at most (the lessons' voices, then one batched clip lookup) plus the two
 * defaults when some lesson needs one; any failure answers "no clips", which means nothing is asked.
 */
export async function storedClipsFor(
  sentences: readonly Pick<SentenceCandidate, "id" | "lessonId" | "en">[],
): Promise<Map<string, string>> {
  if (sentences.length === 0) return new Map();
  return fetchStoredClips(await clipRequestsFor(sentences)).catch(() => new Map<string, string>());
}

/**
 * The clip each sentence is heard in, asked for: its text and the voice of ITS OWN lesson (see above),
 * keyed by the sentence's id. A sentence whose lesson has no voice at all is left out. The rule of the
 * day reads the voice too, because the sound of one word of a sentence is looked up under it.
 */
export async function clipRequestsFor(
  sentences: readonly Pick<SentenceCandidate, "id" | "lessonId" | "en">[],
): Promise<ClipRequest[]> {
  if (sentences.length === 0) return [];
  const lessonIds = [...new Set(sentences.map((sentence) => sentence.lessonId))];
  const voices = await fetchLessonVoices(lessonIds).catch(() => new Map());

  let normalDefault: string | null | undefined;
  let storyDefault: string | null | undefined;
  const requests: ClipRequest[] = [];
  for (const sentence of sentences) {
    const lesson = voices.get(sentence.lessonId);
    let voiceId: string | null = lesson?.voiceId ?? null;
    if (!voiceId && lesson) {
      if (lesson.mode === "normal") {
        normalDefault ??= await getDefaultNormalLessonVoiceId().catch(() => null);
        voiceId = normalDefault ?? null;
      } else {
        storyDefault ??= await getDefaultVoiceId().catch(() => null);
        voiceId = storyDefault ?? null;
      }
    }
    if (voiceId) requests.push({ key: sentence.id, text: sentence.en, voiceId });
  }
  return requests;
}
