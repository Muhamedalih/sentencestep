/**
 * Records ahead of time the single words of the series episodes (src/lib/passages/series.ts) that have
 * no clip yet in the series' word voice, Emma (a free Edge-TTS voice). The scene would record a
 * missing word at the first click; run this after adding an episode so it never waits.
 * Only adds clips, through the same function the scene uses. One word at a time: Edge answers a burst
 * with HTTP 429. Re-runnable.
 *
 * Run with: npx tsx --env-file=.env.local scripts/backfill-series-word-audio.ts
 */
import { SERIES_PASSAGE_IDS } from "@/lib/passages/series";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import {
  generateIsolatedWordAudio,
  lookupReadyClips,
  lookupVoice,
} from "@/lib/voice/isolated-word-audio";
import {
  pickWordClip,
  sentenceWordEntries,
  wordTextCandidates,
} from "@/lib/voice/sentence-word-plan";

const VOICE_ID = "edge-tts-en-us-emma";
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const db = createServiceRoleClient();
  const texts: { id: string; en: string }[] = [];
  for (const passageId of SERIES_PASSAGE_IDS) {
    const { data, error } = await db
      .from("passage_sentences")
      .select("id, en")
      .like("id", `${passageId}-%`);
    if (error) throw error;
    texts.push(...data);
  }

  const voice = await lookupVoice(VOICE_ID);
  if (!voice) throw new Error(`voice ${VOICE_ID} is not registered`);
  const entries = texts.flatMap((line) => sentenceWordEntries(line.id, line.en));
  const ready = await lookupReadyClips(
    entries.flatMap((entry) => wordTextCandidates(entry.raw, entry.key)),
    [VOICE_ID],
  );
  const missing = [
    ...new Set(
      entries
        .filter(
          (entry) => !pickWordClip(wordTextCandidates(entry.raw, entry.key), [VOICE_ID], ready),
        )
        .map((entry) => entry.key),
    ),
  ];
  console.log(
    `${new Set(entries.map((entry) => entry.key)).size} words, ${missing.length} to record`,
  );

  const failed: string[] = [];
  for (const word of missing) {
    let url: string | null = null;
    for (let wait = 1500; !url && wait <= 24_000; wait *= 4) {
      await pause(wait);
      url = await generateIsolatedWordAudio(word, VOICE_ID, voice.providerVoiceId);
    }
    if (!url) failed.push(word);
    console.log(`  ${word} ${url ? "ok" : "FAILED"}`);
  }
  console.log(failed.length ? `FAILED (${failed.length}): ${failed.join(", ")}` : "ALL RECORDED");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
