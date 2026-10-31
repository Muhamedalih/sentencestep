#!/usr/bin/env node
/**
 * One entry point for the youtube-video-lessons skill:
 *   node .claude/skills/youtube-video-lessons/scripts/yvl.mjs <command> [options]
 * Commands, in workflow order: inspect, capture, split, plan, fill, check, build, verify.
 * Every command prints a short readout and keeps its working files in <VIDEO_PREP_HOME>/drafts
 * (default C:/Looma-tools/video-prep/drafts), outside the repo.
 */
import { parseArgs } from "./lib/util.mjs";

// Node prints a notice when it loads the repo's .ts files without a "type" field; the notices say nothing useful here.
process.removeAllListeners("warning");

const COMMANDS = {
  inspect: ["inspect.mjs", "link/id -> title, channel, embeddable?, duplicate?, slug (step 1)"],
  capture: ["capture.mjs", "play once in the official embed: loudness + caption words, numbers only (step 2)"],
  split: ["split.mjs", "captions/transcript/text -> short sentences, punctuation kept (step 3)"],
  plan: ["plan.mjs", "sentences + loudness -> start/end of every sentence, spec.json, listen list (step 4)"],
  fill: ["fill.mjs", "<slug>.ar.txt (Arabic + meanings + metadata) -> spec.json (step 5)"],
  check: ["check.mjs", "static gates: schema, timeline, text, meanings, coverage, audio consistency (step 6)"],
  build: ["build.mjs", "spec -> src/data/videos/<slug>.ts through the repo's own build.mjs, then the repo tests (step 7)"],
  verify: ["verify.mjs", "play the lesson in the official embed with the app's stop rules; report every stop (step 8)"],
  flow: ["flow.mjs", "the REAL practice page end to end: play, stop, type, resume, finish screen (step 9)"],
};

const [name, ...rest] = process.argv.slice(2);
if (!name || name === "help" || !COMMANDS[name]) {
  console.log("usage: node .claude/skills/youtube-video-lessons/scripts/yvl.mjs <command> [options]\n");
  for (const [key, [, about]] of Object.entries(COMMANDS)) console.log(`  ${key.padEnd(8)} ${about}`);
  console.log("\ncommon options: --id <slug>  --repo <worktree>  --out <drafts folder>");
  process.exit(name && name !== "help" ? 1 : 0);
}

try {
  const mod = await import(`./cmd/${COMMANDS[name][0]}`);
  await mod.run(parseArgs(rest));
} catch (error) {
  console.error(`ERROR: ${error && error.message ? error.message : error}`);
  if (process.env.YVL_DEBUG) console.error(error);
  process.exit(1);
}
