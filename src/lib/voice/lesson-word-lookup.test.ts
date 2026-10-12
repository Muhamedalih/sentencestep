import assert from "node:assert/strict";
import test from "node:test";

import {
  createLessonWordLookup,
  type LessonWordsResponse,
  type SentenceWordsRequest,
} from "@/lib/voice/lesson-word-lookup";

const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

function answerFor(sentenceId: string): { urls: Record<string, string>; missing: string[] } {
  return {
    urls: { [`${sentenceId}::go`]: `https://clips.test/${sentenceId}/go.mp3` },
    missing: [],
  };
}

/** A fake lesson endpoint: every sentence in `lessonOf` shares one lesson and is answered together. */
function lessonServer(lessonOf: Record<string, string[]>) {
  const requests: SentenceWordsRequest[] = [];
  const fetchLesson = async (
    request: SentenceWordsRequest,
  ): Promise<LessonWordsResponse | null> => {
    requests.push(request);
    const siblings = lessonOf[request.sentenceId];
    if (!siblings) return null;
    return {
      ...answerFor(request.sentenceId),
      lesson: Object.fromEntries(siblings.map((id) => [id, answerFor(id)])),
    };
  };
  return { requests, fetchLesson };
}

test("one request answers every sentence of the lesson — later lookups use no network", async () => {
  const lesson = ["s1", "s2", "s3"];
  const { requests, fetchLesson } = lessonServer({ s1: lesson, s2: lesson, s3: lesson });
  const lookup = createLessonWordLookup(fetchLesson);

  const first = await lookup({ sentenceId: "s1", voiceId: "v" });
  const second = await lookup({ sentenceId: "s2", voiceId: "v" });
  const third = await lookup({ sentenceId: "s3", voiceId: "v" });

  assert.deepEqual(first, answerFor("s1"));
  assert.deepEqual(second, answerFor("s2"));
  assert.deepEqual(third, answerFor("s3"));
  assert.equal(requests.length, 1);
});

test("a sentence asked for again is answered from memory", async () => {
  const { requests, fetchLesson } = lessonServer({ s1: ["s1"] });
  const lookup = createLessonWordLookup(fetchLesson);

  await lookup({ sentenceId: "s1", voiceId: "v" });
  await lookup({ sentenceId: "s1", voiceId: "v" });

  assert.equal(requests.length, 1);
});

test("the current and next sentence asked together share one request", async () => {
  const lesson = ["s1", "s2"];
  const { requests, fetchLesson } = lessonServer({ s1: lesson, s2: lesson });
  const lookup = createLessonWordLookup(fetchLesson);

  const [a, b] = await Promise.all([
    lookup({ sentenceId: "s1", voiceId: "v" }),
    lookup({ sentenceId: "s2", voiceId: "v" }),
  ]);

  assert.deepEqual(a, answerFor("s1"));
  assert.deepEqual(b, answerFor("s2"));
  assert.equal(requests.length, 1);
});

test("a sentence the lesson answer doesn't list gets its own request", async () => {
  const requests: SentenceWordsRequest[] = [];
  const lookup = createLessonWordLookup(async (request) => {
    requests.push(request);
    return { ...answerFor(request.sentenceId), lesson: { other: answerFor("other") } };
  });

  await lookup({ sentenceId: "s1", voiceId: "v" });
  const far = await lookup({ sentenceId: "s9", voiceId: "v" });

  assert.deepEqual(far, answerFor("s9"));
  assert.deepEqual(
    requests.map((request) => request.sentenceId),
    ["s1", "s9"],
  );
});

test("a response without a lesson map still answers the sentence asked for", async () => {
  const lookup = createLessonWordLookup(async (request) => answerFor(request.sentenceId));
  assert.deepEqual(await lookup({ sentenceId: "s1", voiceId: "v" }), answerFor("s1"));
});

test("an unknown sentence (null from the server) is passed through and not remembered", async () => {
  let calls = 0;
  const lookup = createLessonWordLookup(async () => {
    calls += 1;
    return null;
  });

  assert.equal(await lookup({ sentenceId: "s1", voiceId: "v" }), null);
  assert.equal(await lookup({ sentenceId: "s1", voiceId: "v" }), null);
  assert.equal(calls, 2);
});

test("a failed request rejects, is not remembered, and the next ask retries", async () => {
  let calls = 0;
  const lookup = createLessonWordLookup(async (request) => {
    calls += 1;
    if (calls === 1) throw new Error("network down");
    return answerFor(request.sentenceId);
  });

  await assert.rejects(lookup({ sentenceId: "s1", voiceId: "v" }), /network down/);
  assert.deepEqual(await lookup({ sentenceId: "s1", voiceId: "v" }), answerFor("s1"));
  assert.equal(calls, 2);
});

test("a waiter whose sibling's request failed makes its own request", async () => {
  let calls = 0;
  const lookup = createLessonWordLookup(async (request) => {
    calls += 1;
    if (calls === 1) throw new Error("boom");
    return answerFor(request.sentenceId);
  });

  const first = lookup({ sentenceId: "s1", voiceId: "v" });
  const second = lookup({ sentenceId: "s2", voiceId: "v" });

  await assert.rejects(first, /boom/);
  assert.deepEqual(await second, answerFor("s2"));
  assert.equal(calls, 2);
});

test("different voices never share answers", async () => {
  const { requests, fetchLesson } = lessonServer({ s1: ["s1"] });
  const lookup = createLessonWordLookup(fetchLesson);

  await lookup({ sentenceId: "s1", voiceId: "a" });
  await lookup({ sentenceId: "s1", voiceId: "b" });

  assert.deepEqual(
    requests.map((request) => request.voiceId),
    ["a", "b"],
  );
});

test("a later lesson is fetched once its first sentence is asked for", async () => {
  const { requests, fetchLesson } = lessonServer({
    a1: ["a1", "a2"],
    a2: ["a1", "a2"],
    b1: ["b1", "b2"],
    b2: ["b1", "b2"],
  });
  const lookup = createLessonWordLookup(fetchLesson);

  await lookup({ sentenceId: "a1", voiceId: "v" });
  await lookup({ sentenceId: "a2", voiceId: "v" });
  await flush();
  await lookup({ sentenceId: "b1", voiceId: "v" });
  await lookup({ sentenceId: "b2", voiceId: "v" });

  assert.deepEqual(
    requests.map((request) => request.sentenceId),
    ["a1", "b1"],
  );
});
