/**
 * Command-line twin of the control panel: makes one lesson's clips with a registered VoiceStudio voice.
 *   npm run voice:fill -- --lesson=normal-5 --voice=voicestudio-5f7a4bb4 [--scope=both|sentences|words] [--dry]
 * Additive only; every clip is checked by Whisper (see lib.ts). It never changes which voice a lesson uses —
 * that is the panel's step 4.
 */
import { clipStates, connect, makeClip, planLesson, siteVoices, voiceStudioHealth } from "./lib";

const value = (name: string) =>
  process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);

async function main() {
  const lessonId = value("lesson");
  const voiceId = value("voice");
  const scope = value("scope") ?? "both";
  if (!lessonId || !voiceId)
    throw new Error("Pass --lesson=<id> and --voice=<site voice id> (the panel lists them).");
  const db = connect();
  const voice = (await siteVoices(db)).find((v) => v.id === voiceId);
  if (!voice)
    throw new Error(
      `No VoiceStudio voice "${voiceId}" on the site. Known: ${(await siteVoices(db)).map((v) => v.id).join(", ") || "none"}`,
    );
  const plan = await planLesson(db, lessonId);
  const todo = (await clipStates(db, plan, voice.id)).filter(
    (c) =>
      c.status !== "ready" &&
      (scope === "both" || (scope === "sentences") === (c.kind === "sentence")),
  );
  console.log(
    `${plan.lesson.title} (${lessonId}): ${plan.sentences.length} sentences, ${plan.words.length} words — ${todo.length} clip(s) to make with ${voice.name}.`,
  );
  if (process.argv.includes("--dry") || todo.length === 0) return;
  if (!(await voiceStudioHealth()))
    throw new Error("VoiceStudio is not answering on port 3900 — open the app first.");

  const counts = { generated: 0, skipped: 0, failed: 0, unverified: 0 };
  for (const [index, clip] of todo.entries()) {
    const result = await makeClip(db, voice, clip.kind, clip.text);
    counts[result.outcome] += 1;
    if (result.outcome === "generated" && !result.verified) {
      counts.unverified += 1;
      console.log(`   not verified: "${clip.text}" (heard "${result.heard}")`);
    }
    if (result.outcome === "failed") console.log(`   FAILED "${clip.text}": ${result.error}`);
    if ((index + 1) % 10 === 0 || index + 1 === todo.length)
      console.log(`${index + 1}/${todo.length}`, counts);
  }
  console.log("Done.", counts);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
