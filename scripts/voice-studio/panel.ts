/**
 * The local control panel for the VoiceStudio -> SentenceStep pipeline. Run it with
 *   npm run voice:panel            (or double-click "SentenceStep Voice Studio" on the desktop)
 * and use the page that opens (http://127.0.0.1:4410). It listens on this PC only, uses the service key
 * from .env.local and the VoiceStudio app that is already open on port 3900.
 *
 * What it can do (all of it also visible in the page):
 *   - make a lesson's sentences + every word, one by one, with a chosen voice, each clip CHECKED by Whisper;
 *   - redo a single clip that sounds wrong;
 *   - put a new VoiceStudio profile on the site as a voice (the gender is chosen, never guessed);
 *   - point a lesson at a voice — only when that voice already has EVERY clip of the lesson — and undo it.
 * Making clips is additive (nothing else is read or changed). Pointing a lesson at a voice is the one step a
 * learner can hear, so it asks first and remembers the voice it replaced.
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  clipStates,
  connect,
  coverage,
  listAppProfiles,
  makeClip,
  planLesson,
  registerVoice,
  siteVoices,
  voiceStudioHealth,
  type ClipKind,
  type Db,
  type SiteVoice,
} from "./lib";

const here = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.VOICE_PANEL_PORT ?? 4410);
const HISTORY_FILE = join(here, "..", "..", "reports", "voice-studio-history.json");
const db: Db = connect();

// ---------------------------------------------------------------------------------------------
// Job (one at a time: the GPU makes one clip at a time anyway)
// ---------------------------------------------------------------------------------------------

interface Job {
  lessonId: string;
  voiceId: string;
  total: number;
  done: number;
  generated: number;
  skipped: number;
  failed: number;
  unverified: number;
  retried: number;
  state: "running" | "done" | "stopped" | "error";
  current: string;
  log: string[];
  stop: boolean;
  startedAt: number;
}
let job: Job | null = null;

async function runJob(lessonId: string, voice: SiteVoice, scope: "both" | "sentences" | "words") {
  const plan = await planLesson(db, lessonId);
  const states = await clipStates(db, plan, voice.id);
  const todo = states.filter(
    (s) =>
      s.status !== "ready" &&
      (scope === "both" || (scope === "sentences") === (s.kind === "sentence")),
  );
  job = {
    lessonId,
    voiceId: voice.id,
    total: todo.length,
    done: 0,
    generated: 0,
    skipped: 0,
    failed: 0,
    unverified: 0,
    retried: 0,
    state: "running",
    current: "",
    log: [],
    stop: false,
    startedAt: Date.now(),
  };
  const mine = job;
  void (async () => {
    try {
      for (const clip of todo) {
        if (mine.stop) {
          mine.state = "stopped";
          return;
        }
        mine.current = clip.text;
        const result = await makeClip(db, voice, clip.kind, clip.text);
        mine.done += 1;
        if (result.outcome === "generated") {
          mine.generated += 1;
          if ((result.attempts ?? 1) > 1) mine.retried += 1;
          if (!result.verified) {
            mine.unverified += 1;
            mine.log.push(
              `لم يتأكد الفحص: «${clip.text}» (سمع: «${result.heard ?? ""}») — اضغط «أعد» عليه`,
            );
          }
        } else if (result.outcome === "skipped") mine.skipped += 1;
        else {
          mine.failed += 1;
          mine.log.push(`فشل «${clip.text}»: ${result.error ?? ""}`);
        }
      }
      mine.state = "done";
      mine.current = "";
    } catch (error) {
      mine.state = "error";
      mine.log.push(error instanceof Error ? error.message : String(error));
    }
  })();
}

// ---------------------------------------------------------------------------------------------
// History of "this lesson now uses that voice" so it can be undone
// ---------------------------------------------------------------------------------------------

interface HistoryEntry {
  at: string;
  lessonId: string;
  from: string | null;
  to: string;
  undone?: boolean;
}
function readHistory(): HistoryEntry[] {
  try {
    return existsSync(HISTORY_FILE)
      ? (JSON.parse(readFileSync(HISTORY_FILE, "utf8")) as HistoryEntry[])
      : [];
  } catch {
    return [];
  }
}
function writeHistory(entries: HistoryEntry[]) {
  mkdirSync(dirname(HISTORY_FILE), { recursive: true });
  writeFileSync(HISTORY_FILE, JSON.stringify(entries, null, 2), "utf8");
}

// ---------------------------------------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------------------------------------

const ID = /^[A-Za-z0-9._-]{1,80}$/;

function send(
  res: ServerResponse,
  status: number,
  body: unknown,
  type = "application/json; charset=utf-8",
) {
  res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
  res.end(typeof body === "string" ? body : JSON.stringify(body));
}

async function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const text = Buffer.concat(chunks).toString("utf8");
  return text ? (JSON.parse(text) as Record<string, unknown>) : {};
}

async function allLessons() {
  const rows: {
    id: string;
    mode: string;
    title: string;
    status: string;
    voice_id: string | null;
    order_index: number | null;
  }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db
      .from("lessons")
      .select("id, mode, title, status, voice_id, order_index")
      .order("mode")
      .order("order_index")
      .range(from, from + 999);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

async function pickVoice(voiceId: unknown): Promise<SiteVoice> {
  if (typeof voiceId !== "string" || !ID.test(voiceId)) throw new Error("اختر الصوت أولاً.");
  const voice = (await siteVoices(db)).find((v) => v.id === voiceId);
  if (!voice) throw new Error("هذا الصوت غير مسجّل في الموقع.");
  return voice;
}

async function route(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? "/", `http://127.0.0.1:${PORT}`);
  const path = url.pathname;
  try {
    if (req.method === "GET" && path === "/") {
      return send(
        res,
        200,
        readFileSync(join(here, "panel.html"), "utf8"),
        "text/html; charset=utf-8",
      );
    }
    if (req.method === "GET" && path === "/api/status") {
      const [health, voices] = await Promise.all([voiceStudioHealth(), siteVoices(db)]);
      let profiles: Awaited<ReturnType<typeof listAppProfiles>> = [];
      if (health) profiles = await listAppProfiles().catch(() => []);
      const known = new Set(voices.map((v) => v.provider_voice_id));
      return send(res, 200, {
        voiceStudio: health,
        voices: voices.filter((v) => v.id !== "voicestudio-alloy"),
        unregistered: profiles.filter((p) => !known.has(p.id) && !/^demo/i.test(p.id)),
        history: readHistory().slice(-12).reverse(),
      });
    }
    if (req.method === "GET" && path === "/api/lessons") {
      const [lessons, voices] = await Promise.all([
        allLessons(),
        db.from("voices").select("id, name"),
      ]);
      const names = new Map((voices.data ?? []).map((v) => [v.id, v.name]));
      return send(
        res,
        200,
        lessons.map((l) => ({
          ...l,
          voice: l.voice_id ? (names.get(l.voice_id) ?? l.voice_id) : null,
        })),
      );
    }
    if (req.method === "GET" && path === "/api/lesson") {
      const lessonId = url.searchParams.get("id") ?? "";
      const voiceId = url.searchParams.get("voice") ?? "";
      if (!ID.test(lessonId)) throw new Error("درس غير صالح.");
      const plan = await planLesson(db, lessonId);
      const states = ID.test(voiceId) ? await clipStates(db, plan, voiceId) : [];
      return send(res, 200, {
        lesson: plan.lesson,
        sentences: plan.sentences.length,
        words: plan.words.length,
        clips: states,
        coverage: states.length ? coverage(states) : null,
      });
    }
    if (req.method === "POST" && path === "/api/generate") {
      if (job?.state === "running") throw new Error("يوجد توليد شغّال الآن. انتظر أو اضغط إيقاف.");
      const body = await readBody(req);
      if (typeof body.lessonId !== "string" || !ID.test(body.lessonId))
        throw new Error("اختر الدرس أولاً.");
      if (!(await voiceStudioHealth()))
        throw new Error("برنامج VoiceStudio غير مفتوح. افتحه ثم أعد المحاولة.");
      const voice = await pickVoice(body.voiceId);
      const scope = body.scope === "sentences" || body.scope === "words" ? body.scope : "both";
      await runJob(body.lessonId, voice, scope);
      return send(res, 200, { ok: true });
    }
    if (req.method === "POST" && path === "/api/stop") {
      if (job) job.stop = true;
      return send(res, 200, { ok: true });
    }
    if (req.method === "GET" && path === "/api/job") {
      return send(
        res,
        200,
        job ? { ...job, seconds: Math.round((Date.now() - job.startedAt) / 1000) } : null,
      );
    }
    if (req.method === "POST" && path === "/api/redo") {
      const body = await readBody(req);
      const kind = body.kind === "word" ? "word" : "sentence";
      if (typeof body.text !== "string" || !body.text.trim()) throw new Error("لا يوجد نص.");
      if (!(await voiceStudioHealth())) throw new Error("برنامج VoiceStudio غير مفتوح.");
      const voice = await pickVoice(body.voiceId);
      // Only a clip that belongs to the lesson on screen may be redone.
      if (typeof body.lessonId !== "string" || !ID.test(body.lessonId))
        throw new Error("درس غير صالح.");
      const plan = await planLesson(db, body.lessonId);
      const allowed =
        kind === "word"
          ? plan.words.includes(body.text)
          : plan.sentences.some((s) => s.en === body.text);
      if (!allowed) throw new Error("هذا النص ليس من هذا الدرس.");
      const result = await makeClip(db, voice, kind as ClipKind, body.text, { redo: true });
      return send(res, 200, result);
    }
    if (req.method === "POST" && path === "/api/register-voice") {
      const body = await readBody(req);
      if (typeof body.profileId !== "string" || !ID.test(body.profileId))
        throw new Error("صوت غير صالح.");
      if (body.gender !== "female" && body.gender !== "male") throw new Error("اختر: أنثى أو ذكر.");
      const profile = (await listAppProfiles()).find((p) => p.id === body.profileId);
      if (!profile) throw new Error("هذا الصوت غير موجود في VoiceStudio.");
      const voice = await registerVoice(
        db,
        profile,
        body.gender,
        typeof body.name === "string" ? body.name : undefined,
      );
      return send(res, 200, voice);
    }
    if (req.method === "POST" && path === "/api/use-voice") {
      const body = await readBody(req);
      if (body.confirm !== true) throw new Error("يلزم التأكيد.");
      if (typeof body.lessonId !== "string" || !ID.test(body.lessonId))
        throw new Error("درس غير صالح.");
      const voice = await pickVoice(body.voiceId);
      const plan = await planLesson(db, body.lessonId);
      const states = await clipStates(db, plan, voice.id);
      const cover = coverage(states);
      if (cover.missing.length > 0)
        throw new Error(
          `لا يمكن: ينقص ${cover.missing.length} مقطع من ${cover.total}. ولّدها أولاً.`,
        );
      const from = plan.lesson.voice_id;
      if (from === voice.id) throw new Error("الدرس يستخدم هذا الصوت أصلاً.");
      const { error } = await db
        .from("lessons")
        .update({ voice_id: voice.id })
        .eq("id", body.lessonId);
      if (error) throw error;
      writeHistory([
        ...readHistory(),
        { at: new Date().toISOString(), lessonId: body.lessonId, from, to: voice.id },
      ]);
      return send(res, 200, { ok: true, from });
    }
    if (req.method === "POST" && path === "/api/undo-voice") {
      const body = await readBody(req);
      const history = readHistory();
      const index = history
        .map((h, i) => ({ h, i }))
        .reverse()
        .find(({ h }) => h.lessonId === body.lessonId && !h.undone)?.i;
      if (index === undefined) throw new Error("لا يوجد تغيير يمكن التراجع عنه لهذا الدرس.");
      const entry = history[index]!;
      const { data: now } = await db
        .from("lessons")
        .select("voice_id")
        .eq("id", entry.lessonId)
        .maybeSingle();
      if (now?.voice_id !== entry.to)
        throw new Error("صوت الدرس تغيّر بعدها من مكان آخر؛ لن أتراجع تلقائياً.");
      const { error } = await db
        .from("lessons")
        .update({ voice_id: entry.from })
        .eq("id", entry.lessonId);
      if (error) throw error;
      history[index] = { ...entry, undone: true };
      writeHistory(history);
      return send(res, 200, { ok: true, restored: entry.from });
    }
    send(res, 404, { error: "not found" });
  } catch (error) {
    send(res, 400, { error: error instanceof Error ? error.message : String(error) });
  }
}

createServer((req, res) => void route(req, res)).listen(PORT, "127.0.0.1", () => {
  const url = `http://127.0.0.1:${PORT}`;
  console.log(`SentenceStep Voice Studio panel: ${url}  (Ctrl+C to close)`);
  if (!process.argv.includes("--no-open")) {
    spawn("powershell", ["-NoProfile", "-Command", `Start-Process '${url}'`], {
      stdio: "ignore",
      detached: true,
    }).unref();
  }
});
