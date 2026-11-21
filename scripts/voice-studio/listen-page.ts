/**
 * Builds a local listening page (reports/voice-studio-trial.html) for the lessons given with --lesson:
 * every sentence and word with the VoiceStudio clip next to the clip the site plays today (when one exists),
 * so the two can be compared by ear. Read-only against the database.
 *   npx tsx --env-file=.env.local scripts/voice-studio/listen-page.ts --lesson=normal-1 [--voice-id=voicestudio-alloy]
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { cacheKeyParts } from "../../src/lib/voice/resolution";
import { sentenceWordEntries } from "../../src/lib/voice/sentence-word-plan";
import { all } from "../_readout-rest";

const value = (name: string) =>
  process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const voiceId = value("voice-id") ?? "voicestudio-alloy";
const lessonIds = (value("lesson") ?? "").split(",").filter(Boolean);

interface Clip {
  voice_id: string;
  text_hash: string;
  audio_url: string;
}
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

async function clipsFor(hashes: string[]): Promise<Clip[]> {
  const rows: Clip[] = [];
  for (let i = 0; i < hashes.length; i += 40) {
    rows.push(
      ...(await all<Clip>(
        `voice_audio_cache?text_hash=in.(${hashes.slice(i, i + 40).join(",")})&status=eq.ready&audio_url=not.is.null&select=voice_id,text_hash,audio_url&order=id`,
      )),
    );
  }
  return rows;
}

async function main() {
  if (lessonIds.length === 0) throw new Error("Pass --lesson=<id>");
  const sentences = await all<{ id: string; en: string }>(
    `sentences?lesson_id=in.(${lessonIds.join(",")})&select=id,en&order=lesson_id,order_index`,
  );
  const words = new Set<string>();
  for (const s of sentences) for (const e of sentenceWordEntries(s.id, s.en)) words.add(e.key);

  const sentenceHash = (t: string) => cacheKeyParts(t, voiceId, "").textHash;
  const wanted = [...sentences.map((s) => sentenceHash(s.en)), ...[...words].map(sentenceHash)];
  const clips = await clipsFor([...new Set(wanted)]);
  const mine = (hash: string) =>
    clips.find((c) => c.voice_id === voiceId && c.text_hash === hash)?.audio_url;
  const old = (hash: string) => clips.find((c) => c.voice_id !== voiceId && c.text_hash === hash);

  const player = (label: string, url?: string) =>
    url
      ? `<span class="p"><b>${label}</b><audio controls preload="none" src="${esc(url)}"></audio></span>`
      : `<span class="p none"><b>${label}</b> —</span>`;
  const row = (text: string, hash: string) => {
    const o = old(hash);
    return `<div class="r"><div class="t">${esc(text)}</div>${player("VoiceStudio", mine(hash))}${player(o ? `الحالي (${o.voice_id})` : "الحالي", o?.audio_url)}</div>`;
  };

  const doneSentences = sentences.filter((s) => mine(sentenceHash(s.en))).length;
  const doneWords = [...words].filter((w) => mine(sentenceHash(w))).length;
  const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>تجربة صوت VoiceStudio</title><style>
body{font-family:system-ui,Segoe UI,Tahoma,sans-serif;max-width:900px;margin:24px auto;padding:0 16px;background:#fafafa;color:#222}
h1{font-size:20px}h2{font-size:16px;margin-top:28px}.r{background:#fff;border:1px solid #e5e5e5;border-radius:8px;padding:10px 12px;margin:8px 0}
.t{direction:ltr;text-align:left;font-size:15px;margin-bottom:6px}.p{display:inline-flex;align-items:center;gap:8px;margin-inline-end:16px}.none{color:#999}
audio{height:32px;max-width:260px}.w{display:inline-block;margin:4px}</style></head><body>
<h1>تجربة صوت VoiceStudio — ${esc(lessonIds.join(", "))}</h1>
<p>${doneSentences}/${sentences.length} جملة، ${doneWords}/${words.size} كلمة. تجربة محلية فقط: لا شيء منها يُسمع في الموقع.</p>
<h2>الجمل</h2>${sentences.map((s) => row(s.en, sentenceHash(s.en))).join("\n")}
<h2>الكلمات (كل كلمة وحدها)</h2>${[...words]
    .sort()
    .map((w) => row(w, sentenceHash(w)))
    .join("\n")}
</body></html>`;
  mkdirSync("reports", { recursive: true });
  writeFileSync("reports/voice-studio-trial.html", html, "utf8");
  console.log(
    `reports/voice-studio-trial.html — ${doneSentences}/${sentences.length} sentences, ${doneWords}/${words.size} words`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
