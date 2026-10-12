import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { resolveLessonWordAudio, resolveSentenceWordAudio } from "@/lib/voice/isolated-word-audio";
import { canReadSentence } from "@/lib/voice/sentence-access";

/**
 * Every isolated-word clip of one lesson sentence, in one request.
 *
 * This replaces the per-word Server Action (resolvePronunciationAudioAction) as
 * the way a lesson loads its word audio ahead of the learner. Next.js runs
 * Server Actions strictly one at a time from a single client-side queue: a
 * sentence's ten word lookups ran back to back, and a learner's own click on a
 * word waited behind every one of them (and behind the app's other actions). A
 * plain fetch to a route handler isn't in that queue, so this runs alongside
 * everything else — and answers for the whole sentence with two Supabase reads.
 *
 *  - GET  ?sentenceId=…&voiceId=…  cache-only: the clips that already exist.
 *  - GET  …&scope=lesson           the same for the named sentence, plus every
 *                                  other sentence of its lesson under `lesson`
 *                                  (sentenceId -> the same {urls, missing}), so
 *                                  a learner makes ONE request per lesson
 *                                  instead of one per sentence — each request is
 *                                  a serverless invocation, and a typing session
 *                                  made dozens of them. Access is still decided
 *                                  on the named sentence: a lesson's sentences
 *                                  all share its visibility.
 *  - POST {sentenceId, voiceId}    the same, but synthesizes the words that
 *                                  have no clip yet (bounded — see
 *                                  resolveSentenceWordAudio) and returns them.
 *
 * The client names a sentence and a voice, never text: the words are derived
 * server-side from the real sentence row, so this can't be used as a general
 * text-to-speech endpoint. Open to guests for the free lessons, like the lessons
 * themselves: a sentence the caller couldn't open (a Premium lesson, for someone
 * without access) answers 404 exactly like an unknown id, decided by the same
 * row-level security as the lesson page (see canReadSentence).
 */
export const dynamic = "force-dynamic";

/** Sentence and voice ids are uuids / slugs like "edge-tts-en-us-aria" — never anything a query string needs escaping for. */
const ID_PATTERN = /^[A-Za-z0-9_-]{1,80}$/;

/** A fully-resolved sentence never changes under its URLs, so the browser may reuse the answer for a while; anything incomplete must be asked again. */
const CACHEABLE = "private, max-age=300";
const NOT_CACHEABLE = "no-store";

function badRequest(): NextResponse {
  return NextResponse.json({ error: "Invalid sentenceId or voiceId." }, { status: 400 });
}

async function respond(
  sentenceId: string,
  voiceId: string,
  generate: boolean,
  wholeLesson = false,
): Promise<NextResponse> {
  if (!ID_PATTERN.test(sentenceId) || !ID_PATTERN.test(voiceId)) return badRequest();

  try {
    // The word clips are derived from the sentence text, which the next call reads
    // with the service role. Asked first, with the caller's own session, so a
    // premium sentence's words and audio are never handed to someone who couldn't
    // open its lesson.
    const supabase = await createClient();
    const allowed = await canReadSentence(
      (id) => supabase.from("sentences").select("id").eq("id", id).maybeSingle(),
      sentenceId,
    );
    if (!allowed) {
      return NextResponse.json(
        { error: "Unknown sentence or voice." },
        { status: 404, headers: { "Cache-Control": NOT_CACHEABLE } },
      );
    }

    const lesson =
      wholeLesson && !generate ? await resolveLessonWordAudio({ sentenceId, voiceId }) : null;
    // A lesson too long to cover (or a sentence it doesn't list) still gets its own answer.
    const result =
      lesson?.[sentenceId] ?? (await resolveSentenceWordAudio({ sentenceId, voiceId, generate }));
    if (!result) {
      return NextResponse.json(
        { error: "Unknown sentence or voice." },
        { status: 404, headers: { "Cache-Control": NOT_CACHEABLE } },
      );
    }
    return NextResponse.json(lesson ? { ...result, lesson } : result, {
      headers: {
        "Cache-Control": !generate && result.missing.length === 0 ? CACHEABLE : NOT_CACHEABLE,
      },
    });
  } catch (error) {
    console.error("[api/voice/sentence-words] failed", error);
    return NextResponse.json(
      { error: "Could not load the word audio." },
      { status: 500, headers: { "Cache-Control": NOT_CACHEABLE } },
    );
  }
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  return respond(
    searchParams.get("sentenceId") ?? "",
    searchParams.get("voiceId") ?? "",
    false,
    searchParams.get("scope") === "lesson",
  );
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest();
  }
  const { sentenceId, voiceId } = (body ?? {}) as { sentenceId?: unknown; voiceId?: unknown };
  if (typeof sentenceId !== "string" || typeof voiceId !== "string") return badRequest();
  return respond(sentenceId, voiceId, true);
}
