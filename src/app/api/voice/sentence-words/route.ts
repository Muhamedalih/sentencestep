import { NextResponse } from "next/server";

import { resolveSentenceWordAudio } from "@/lib/voice/isolated-word-audio";

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
 *  - POST {sentenceId, voiceId}    the same, but synthesizes the words that
 *                                  have no clip yet (bounded — see
 *                                  resolveSentenceWordAudio) and returns them.
 *
 * The client names a sentence and a voice, never text: the words are derived
 * server-side from the real sentence row, so this can't be used as a general
 * text-to-speech endpoint. Open to guests, like the lessons themselves.
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
): Promise<NextResponse> {
  if (!ID_PATTERN.test(sentenceId) || !ID_PATTERN.test(voiceId)) return badRequest();

  try {
    const result = await resolveSentenceWordAudio({ sentenceId, voiceId, generate });
    if (!result) {
      return NextResponse.json(
        { error: "Unknown sentence or voice." },
        { status: 404, headers: { "Cache-Control": NOT_CACHEABLE } },
      );
    }
    return NextResponse.json(result, {
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
  return respond(searchParams.get("sentenceId") ?? "", searchParams.get("voiceId") ?? "", false);
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
