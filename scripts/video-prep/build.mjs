#!/usr/bin/env node
/**
 * Builds a Video dictation lesson file from a spec: node scripts/video-prep/build.mjs <spec.json>
 *
 * The spec is what prepare.mjs writes next to its draft (<id>.spec.json) once the Arabic and the meanings are
 * filled in. Each sentence: { start, end, en, ar, g } where g has one "word=meaning" pair per English word, in
 * order, joined by "|". The pairs are checked against the sentence (a meaning shifted by one word would label
 * every word after it wrongly). Writes src/data/videos/<id>.ts and adds the video to src/data/videos/index.ts.
 */
import fs from "node:fs";
import path from "node:path";

const DATA = path.join(process.cwd(), "src", "data", "videos");

const bare = (w) =>
  w
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, "");
const strip = (w) => w.replace(/^[^A-Za-z0-9']+|[^A-Za-z0-9']+$/g, "");

function build(spec) {
  const sentences = spec.sentences.map((s, i) => {
    const tokens = s.en.split(/\s+/).filter(Boolean);
    const pairs = s.g.split("|").map((p) => p.split("="));
    if (pairs.length !== tokens.length)
      throw new Error(`#${i + 1}: ${pairs.length} meanings for ${tokens.length} words (${s.en})`);
    if (!s.ar || !s.ar.trim()) throw new Error(`#${i + 1}: no Arabic translation`);
    const wordTranslations = tokens.map((token, k) => {
      const [key, ...rest] = pairs[k];
      const meaning = rest.join("=").trim();
      if (bare(key) !== bare(token)) throw new Error(`#${i + 1}: "${key}" is not "${token}"`);
      if (!meaning) throw new Error(`#${i + 1}: no meaning for "${token}"`);
      return { en: strip(token), ar: meaning };
    });
    return {
      id: `${spec.id}-s${i + 1}`,
      startSeconds: s.start,
      endSeconds: s.end,
      en: s.en,
      ar: s.ar,
      wordTranslations,
    };
  });
  return {
    id: spec.id,
    youtubeId: spec.youtubeId,
    title: spec.title,
    channel: spec.channel || "VOA Learning English",
    channelUrl: spec.channelUrl || "https://www.youtube.com/@VOALearningEnglish",
    level: spec.level,
    durationSeconds: spec.durationSeconds,
    clipStartSeconds: spec.clipStart,
    clipEndSeconds: spec.clipEnd,
    textSource: spec.textSource || "public-domain",
    sourceNote: spec.sourceNote,
    sentences,
  };
}

function updateIndex(id) {
  const exportName = id.replace(/-([a-z0-9])/g, (_m, c) => c.toUpperCase());
  const indexFile = path.join(DATA, "index.ts");
  let text = fs.readFileSync(indexFile, "utf8");
  if (!text.includes(`from "./${id}"`)) {
    text = text.replace(/(import type [^\n]+\n)/, `$1import { ${exportName} } from "./${id}";\n`);
    // The list may already be formatted over several lines with a trailing comma: split it, never append to it.
    text = text.replace(/\[([^\]]*)\];/, (_all, list) => {
      const items = list
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      return `[${[...items, exportName].join(", ")}];`;
    });
    fs.writeFileSync(indexFile, text);
  }
  return exportName;
}

const specPath = process.argv[2];
if (!specPath) {
  console.log("usage: node scripts/video-prep/build.mjs <spec.json>   (run from the repo root)");
  process.exit(1);
}
const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
const lesson = build(spec);
const exportName = updateIndex(spec.id);
const ts = `import type { VideoLesson } from "@/lib/video-dictation/types";\n\nexport const ${exportName}: VideoLesson = ${JSON.stringify(lesson, null, 2)};\n`;
fs.writeFileSync(path.join(DATA, `${spec.id}.ts`), ts);
console.log(
  `${spec.id}: ${lesson.sentences.length} sentences written to src/data/videos/${spec.id}.ts`,
);
