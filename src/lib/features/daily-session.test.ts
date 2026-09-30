import assert from "node:assert/strict";
import test from "node:test";

import {
  applyWordListAudio,
  assembleSession,
  estimateSessionMinutes,
} from "@/lib/features/daily-session";
import type { SourceCandidates } from "@/lib/features/daily-session";

const words = (...list: string[]) => list.map((targetWord) => ({ targetWord }));
const bySource = (
  source: SourceCandidates<{ targetWord: string }>["source"],
  ...list: string[]
): SourceCandidates<{ targetWord: string }> => ({ source, items: words(...list) });

test("assembleSession: a size of zero or less is an empty session", () => {
  assert.deepEqual(assembleSession([bySource("mistake", "a")], 0), []);
});

test("assembleSession: fewer candidates than the size returns them all, tagged, in priority order", () => {
  const session = assembleSession([bySource("mistake", "went"), bySource("recall", "table")], 12);
  assert.deepEqual(
    session.map((word) => [word.targetWord, word.sessionSource]),
    [
      ["went", "mistake"],
      ["table", "recall"],
    ],
  );
});

test("assembleSession: a busy source can't crowd the others out (half the session each, then fill)", () => {
  const many = Array.from({ length: 20 }, (_unused, i) => `m${i}`);
  const session = assembleSession([bySource("mistake", ...many), bySource("card", "c1", "c2")], 10);
  assert.equal(session.length, 10);
  assert.equal(session.filter((word) => word.sessionSource === "card").length, 2);
  assert.equal(session.filter((word) => word.sessionSource === "mistake").length, 8);
});

test("assembleSession: room a small source leaves goes back to the others", () => {
  const session = assembleSession(
    [bySource("mistake", ...Array.from({ length: 9 }, (_u, i) => `m${i}`)), bySource("card", "c1")],
    8,
  );
  assert.equal(session.length, 8);
  assert.equal(session.filter((word) => word.sessionSource === "mistake").length, 7);
});

test("assembleSession: a word is reviewed once — the higher-priority source keeps it", () => {
  const session = assembleSession(
    [bySource("mistakeReview", "Went"), bySource("card", "went", "table")],
    12,
  );
  assert.deepEqual(
    session.map((word) => [word.targetWord, word.sessionSource]),
    [
      ["Went", "mistakeReview"],
      ["table", "card"],
    ],
  );
});

test("estimateSessionMinutes: about 20s a word, at least a minute", () => {
  assert.equal(estimateSessionMinutes(1), 1);
  assert.equal(estimateSessionMinutes(12), 4);
  assert.equal(estimateSessionMinutes(30), 10);
});

test("applyWordListAudio: every word gets the Word Lists voice's clip, replacing any clip it arrived with", () => {
  const session = [
    // A mistake word arrives with a clip from the Normal lessons' narrator.
    { targetWord: "went", audioUrl: "https://cdn.test/normal-voice/went.mp3", id: "mistake-went" },
    { targetWord: "table", audioUrl: null, id: "recall-table" },
    { targetWord: "apple", id: "word-apple" },
  ];
  const result = applyWordListAudio(
    session,
    new Map([
      ["went", "https://cdn.test/emma/went.mp3"],
      ["table", "https://cdn.test/emma/table.mp3"],
      ["apple", "https://cdn.test/emma/apple.mp3"],
    ]),
  );
  assert.deepEqual(
    result.map((word) => [word.targetWord, word.audioUrl, word.id]),
    [
      ["went", "https://cdn.test/emma/went.mp3", "mistake-went"],
      ["table", "https://cdn.test/emma/table.mp3", "recall-table"],
      ["apple", "https://cdn.test/emma/apple.mp3", "word-apple"],
    ],
  );
});

test("applyWordListAudio: an unresolved word loses its foreign clip instead of keeping a different voice", () => {
  const [word] = applyWordListAudio(
    [{ targetWord: "went", audioUrl: "https://cdn.test/normal-voice/went.mp3" }],
    new Map(),
  );
  assert.equal(word?.audioUrl, null);
});

test("applyWordListAudio: doesn't mutate its input", () => {
  const input = [{ targetWord: "went", audioUrl: "https://cdn.test/old.mp3" }];
  applyWordListAudio(input, new Map([["went", "https://cdn.test/new.mp3"]]));
  assert.equal(input[0]?.audioUrl, "https://cdn.test/old.mp3");
});
