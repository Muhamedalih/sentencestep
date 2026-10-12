import type { SentenceWordsResponse } from "@/lib/voice/word-audio-preloader";

/**
 * What the batch route answers for `?scope=lesson`: the named sentence's own
 * answer, plus the same {urls, missing} for every other sentence of its lesson.
 */
export interface LessonWordsResponse extends SentenceWordsResponse {
  lesson?: Record<string, SentenceWordsResponse>;
}

export interface SentenceWordsRequest {
  sentenceId: string;
  voiceId: string;
}

/** Answers kept per session — a long lesson is under 100 sentences, so this holds several lessons without growing unboundedly. */
const MAX_REMEMBERED_ANSWERS = 600;

/**
 * Turns "one cache-only lookup per sentence" into "one per lesson".
 *
 * Every request to the batch route is a serverless invocation (and one more at
 * the edge for the middleware), and the word-audio preloader asked for a
 * sentence's clips as the learner reached each one — dozens of requests for a
 * single lesson, from every learner at once. The route can answer for the whole
 * lesson in one pass, so the first lookup asks for that (`fetchLesson`) and the
 * answers for the lesson's other sentences are kept here, handed out without any
 * network when the preloader reaches them.
 *
 * The preloader starts the current and the next sentence together, so lookups
 * for one voice wait for a request already under way instead of racing it with
 * a second identical one; once it lands, the waiter usually finds its answer.
 * A failed or missing answer is never remembered, so the next ask goes to the
 * network again.
 */
export function createLessonWordLookup(
  fetchLesson: (request: SentenceWordsRequest) => Promise<LessonWordsResponse | null>,
): (request: SentenceWordsRequest) => Promise<SentenceWordsResponse | null> {
  const answers = new Map<string, SentenceWordsResponse>();
  const inFlight = new Map<string, Promise<unknown>>();

  const keyOf = (sentenceId: string, voiceId: string) => `${sentenceId}|${voiceId}`;

  function remember(key: string, answer: SentenceWordsResponse): void {
    answers.delete(key);
    answers.set(key, answer);
    while (answers.size > MAX_REMEMBERED_ANSWERS) {
      const oldest = answers.keys().next();
      if (oldest.done) break;
      answers.delete(oldest.value);
    }
  }

  return async function lookup(request) {
    const { sentenceId, voiceId } = request;
    const key = keyOf(sentenceId, voiceId);

    const known = answers.get(key);
    if (known) return known;

    const underWay = inFlight.get(voiceId);
    if (underWay) {
      await underWay.catch(() => undefined);
      const arrived = answers.get(key);
      if (arrived) return arrived;
    }

    const fetching = fetchLesson(request).then((body) => {
      if (!body) return null;
      for (const [id, answer] of Object.entries(body.lesson ?? {})) {
        remember(keyOf(id, voiceId), answer);
      }
      const own: SentenceWordsResponse = { urls: body.urls, missing: body.missing };
      remember(key, own);
      return own;
    });
    inFlight.set(voiceId, fetching);
    try {
      return await fetching;
    } finally {
      if (inFlight.get(voiceId) === fetching) inFlight.delete(voiceId);
    }
  };
}
