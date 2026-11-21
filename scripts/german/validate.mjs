// Checks a German content file before it is inserted (Phase 1 tooling, no API, no database).
//   node scripts/german/validate.mjs scripts/german/content/normal-02-06.mjs
// Needs nspell + dictionary-de (npm). They are not project dependencies; point GERMAN_TOOLS at a folder
// that has them in node_modules (default: the tools folder next to this script's repo, see below).
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const toolsDir = process.env.GERMAN_TOOLS;
if (!toolsDir) {
  console.error("Set GERMAN_TOOLS to a folder whose node_modules has nspell and dictionary-de.");
  process.exit(1);
}
const toolsRequire = createRequire(path.join(toolsDir, "x.js"));
const nspell = toolsRequire("nspell");
const dict = (await import(pathToFileURL(toolsRequire.resolve("dictionary-de")).href)).default;
const spell = nspell(dict);

// Words the Hunspell dictionary lacks but are correct German (compounds, names): one per line.
const allowFile = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\//, "")), "allow.txt");
const allow = new Set(
  fs.existsSync(allowFile) ? fs.readFileSync(allowFile, "utf8").split(/\s+/).filter(Boolean) : [],
);

const mod = await import(pathToFileURL(path.resolve(process.argv[2])).href);
const lessons = mod.lessons ?? [mod.lesson];

let problems = 0;
let totalWords = 0;
const lexicon = {};
for (const lesson of lessons) {
  for (const s of lesson.sentences) {
    const words = s.de.trim().split(/\s+/);
    totalWords += words.length;
    const bad = (m) => {
      problems++;
      console.log(`x ${lesson.sourceId} ${s.src}: ${m}`);
    };
    if (words.length !== s.gl.length) bad(`${words.length} words but ${s.gl.length} glosses`);
    s.gl.forEach((g, i) => {
      if (!g || !g.trim()) bad(`empty gloss at ${i}`);
      else if (/[A-Za-z]/.test(g)) bad(`Latin letters in gloss "${g}"`);
      else if (g !== g.trim() || /\s{2}/.test(g)) bad(`odd spacing in gloss "${g}"`);
      const key = (words[i] || "").toLowerCase().replace(/[^\p{L}]/gu, "");
      (lexicon[key] ||= new Set()).add(g);
    });
    for (const w of words) {
      const bare = w.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, "");
      if (!bare || allow.has(bare) || allow.has(bare.toLowerCase())) continue;
      const ok =
        spell.correct(bare) ||
        spell.correct(bare.toLowerCase()) ||
        spell.correct(bare[0].toUpperCase() + bare.slice(1));
      if (!ok) bad(`spelling? "${bare}" (${spell.suggest(bare).slice(0, 3).join(", ")})`);
    }
    if (!/^[^p{L}]*[A-ZÄÖÜ]/u.test(s.de)) bad("does not start with a capital");
  }
}
console.log(`${lessons.length} lessons, ${totalWords} words, ${problems} problem(s)`);
console.log("German words glossed differently in different places (review, then settle or keep):");
for (const [k, v] of Object.entries(lexicon)) {
  if (v.size > 1 && v.size <= 4) console.log(`  ${k}: ${[...v].join(" | ")}`);
}
process.exit(problems ? 1 : 0);
