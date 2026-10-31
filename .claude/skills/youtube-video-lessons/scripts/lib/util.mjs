/**
 * Shared helpers of the youtube-video-lessons skill: arguments, repo and draft locations, the word rules
 * of the typing screen (mirrors src/lib/video-dictation/words.ts and src/lib/typing.ts), reading lesson
 * data files, and loading the repo's own import-free TypeScript modules so no rule is written twice.
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath, pathToFileURL } from "node:url";

export const HERE = path.dirname(fileURLToPath(import.meta.url));
/** .claude/skills/youtube-video-lessons */
export const SKILL_DIR = path.resolve(HERE, "..", "..");
/** Where drafts live: the same folder scripts/video-prep uses (outside the repo, never committed). */
export const TOOLS = process.env.VIDEO_PREP_HOME || "C:/Looma-tools/video-prep";

export function fail(message, code = 1) {
  console.error(`ERROR: ${message}`);
  process.exit(code);
}

/** `--key value`, `--key=value`, `--flag`, and positional arguments in `_`. */
export function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) {
      out._.push(a);
      continue;
    }
    const eq = a.indexOf("=");
    if (eq > 0) {
      out[a.slice(2, eq)] = a.slice(eq + 1);
      continue;
    }
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) out[key] = true;
    else {
      out[key] = next;
      i++;
    }
  }
  return out;
}

export function num(value, fallback) {
  const n = Number(value);
  return value !== undefined && value !== true && Number.isFinite(n) ? n : fallback;
}

/** "3.5-57.9" -> [3.5, 57.9] */
export function parseRange(text) {
  const m = /^\s*(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*$/.exec(String(text ?? ""));
  return m ? [Number(m[1]), Number(m[2])] : null;
}

export const round2 = (n) => Math.round(n * 100) / 100;
export const round1 = (n) => Math.round(n * 10) / 10;
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------- YouTube ids

const ID = /^[A-Za-z0-9_-]{11}$/;

/** The 11-character video id from a link (watch, youtu.be, shorts, embed, live) or the id itself. */
export function youtubeIdFrom(input) {
  const s = String(input ?? "").trim();
  if (ID.test(s)) return s;
  let u;
  try {
    u = new URL(s);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^(www|m)\./, "");
  if (host === "youtu.be") {
    const id = u.pathname.slice(1).split("/")[0] ?? "";
    return ID.test(id) ? id : null;
  }
  if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
    const v = u.searchParams.get("v");
    if (v && ID.test(v)) return v;
    const m = /^\/(?:shorts|embed|live|v)\/([A-Za-z0-9_-]{11})/.exec(u.pathname);
    if (m) return m[1];
  }
  return null;
}

/** A lesson slug from a title: "NASA's Earth Minute: Sea Level Rise" -> "sea-level-rise". */
export function slugify(title) {
  const tail = String(title ?? "").split(":").pop() ?? "";
  return tail
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

// ---------------------------------------------------------------- words (the typing screen's rules)

export const splitWords = (text) => text.split(/\s+/).filter((w) => w.length > 0);

/** A word without the punctuation around it, lower-cased: how a word and its meaning are matched (words.ts). */
export const bareWord = (word) =>
  word
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, "");

/** The word as the lesson file stores it in wordTranslations[].en (build.mjs `strip`). */
export const stripWord = (word) => word.replace(/^[^A-Za-z0-9']+|[^A-Za-z0-9']+$/g, "");

/** The typing screen shows these but never asks for a key (src/lib/typing.ts isAutoSkipChar). */
export const isAutoSkip = (char) => /[^\p{L}\p{N}\s]/u.test(char);

export const hasArabic = (text) => /\p{Script=Arabic}/u.test(text);

/** Letters and digits only: the keystrokes a learner really presses for a text. */
export const keystrokes = (text) => text.replace(/[^\p{L}\p{N}\s]/gu, "");

// ---------------------------------------------------------------- repo and drafts

export function isVideoRepo(dir) {
  return (
    fs.existsSync(path.join(dir, "src", "data", "videos", "index.ts")) &&
    fs.existsSync(path.join(dir, "package.json"))
  );
}

export function findRepo(start) {
  let dir = path.resolve(start);
  for (;;) {
    if (isVideoRepo(dir)) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/** The checkout to read the video code from: --repo, YVL_REPO, the current folder, or the folder holding the skill. */
export function resolveRepo(args) {
  const explicit = args.repo || process.env.YVL_REPO;
  if (explicit) {
    const dir = path.resolve(String(explicit));
    if (!isVideoRepo(dir)) fail(`--repo ${dir} has no src/data/videos/index.ts (use a worktree of origin/master)`);
    return dir;
  }
  const found = findRepo(process.cwd()) || findRepo(SKILL_DIR);
  if (!found)
    fail(
      "no checkout with src/data/videos here: run from a worktree of origin/master (git worktree add C:/Looma-<name> -b <branch> origin/master) or pass --repo <path>",
    );
  return found;
}

export function draftsDir(args) {
  const dir = path.resolve(String(args?.out || path.join(TOOLS, "drafts")));
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export const draftPath = (args, id, kind) => path.join(draftsDir(args), `${id}.${kind}.json`);

export const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
export const writeJson = (file, data) => fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);

export function requireId(args) {
  const id = args.id;
  if (typeof id !== "string" || !/^[a-z0-9-]+$/.test(id))
    fail("--id <slug> is required: lower-case letters, digits and dashes (inspect prints a suggestion)");
  return id;
}

/** The job file `inspect` writes: what later steps need to know about the video. */
export function loadJob(args, id) {
  const file = draftPath(args, id, "job");
  return fs.existsSync(file) ? readJson(file) : null;
}

// ---------------------------------------------------------------- lesson files

/** A generated (or Prettier-formatted) src/data/videos/<id>.ts is one object literal: evaluate it, never JSON.parse it. */
export function readLessonFile(file) {
  const text = fs.readFileSync(file, "utf8");
  const open = text.indexOf("= {");
  const close = text.lastIndexOf("};");
  if (open < 0 || close < 0) throw new Error(`${file}: not a video data file`);
  return vm.runInNewContext(`(${text.slice(open + 2, close + 1)})`, {});
}

export function listLessonFiles(repo) {
  const dir = path.join(repo, "src", "data", "videos");
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".ts") && f !== "index.ts")
    .map((f) => path.join(dir, f));
}

export function listLessons(repo) {
  return listLessonFiles(repo).map((file) => ({ file, lesson: readLessonFile(file) }));
}

/** One shape for a spec.json (build.mjs input) and a data file, so every check reads the same fields. */
export function normalizeLesson(raw) {
  const isData = raw.sentences?.[0] && "startSeconds" in raw.sentences[0];
  const sentences = raw.sentences.map((s, i) => {
    const en = s.en ?? "";
    let pairs = null;
    if (isData) pairs = (s.wordTranslations ?? []).map((w) => ({ key: w.en, meaning: w.ar }));
    else if (typeof s.g === "string" && s.g.trim()) {
      pairs = s.g.split("|").map((p) => {
        const at = p.indexOf("=");
        return at < 0 ? { key: p, meaning: "" } : { key: p.slice(0, at), meaning: p.slice(at + 1).trim() };
      });
    }
    return {
      n: i + 1,
      id: s.id,
      start: isData ? s.startSeconds : s.start,
      end: isData ? s.endSeconds : s.end,
      en,
      ar: s.ar ?? "",
      pairs,
    };
  });
  return {
    id: raw.id,
    youtubeId: raw.youtubeId,
    title: raw.title,
    channel: raw.channel,
    channelUrl: raw.channelUrl,
    level: raw.level,
    durationSeconds: raw.durationSeconds,
    clipStart: isData ? raw.clipStartSeconds : raw.clipStart,
    clipEnd: isData ? raw.clipEndSeconds : raw.clipEnd,
    textSource: raw.textSource,
    sourceNote: raw.sourceNote ?? "",
    sentences,
  };
}

/** Loads a repo TypeScript file that has no imports of its own (segments, words, transcript-import) with Node's type stripping. */
export async function importRepoTs(repo, rel) {
  return import(pathToFileURL(path.join(repo, rel)).href);
}

export const fmt = (n, width = 6) => (Number.isFinite(n) ? n.toFixed(2).padStart(width) : "   -  ");
