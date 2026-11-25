/**
 * yvl i18n --id <slug> [--list] [--repo <worktree>]
 * Step 5b (after `fill`, before `check`/`build`): the Spanish and Turkish of every sentence and word, written by Claude by
 * hand (never through an API), into the repo's `src/data/videos/i18n/es.json` and `tr.json`. Arabic stays in the lesson
 * file; the app swaps in Spanish or Turkish for a learner whose support language is one of them. Without a row the page
 * quietly shows that learner Arabic, so `check --built` and `npm run test:video` fail when a row is missing.
 *
 * `--list` prints the numbered English sentences. Write `<slug>.es.txt` and `<slug>.tr.txt` in the drafts folder:
 *
 *   1
 *   t: the whole sentence in Spanish (or Turkish)
 *   g: word=significado|word=significado|...      (one pair per English word, in order, same as the Arabic `g:` line)
 *
 * then `yvl i18n --id <slug>` checks both files against the English words and merges them into the two JSON tables.
 * Nothing is written unless every sentence of both languages is complete.
 */
import fs from "node:fs";
import path from "node:path";

import {
  draftPath,
  draftsDir,
  fail,
  normalizeLesson,
  readJson,
  readLessonFile,
  requireId,
  resolveRepo,
  splitWords,
} from "../lib/util.mjs";
import { checkPairs } from "./fill.mjs";

export const LOCALES = [
  ["es", "Spanish"],
  ["tr", "Turkish"],
];

export const tablePath = (repo, locale) => path.join(repo, "src", "data", "videos", "i18n", `${locale}.json`);

/** The sentence ids the app uses (`<slug>-s<n>`) with their English, from the spec (before build) or the data file (after). */
export function lessonSentences(args, repo, id) {
  const specFile = draftPath(args, id, "spec");
  const dataFile = path.join(repo, "src", "data", "videos", `${id}.ts`);
  if (!args.built && fs.existsSync(specFile)) return readJson(specFile).sentences.map((s, i) => ({ key: `${id}-s${i + 1}`, en: s.en }));
  if (fs.existsSync(dataFile)) return readLessonFile(dataFile).sentences.map((s) => ({ key: s.id, en: s.en }));
  fail(`neither ${specFile} nor ${dataFile} exists`);
}

/** Problems of one authoring text for one language: [] when it holds a sound row for every sentence. */
export function parseLocaleText(text, sentences) {
  const problems = [];
  const blocks = new Map();
  for (const chunk of text.replace(/\r\n?/g, "\n").replace(/^﻿/, "").split(/\n\s*\n/)) {
    const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;
    if (!/^\d+$/.test(lines[0])) {
      problems.push(`unknown line "${lines[0].slice(0, 40)}"`);
      continue;
    }
    const n = Number(lines[0]);
    const block = { t: "", g: "" };
    for (const line of lines.slice(1)) {
      const m = /^(t|ar|g)\s*:\s*(.*)$/.exec(line);
      if (!m) problems.push(`sentence ${n}: unknown line "${line.slice(0, 40)}"`);
      else block[m[1] === "g" ? "g" : "t"] = m[2].trim();
    }
    if (blocks.has(n)) problems.push(`sentence ${n} appears twice`);
    blocks.set(n, block);
  }
  const rows = new Map();
  sentences.forEach((s, i) => {
    const n = i + 1;
    const block = blocks.get(n);
    if (!block) return problems.push(`sentence ${n}: missing`);
    if (!block.t) problems.push(`sentence ${n}: no t:`);
    if (!block.g) return problems.push(`sentence ${n}: no g:`);
    const bad = checkPairs(s.en, block.g);
    if (bad.length) return bad.forEach((p) => problems.push(`sentence ${n}: ${p}`));
    if (block.t) rows.set(s.key, [block.t, ...block.g.split("|").map((pair) => pair.slice(pair.indexOf("=") + 1).trim())]);
  });
  for (const n of blocks.keys()) if (n < 1 || n > sentences.length) problems.push(`sentence ${n}: there is no such sentence`);
  return { rows, problems };
}

/** The table files are one JSON row per line, CRLF, so a merge touches only the lessons' own lines. */
export function writeTable(file, table) {
  const lines = Object.entries(table).map(([key, row]) => `${JSON.stringify(key)}:${JSON.stringify(row)}`);
  fs.writeFileSync(file, `{\r\n${lines.join(",\r\n")}\r\n}\r\n`, "utf8");
}

/** Errors for `check`: a sentence of this lesson with no row, or a row with the wrong number of word meanings, in es or tr. */
export function i18nProblems(repo, sentences) {
  const problems = [];
  for (const [locale] of LOCALES) {
    const file = tablePath(repo, locale);
    const table = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {};
    const missing = [];
    for (const s of sentences) {
      const row = table[s.key];
      if (!row || row.length !== splitWords(s.en).length + 1 || row.some((x) => !String(x).trim())) missing.push(s.key.replace(/^.*-s/, "s"));
    }
    if (missing.length)
      problems.push(`i18n ${locale}: no sound row for ${missing.length} sentence(s) (${missing.slice(0, 8).join(", ")}${missing.length > 8 ? ", ..." : ""}): run yvl i18n`);
  }
  return problems;
}

export async function run(args) {
  const id = requireId(args);
  const repo = resolveRepo(args);
  const sentences = lessonSentences(args, repo, id);

  if (args.list) {
    sentences.forEach((s, i) => console.log(`${i + 1}. ${s.en}`));
    console.log(`\n${sentences.length} sentences. Write ${id}.es.txt and ${id}.tr.txt (see the header of i18n.mjs), then: yvl i18n --id ${id}`);
    return;
  }

  const parsed = [];
  let bad = 0;
  for (const [locale, name] of LOCALES) {
    const file = path.join(draftsDir(args), `${id}.${locale}.txt`);
    if (!fs.existsSync(file)) fail(`no ${file}: write the ${name} first (yvl i18n --id ${id} --list shows the sentences)`);
    const { rows, problems } = parseLocaleText(fs.readFileSync(file, "utf8"), sentences);
    if (problems.length) {
      bad += problems.length;
      console.log(`${name}: ${problems.length} problem(s)`);
      problems.slice(0, 20).forEach((p) => console.log(`  ${p}`));
    }
    parsed.push([locale, name, rows]);
  }
  if (bad) {
    console.log("nothing written");
    process.exit(1);
  }

  for (const [locale, name, rows] of parsed) {
    const file = tablePath(repo, locale);
    const table = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {};
    for (const [key, row] of rows) table[key] = row;
    writeTable(file, table);
    console.log(`${name}: ${rows.size} sentences -> ${path.relative(repo, file)}`);
  }
  console.log(`next: yvl check --id ${id}`);
}
