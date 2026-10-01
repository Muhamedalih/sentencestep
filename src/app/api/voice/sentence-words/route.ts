import { NextResponse } from "next/server";

import { generateSentenceWord, resolveSentenceWordAudio } from "@/lib/voice/isolated-word-audio";

/**
 * The isolated-word clips of one lesson sentence.
 *
 * This replaces the per-word Server Action (resolvePronunciationAudioAction) as
 * the way a lesson loads its word audio ahead of the learner. Next.js runs
 * Server Actions strictly one at a time from a single client-side queue: a
 * sentence's ten word lookups ran back to back, and a learner's own tap waited
 * behind every one of them (and behind the app's other actions). A plain fetch
 * to a route handler isn't in that queue, so this runs alongside everything
 * else.
 *
 *  - GET  ?sentenceId=…&voiceId=…   CACHE-ONLY: every clip that already exists
 *                                   for the sentence's words, found across the
 *                                   whole single-word inventory, for the whole
 *                                   sentence in a few reads. Never synthesizes.
 *  - POST {sentenceId, voiceId, key} ONE word: its clip, made now if the
 *                                   inventory has none. One word per request on
 *                                   purpose — production's backend doesn't
 *                                   reliably finish a burst of syntheses inside
 *                                   a single request.
 *
 * The client names a sentence, a voice and (for POST) one of that sentence's
 * own words — never free text: the words are derived server-side from the real
 * sentence row, so this can't be used as a general text-to-speech endpoint.
 * Open to guests, like the lessons themselves.
 */
export const dynamic = "force-dynamic";

/** Sentence and voice ids are uuids / slugs like "edge-tts-en-us-aria" — never anything a query string needs escaping for. */
const ID_PATTERN = /^[A-Za-z0-9_-]{1,80}$/;
/** A normalized word: letters, digits, and the apostrophes/hyphens inside real words. */
const WORD_KEY_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N}'’-]{0,59}$/u;

/** A sentence whose clips all exist never changes under its URLs, so the browser may reuse the answer for a while; anything incomplete must be asked again. */
const CACHEABLE = "private, max-age=300";
const NOT_CACHEABLE = "no-store";

function badRequest(): NextResponse {
  return NextResponse.json({ error: "Invalid request." }, { status: 400 });
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const sentenceId = searchParams.get("sentenceId") ?? "";
  const voiceId = searchParams.get("voiceId") ?? "";
  if (!ID_PATTERN.test(sentenceId) || !ID_PATTERN.test(voiceId)) return badRequest();

  try {
    const result = await resolveSentenceWordAudio({ sentenceId, voiceId });
    if (!result) {
      return NextResponse.json(
        { error: "Unknown sentence or voice." },
        { status: 404, headers: { "Cache-Control": NOT_CACHEABLE } },
      );
    }
    if (result.missing.length > 0) {
      // Visible in the function logs: which words the inventory lacks and where
      // the rest of it lives, instead of a silent "no sound".
      console.warn(
        `[api/voice/sentence-words] ${result.missing.length} word(s) of sentence ${sentenceId} have no clip` +
          ` (voice ${voiceId}; inventory mostly under ${result.primaryVoiceId ?? "no voice"}):`,
        result.missing.map((contentId) => contentId.split("::")[1]).join(", "),
      );
    }
    return NextResponse.json(result, {
      headers: { "Cache-Control": result.missing.length === 0 ? CACHEABLE : NOT_CACHEABLE },
    });
  } catch (error) {
    console.error("[api/voice/sentence-words] lookup failed", error);
    return NextResponse.json(
      { error: "Could not load the word audio." },
      { status: 500, headers: { "Cache-Control": NOT_CACHEABLE } },
    );
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest();
  }
  const { sentenceId, voiceId, key } = (body ?? {}) as Record<string, unknown>;
  if (
    typeof sentenceId !== "string" ||
    typeof voiceId !== "string" ||
    typeof key !== "string" ||
    !ID_PATTERN.test(sentenceId) ||
    !ID_PATTERN.test(voiceId) ||
    !WORD_KEY_PATTERN.test(key)
  ) {
    return badRequest();
  }

  try {
    const result = await generateSentenceWord({ sentenceId, voiceId, key });
    if (!result.url) {
      console.warn(
        `[api/voice/sentence-words] no clip for "${key}" (sentence ${sentenceId}, voice ${voiceId}): ${result.reason}`,
      );
    }
    return NextResponse.json({ url: result.url }, { headers: { "Cache-Control": NOT_CACHEABLE } });
  } catch (error) {
    console.error("[api/voice/sentence-words] generation failed", error);
    return NextResponse.json(
      { error: "Could not make the word audio." },
      { status: 500, headers: { "Cache-Control": NOT_CACHEABLE } },
    );
  }
}
