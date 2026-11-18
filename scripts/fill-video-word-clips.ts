/**
 * Emma (the Word Lists voice, Edge-TTS) clips for every word the video finish screen's training round
 * can ask, for every prepared video. Additive: a word that already has a clip is left alone.
 *
 * Run with: npx tsx --env-file=.env.local scripts/fill-video-word-clips.ts
 */
import { videoLessons } from "../src/data/videos";
import { normalizeMistakeWord } from "../src/lib/mistakes/normalize";
import {
  generateWordListVoiceAudio,
  lookupWordListVoiceAudio,
} from "../src/lib/voice/word-list-word-audio";

async function main() {
  const words = new Set<string>();
  for (const lesson of videoLessons) {
    for (const sentence of lesson.sentences) {
      for (const entry of sentence.wordTranslations) {
        const word = normalizeMistakeWord(entry.en);
        if (word.length >= 3 && /^[\p{L}']+$/u.test(word)) words.add(word);
      }
    }
  }
  const all = [...words];
  const have = await lookupWordListVoiceAudio(all);
  const missing = all.filter((word) => !have.has(word));
  console.log(`${all.length} words in ${videoLessons.length} videos; ${have.size} have a clip, ${missing.length} missing`);
  for (let at = 0; at < missing.length; at += 20) {
    const batch = missing.slice(at, at + 20);
    const out = await generateWordListVoiceAudio(batch, { deadlineMs: 120_000, concurrency: 1 });
    console.log(`batch ${at / 20 + 1}: ${out.urls.size}/${batch.length} ready`, out.errors.slice(0, 3));
  }
  const after = await lookupWordListVoiceAudio(all);
  console.log(`done: ${after.size}/${all.length} words have a clip`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
