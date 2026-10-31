/**
 * yvl fill --id <slug> [--list] [--file <path>]
 * Step 5: puts the Arabic and the word meanings (which Claude writes by hand, never through an API) into the spec.
 * `--list` prints the numbered English sentences to translate. The authoring file <slug>.ar.txt (UTF-8) is:
 *
 *   level: B1
 *   textSource: public-domain
 *   sourceNote: One line: who made it, the rights basis with a link, where the text came from, how the stops were found.
 *
 *   1
 *   ar: the whole sentence in Arabic
 *   g: NASA=ناسا|has=قد|sent=أرسلت|...        (one word=meaning pair per English word, in order)
 *
 *   2
 *   ...
 *
 * Header keys allowed: level, textSource, sourceNote, title, channel, channelUrl, durationSeconds, clipStart, clipEnd.
 * Nothing is written unless every sentence is complete and every word has exactly one meaning.
 */
import fs from "node:fs";
import path from "node:path";

import {
  bareWord,
  draftPath,
  draftsDir,
  fail,
  hasArabic,
  readJson,
  requireId,
  splitWords,
  writeJson,
} from "../lib/util.mjs";

const HEADER_KEYS = ["level", "textSource", "sourceNote", "title", "channel", "channelUrl", "durationSeconds", "clipStart", "clipEnd"];
const NUMERIC = new Set(["durationSeconds", "clipStart", "clipEnd"]);

/** Parses the authoring text into { header, blocks: Map(n -> { ar, g }) } plus the problems found. */
export function parseAuthoring(text) {
  const header = {};
  const blocks = new Map();
  const problems = [];
  const chunks = text.replace(/\r\n?/g, "\n").replace(/^﻿/, "").split(/\n\s*\n/);
  for (const chunk of chunks) {
    const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;
    if (/^\d+$/.test(lines[0])) {
      const n = Number(lines[0]);
      const block = { ar: "", g: "" };
      for (const line of lines.slice(1)) {
        const m = /^(ar|g)\s*:\s*(.*)$/.exec(line);
        if (!m) problems.push(`sentence ${n}: unknown line "${line.slice(0, 40)}"`);
        else block[m[1]] = m[2].trim();
      }
      if (blocks.has(n)) problems.push(`sentence ${n} appears twice`);
      blocks.set(n, block);
      continue;
    }
    for (const line of lines) {
      const m = /^([A-Za-z]+)\s*:\s*(.*)$/.exec(line);
      if (!m || !HEADER_KEYS.includes(m[1])) {
        problems.push(`header: unknown line "${line.slice(0, 50)}"`);
        continue;
      }
      header[m[1]] = NUMERIC.has(m[1]) ? Number(m[2]) : m[2].trim();
    }
  }
  return { header, blocks, problems };
}

/** The pairs of one `g` line checked against its English sentence; returns the problems (empty = sound). */
export function checkPairs(en, g) {
  const tokens = splitWords(en);
  const pairs = g.split("|");
  const problems = [];
  if (pairs.length !== tokens.length) {
    problems.push(`${pairs.length} meanings for ${tokens.length} words`);
    return problems;
  }
  pairs.forEach((pair, k) => {
    const at = pair.indexOf("=");
    const key = at < 0 ? pair : pair.slice(0, at);
    const meaning = at < 0 ? "" : pair.slice(at + 1).trim();
    if (bareWord(key) !== bareWord(tokens[k])) problems.push(`word ${k + 1} is "${tokens[k]}" but the pair is for "${key}"`);
    else if (!meaning) problems.push(`no meaning for "${tokens[k]}"`);
  });
  return problems;
}

export async function run(args) {
  const id = requireId(args);
  const specFile = draftPath(args, id, "spec");
  if (!fs.existsSync(specFile)) fail(`no ${specFile}: run plan first`);
  const spec = readJson(specFile);

  if (args.list) {
    spec.sentences.forEach((s, i) => console.log(`${i + 1}. ${s.en}`));
    console.log(`\n${spec.sentences.length} sentences. Write ${id}.ar.txt (see the header of fill.mjs), then: yvl fill --id ${id}`);
    return;
  }

  const file = args.file ? String(args.file) : path.join(draftsDir(args), `${id}.ar.txt`);
  if (!fs.existsSync(file)) fail(`no ${file}: write it first (yvl fill --id ${id} --list shows the sentences)`);
  const { header, blocks, problems } = parseAuthoring(fs.readFileSync(file, "utf8"));

  spec.sentences.forEach((s, i) => {
    const n = i + 1;
    const block = blocks.get(n);
    if (!block) {
      problems.push(`sentence ${n}: missing`);
      return;
    }
    if (!block.ar) problems.push(`sentence ${n}: no ar:`);
    else if (!hasArabic(block.ar)) problems.push(`sentence ${n}: ar: has no Arabic letters`);
    if (!block.g) problems.push(`sentence ${n}: no g:`);
    else for (const p of checkPairs(s.en, block.g)) problems.push(`sentence ${n}: ${p}`);
  });
  for (const n of blocks.keys()) if (n < 1 || n > spec.sentences.length) problems.push(`sentence ${n}: there is no such sentence`);
  if (problems.length) {
    console.log(`${problems.length} problem(s), nothing written:`);
    problems.slice(0, 25).forEach((p) => console.log(`  ${p}`));
    if (problems.length > 25) console.log(`  ... ${problems.length - 25} more`);
    process.exit(1);
  }

  Object.assign(spec, header);
  spec.sentences.forEach((s, i) => {
    const block = blocks.get(i + 1);
    s.ar = block.ar;
    s.g = block.g;
  });
  writeJson(specFile, spec);
  console.log(`filled ${spec.sentences.length} sentences${Object.keys(header).length ? ` and ${Object.keys(header).join(", ")}` : ""} -> ${specFile}`);
  console.log(`next: yvl check --id ${id}`);
}
