import {
  WordAudioPreloader,
  type SentenceWordsResponse,
  type WordAudioPreloaderDeps,
} from "@/lib/voice/word-audio-preloader";

/** The batch route (src/app/api/voice/sentence-words/route.ts). */
export const SENTENCE_WORDS_ENDPOINT = "/api/voice/sentence-words";

/** A request that hasn't answered by now never will; the preloader forgets the job and the next request retries. */
const REQUEST_TIMEOUT_MS = 12_000;

async function fetchWithTimeout(input: string, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function isSentenceWordsResponse(value: unknown): value is SentenceWordsResponse {
  if (typeof value !== "object" || value === null) return false;
  const { urls, missing } = value as Record<string, unknown>;
  return typeof urls === "object" && urls !== null && Array.isArray(missing);
}

/**
 * The browser implementation of WordAudioPreloaderDeps: `fetch` for the batch
 * route and for the clips themselves, Blob URLs for the in-memory copies.
 * `onWordUrl`/`getWordUrl` are the caller's shared resolved-audio cache.
 */
export function createBrowserWordAudioPreloader(
  cache: Pick<WordAudioPreloaderDeps, "onWordUrl" | "getWordUrl">,
): WordAudioPreloader {
  return new WordAudioPreloader({
    ...cache,
    fetchSentenceWords: async ({ sentenceId, voiceId }, { generate }) => {
      const response = generate
        ? await fetchWithTimeout(SENTENCE_WORDS_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sentenceId, voiceId }),
          })
        : await fetchWithTimeout(
            `${SENTENCE_WORDS_ENDPOINT}?${new URLSearchParams({ sentenceId, voiceId })}`,
          );
      // The server doesn't know this sentence/voice: nothing to retry.
      if (response.status === 404) return null;
      if (!response.ok) throw new Error(`sentence-words responded ${response.status}`);
      const body: unknown = await response.json();
      if (!isSentenceWordsResponse(body))
        throw new Error("sentence-words returned an unexpected body");
      return body;
    },
    fetchClip: async (url) => {
      try {
        const response = await fetch(url);
        if (!response.ok) return null;
        const blob = await response.blob();
        // A clip served without a content type still needs one for <audio> to accept a Blob URL.
        return blob.type ? blob : new Blob([blob], { type: "audio/mpeg" });
      } catch {
        // Blocked, offline, or not CORS-readable: the plain URL still plays.
        return null;
      }
    },
    createObjectUrl: (blob) => URL.createObjectURL(blob),
    revokeObjectUrl: (url) => URL.revokeObjectURL(url),
  });
}
