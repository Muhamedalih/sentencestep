/**
 * yvl inspect <youtube link or id> [--id <slug>]
 * Step 1: what is this video? The id, YouTube's own oEmbed answer (title, channel, whether embedding is allowed),
 * whether a lesson already uses it, and the rights question that must be answered before anything is built.
 * With --id the answers are saved as <slug>.job.json, which the later steps read.
 */
import {
  draftPath,
  fail,
  listLessons,
  loadJob,
  resolveRepo,
  slugify,
  writeJson,
  youtubeIdFrom,
} from "../lib/util.mjs";

function isoSeconds(iso) {
  const m = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/.exec(iso || "");
  if (!m) return null;
  return Number(m[1] || 0) * 86400 + Number(m[2] || 0) * 3600 + Number(m[3] || 0) * 60 + Number(m[4] || 0);
}

export async function run(args) {
  const input = args._[0];
  if (!input) fail("usage: yvl inspect <youtube link or id> [--id <slug>]");
  const youtubeId = youtubeIdFrom(input);
  if (!youtubeId) fail(`not a YouTube link or id: ${input}`);
  const repo = resolveRepo(args);

  const usedBy = listLessons(repo)
    .filter(({ lesson }) => lesson.youtubeId === youtubeId)
    .map(({ lesson }) => lesson.id);

  let status;
  let meta = null;
  try {
    const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${youtubeId}`)}&format=json`;
    const res = await fetch(url);
    status = res.status;
    if (res.ok) meta = await res.json();
  } catch (error) {
    status = `network: ${error.message}`;
  }
  const embeddable =
    status === 200
      ? "yes (oEmbed 200)"
      : status === 401
        ? "NO: the owner disabled embedding or the video is private (oEmbed 401)"
        : status === 404
          ? "NO: removed or never existed (oEmbed 404)"
          : `unknown (${status})`;

  // Optional, only when a Data API key exists: the exact length, the licence YouTube shows, the caption flag.
  let api = null;
  if (process.env.YOUTUBE_API_KEY) {
    try {
      const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,status,snippet&id=${youtubeId}&key=${process.env.YOUTUBE_API_KEY}`;
      const res = await fetch(url);
      const item = res.ok ? (await res.json()).items?.[0] : null;
      if (item)
        api = {
          durationSeconds: isoSeconds(item.contentDetails?.duration),
          license: item.status?.license,
          embeddable: item.status?.embeddable,
          captions: item.contentDetails?.caption,
          publishedAt: item.snippet?.publishedAt,
          language: item.snippet?.defaultAudioLanguage || item.snippet?.defaultLanguage || null,
        };
    } catch {
      /* the key is optional */
    }
  }

  const title = meta?.title ?? "";
  const suggested = args.id || slugify(title);
  const job = {
    id: args.id || null,
    youtubeId,
    title,
    channel: meta?.author_name ?? "",
    channelUrl: meta?.author_url ?? "",
    embeddable: status === 200,
    oembedStatus: status,
    api,
    inspectedAt: new Date().toISOString(),
  };
  if (args.id) writeJson(draftPath(args, args.id, "job"), job);

  console.log(`id          ${youtubeId}`);
  console.log(`title       ${title || "(unknown)"}`);
  console.log(`channel     ${job.channel || "(unknown)"}  ${job.channelUrl}`);
  console.log(`embeddable  ${embeddable}`);
  if (api)
    console.log(
      `data api    ${api.durationSeconds ?? "?"} s, licence ${api.license}, embeddable ${api.embeddable}, captions ${api.captions}, language ${api.language ?? "?"}`,
    );
  else console.log("data api    not used (no YOUTUBE_API_KEY): the length comes from the player at capture time");
  console.log(`duplicate   ${usedBy.length ? `ALREADY A LESSON: ${usedBy.join(", ")}` : "none"}`);
  console.log(`slug        ${suggested || "(choose one)"}`);
  console.log(
    "rights      NOT DECIDED. Embedding is not a licence. Pick the basis for the TEXT before building:\n" +
      "            public-domain (NASA, US government, expired) | creative-commons (CC BY / CC0 only; never NC, ND, SA)\n" +
      "            | permission (written, from the owner) | own (our production) | trial (no permission: Admins only, hidden from learners)",
  );
  if (args.id) console.log(`saved       ${draftPath(args, args.id, "job")}`);
  else console.log(`next        yvl inspect ${youtubeId} --id ${suggested || "<slug>"}   (saves the job), then yvl capture --id ...`);
  const saved = args.id ? loadJob(args, args.id) : null;
  if (args.id && !saved) fail("the job file was not written");
  if (status !== 200) process.exitCode = 2;
}
