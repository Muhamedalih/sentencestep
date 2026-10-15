import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { PASSAGE_SEEDS } from "@/data/passages";
import type { PassageSeed } from "@/data/passages";
import {
  passageIdFor,
  questionIdFor,
  sectionIdFor,
  sentenceIdFor,
  wordGroupIdFor,
  wordIdFor,
} from "@/lib/passages/ids";
import { posterArtFor, speakerClassFor } from "@/lib/passages/art";
import { parseQuestions } from "@/lib/passages/parse";
import {
  DEFAULT_PLAYBACK_RATE,
  PLAYBACK_RATES,
  formatPlaybackRate,
  nextPlaybackRate,
  parsePlaybackRate,
} from "@/lib/passages/prefs";
import {
  estimatePassageMinutes,
  parsePassageProgressInput,
  passageStatus,
  recommendedPassageId,
  resumeSectionIndex,
  scorePercent,
} from "@/lib/passages/progress";
import { spokenTextFor } from "@/lib/passages/spoken-text";
import { containsWholeWord, splitAroundWord } from "@/lib/passages/text";
import type { PassageProgress } from "@/lib/passages/types";
import { validatePassageSeed, validatePassageSet } from "@/lib/passages/validate";

// --- The authored content -------------------------------------------------

test("every authored passage passes the content rules", () => {
  assert.deepEqual(validatePassageSet(PASSAGE_SEEDS), []);
});

test("the authored passages are a real, varied set", () => {
  assert.ok(PASSAGE_SEEDS.length >= 8, "Phase 1 ships at least eight passages");
  const tones = new Set(PASSAGE_SEEDS.map((seed) => seed.tone));
  assert.equal(tones.size, 3, "funny, serious and inspiring are all represented");
  const sectionCounts = new Set(PASSAGE_SEEDS.map((seed) => seed.sections.length));
  assert.ok(sectionCounts.size > 1, "passages do not all have the same number of parts");
});

test("every passage has an Arabic translation for every line, question and option", () => {
  for (const seed of PASSAGE_SEEDS) {
    for (const section of seed.sections) {
      for (const line of section.lines) assert.match(line.ar, /[ء-ي]/, `${seed.slug}: ${line.en}`);
      assert.match(section.question.ar, /[ء-ي]/);
      for (const option of section.question.options) assert.match(option.ar, /[ء-ي]/);
    }
  }
});

test("the right answer is never the same option position in every part (no pattern to guess)", () => {
  const positions = new Set(
    PASSAGE_SEEDS.flatMap((seed) => seed.sections.map((section) => section.question.answer)),
  );
  assert.ok(positions.size >= 2);
});

// --- The validator catches what it should ----------------------------------

function cloneSeed(): PassageSeed {
  return structuredClone(PASSAGE_SEEDS[0]!);
}

test("validate: a question whose answer index is out of range is reported", () => {
  const seed = cloneSeed();
  seed.sections[0]!.question.answer = 9;
  assert.ok(validatePassageSeed(seed).some((problem) => /answer 9/.test(problem)));
});

test("validate: evidence must point at a real line of the same part", () => {
  const seed = cloneSeed();
  seed.sections[0]!.question.evidence = 99;
  assert.ok(validatePassageSeed(seed).some((problem) => /evidence 99/.test(problem)));
});

test("validate: a speaker missing from the cast, or a cast member who never speaks, is reported", () => {
  const seed = cloneSeed();
  seed.sections[0]!.lines[0]!.who = "Nobody";
  assert.ok(validatePassageSeed(seed).some((problem) => /not in the cast/.test(problem)));

  const unused = cloneSeed();
  unused.cast.Ghost = "zara";
  assert.ok(validatePassageSeed(unused).some((problem) => /Ghost never speaks/.test(problem)));
});

test("validate: a word that is not in the passage, or whose sentence is not a piece of it, is reported", () => {
  const seed = cloneSeed();
  seed.words[0] = { word: "elephant", sentence: "The ___ is big.", hintAr: "الفيل." };
  const problems = validatePassageSeed(seed);
  assert.ok(problems.some((problem) => /does not appear in the passage/.test(problem)));

  const wrongSentence = cloneSeed();
  wrongSentence.words[0] = { ...wrongSentence.words[0]!, sentence: "A made-up sentence with ___." };
  assert.ok(
    validatePassageSeed(wrongSentence).some((problem) =>
      /not a piece of one of the passage's own lines/.test(problem),
    ),
  );
});

test("validate: a missing translation is reported", () => {
  const seed = cloneSeed();
  seed.sections[0]!.lines[0]!.ar = "";
  assert.ok(validatePassageSeed(seed).some((problem) => /no Arabic letters/.test(problem)));
});

test("validate: a word taught by two passages, and two passages in the same slot, are reported", () => {
  const first = cloneSeed();
  const second = cloneSeed();
  second.slug = "another-one";
  const problems = validatePassageSet([first, second]);
  assert.ok(problems.some((problem) => /already taught by/.test(problem)));
  assert.ok(problems.some((problem) => /order 1 is taken/.test(problem)));
});

// --- Ids --------------------------------------------------------------------

test("ids: readable, 1-based and stable", () => {
  assert.equal(passageIdFor("my-cat"), "my-cat");
  assert.equal(sectionIdFor("my-cat", 2), "my-cat-p2");
  assert.equal(sentenceIdFor("my-cat", 2, 5), "my-cat-p2-l5");
  assert.equal(questionIdFor("my-cat", 2), "my-cat-p2-q1");
  assert.equal(wordGroupIdFor("my-cat"), "passage-my-cat");
  assert.equal(wordIdFor("my-cat", "Hungry "), "passage-my-cat-hungry");
});

// --- What the narrator says ---------------------------------------------------

test("spoken text: capitals are toned down, emoji dropped, mixed case left alone", () => {
  assert.equal(spokenTextFor({ en: "HELLO SARA. THIS IS DAD." }), "Hello sara. This is dad.");
  assert.equal(
    spokenTextFor({ en: "HAPPY BIRTHDAY SARA. I LOVE YOU. 😭" }),
    "Happy birthday sara. I love you.",
  );
  assert.equal(
    spokenTextFor({ en: "No, Milo. This is MY sandwich." }),
    "No, Milo. This is MY sandwich.",
  );
  assert.equal(
    spokenTextFor({ en: "good night, sara. i love you ❤️" }),
    "good night, sara. i love you",
  );
  assert.equal(spokenTextFor({ en: "OH NO. I SENT A SAD FACE." }), "Oh no. I sent a sad face.");
});

test("spoken text: the author's own `say` always wins", () => {
  assert.equal(
    spokenTextFor({ en: "24 Oak Street", say: "twenty-four Oak Street" }),
    "twenty-four Oak Street",
  );
});

// --- Text helpers ---------------------------------------------------------------

test("containsWholeWord / splitAroundWord match whole words only", () => {
  assert.equal(containsWholeWord("But Tom has a plan: two sandwiches.", "plan"), true);
  assert.equal(containsWholeWord("Look at the planet.", "plan"), false);
  assert.equal(containsWholeWord("Smile, Jake.", "smile"), true);
  assert.deepEqual(splitAroundWord("Tom has a plan: two.", "plan"), [
    "Tom has a ",
    "plan",
    ": two.",
  ]);
  assert.deepEqual(splitAroundWord("Smile, Jake.", "smile"), ["", "Smile", ", Jake."]);
  assert.equal(splitAroundWord("Look at the planet.", "plan"), null);
});

// --- Progress rules --------------------------------------------------------------

const progress = (over: Partial<PassageProgress> = {}): PassageProgress => ({
  passageId: "p",
  sectionsDone: 0,
  correctAnswers: 0,
  totalQuestions: 0,
  completedAt: null,
  ...over,
});

test("status: new, in progress, done", () => {
  assert.equal(passageStatus(undefined, 4), "new");
  assert.equal(passageStatus(progress({ sectionsDone: 0 }), 4), "new");
  assert.equal(passageStatus(progress({ sectionsDone: 2 }), 4), "in-progress");
  assert.equal(passageStatus(progress({ sectionsDone: 4 }), 4), "done");
  assert.equal(
    passageStatus(progress({ sectionsDone: 1, completedAt: "2026-10-15T10:00:00Z" }), 4),
    "done",
  );
});

test("resume: only a passage in progress resumes; a finished or untouched one starts at the top", () => {
  assert.equal(resumeSectionIndex(undefined, 4), 0);
  assert.equal(resumeSectionIndex(progress({ sectionsDone: 2 }), 4), 2);
  assert.equal(resumeSectionIndex(progress({ sectionsDone: 4 }), 4), 0);
  assert.equal(
    resumeSectionIndex(progress({ sectionsDone: 1, completedAt: "2026-10-15T10:00:00Z" }), 4),
    0,
  );
  assert.equal(resumeSectionIndex(progress({ sectionsDone: 2 }), 0), 0);
});

test("recommended: finish what you started, then the first untouched passage, then nothing", () => {
  const list = [
    { id: "a", sectionCount: 4 },
    { id: "b", sectionCount: 4 },
    { id: "c", sectionCount: 4 },
  ];
  assert.equal(recommendedPassageId(list, new Map()), "a");
  assert.equal(
    recommendedPassageId(list, new Map([["a", progress({ passageId: "a", sectionsDone: 4 })]])),
    "b",
  );
  assert.equal(
    recommendedPassageId(
      list,
      new Map([
        ["a", progress({ passageId: "a", sectionsDone: 4 })],
        ["c", progress({ passageId: "c", sectionsDone: 1 })],
      ]),
    ),
    "c",
  );
  assert.equal(
    recommendedPassageId(
      list,
      new Map(list.map((item) => [item.id, progress({ passageId: item.id, sectionsDone: 4 })])),
    ),
    null,
  );
});

test("score and time estimates", () => {
  assert.equal(scorePercent(3, 4), 75);
  assert.equal(scorePercent(0, 0), 0);
  assert.equal(scorePercent(9, 4), 100);
  assert.equal(estimatePassageMinutes(25, 4), 5);
  assert.equal(estimatePassageMinutes(3, 1), 2, "never less than two minutes");
});

test("a progress save is validated before it reaches the database", () => {
  const good = {
    passageId: "my-cat-is-my-boss",
    sectionsDone: 2,
    correct: 1,
    total: 2,
    completed: false,
  };
  assert.deepEqual(parsePassageProgressInput(good), good);
  assert.equal(parsePassageProgressInput(null), null);
  assert.equal(parsePassageProgressInput({ ...good, passageId: "Not A Slug" }), null);
  assert.equal(parsePassageProgressInput({ ...good, passageId: "../x" }), null);
  assert.equal(
    parsePassageProgressInput({ ...good, correct: 3, total: 2 }),
    null,
    "more right than asked",
  );
  assert.equal(parsePassageProgressInput({ ...good, sectionsDone: -1 }), null);
  assert.equal(parsePassageProgressInput({ ...good, sectionsDone: 1000 }), null);
  assert.equal(parsePassageProgressInput({ ...good, sectionsDone: 1.5 }), null);
  assert.equal(parsePassageProgressInput({ ...good, completed: "yes" }), null);
});

// --- Reading stored questions back ------------------------------------------------

test("parseQuestions: valid questions come through, malformed ones drop out", () => {
  const stored = [
    {
      id: "q1",
      prompt: "Who is the boss?",
      prompt_ar: "من هو المدير؟",
      options: [
        { en: "Tom", ar: "توم" },
        { en: "Milo", ar: "ميلو" },
      ],
      answer: 1,
      evidence: 1,
    },
    { id: "q2", prompt: "No options", options: [], answer: 0, evidence: 0 },
    {
      id: "q3",
      prompt: "Answer out of range",
      options: [{ en: "a" }, { en: "b" }],
      answer: 5,
      evidence: 0,
    },
    "not an object",
  ];
  const parsed = parseQuestions(stored);
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0]!.answer, 1);
  assert.equal(parsed[0]!.promptAr, "من هو المدير؟");
  assert.deepEqual(parseQuestions(null), []);
  assert.deepEqual(parseQuestions("nope"), []);
});

// --- The migrations --------------------------------------------------------------------

function readMigration(name: string): string {
  return readFileSync(join(process.cwd(), "supabase/migrations", name), "utf8");
}

test("the passages migration creates four tables, locks them with RLS and keeps progress per learner", () => {
  const sql = readMigration("20250335000000_passages.sql");
  for (const table of ["passages", "passage_sections", "passage_sentences", "passage_progress"]) {
    assert.match(sql, new RegExp(`create table ${table} \\(`), `${table} is created`);
    assert.match(
      sql,
      new RegExp(`alter table ${table} enable row level security`),
      `${table} has RLS`,
    );
  }
  // Content is admin-only through RLS (learners read it through gated server code).
  assert.match(sql, /create policy "Admins manage passages" on passages/);
  assert.doesNotMatch(sql, /for select using \(true\)/);
  // Progress is each learner's own.
  assert.match(sql, /create policy "Users manage their own passage progress" on passage_progress/);
  assert.match(sql, /\(select auth\.uid\(\)\) = user_id/);
  // The save function runs as the caller and never moves progress backwards.
  assert.match(sql, /create or replace function public\.record_passage_progress/);
  assert.match(sql, /security invoker/);
  assert.match(sql, /greatest\(passage_progress\.sections_done, excluded\.sections_done\)/);
  assert.match(sql, /coalesce\(passage_progress\.completed_at, excluded\.completed_at\)/);
  // Deleting a word group in Word Lists must never delete a passage.
  assert.match(sql, /word_group_id text references word_groups \(id\) on delete set null/);
});

test("the passages seed migration puts only that feature in admin preview and never overwrites a saved choice", () => {
  const sql = readMigration("20250336000000_feature_settings_passages.sql");
  const body = /\$json\$([\s\S]*?)\$json\$/.exec(sql)?.[1];
  assert.ok(body, "the seed entry must be dollar-quoted as $json$ ... $json$");
  assert.equal((JSON.parse(body) as { state: string }).state, "admin");
  assert.match(sql, /not \(coalesce\(config -> 'features', '\{\}'::jsonb\) \? 'passages'\)/);
  assert.match(sql, /jsonb_set\(/);
});

// --- Narration speed -----------------------------------------------------------------

test("speed: the button cycles through the steps and wraps; an unknown speed restarts at 1x", () => {
  assert.deepEqual([...PLAYBACK_RATES], [0.75, 1, 1.25, 1.5]);
  assert.equal(nextPlaybackRate(0.75), 1);
  assert.equal(nextPlaybackRate(1), 1.25);
  assert.equal(nextPlaybackRate(1.25), 1.5);
  assert.equal(nextPlaybackRate(1.5), 0.75, "wraps around");
  assert.equal(nextPlaybackRate(2), DEFAULT_PLAYBACK_RATE);
});

test("speed: a stored value is read back safely, and a speed has a readable label", () => {
  assert.equal(parsePlaybackRate("1.25"), 1.25);
  assert.equal(parsePlaybackRate(0.75), 0.75);
  assert.equal(parsePlaybackRate("3"), DEFAULT_PLAYBACK_RATE, "a speed that does not exist");
  assert.equal(parsePlaybackRate("fast"), DEFAULT_PLAYBACK_RATE);
  assert.equal(parsePlaybackRate(null), DEFAULT_PLAYBACK_RATE);
  assert.equal(parsePlaybackRate(undefined), DEFAULT_PLAYBACK_RATE);
  assert.equal(formatPlaybackRate(1), "1\u00d7");
  assert.equal(formatPlaybackRate(0.75), "0.75\u00d7");
});

// --- Posters ------------------------------------------------------------------------------

/** Hue of a #rrggbb colour, 0-360. */
function hueOf(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [
    number,
    number,
    number,
  ];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (delta === 0) return 0;
  const hue =
    max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
  return (hue * 60 + 360) % 360;
}

test("posters: deterministic, one per passage, and never yellow or amber", () => {
  assert.deepEqual(posterArtFor("funny", 1), posterArtFor("funny", 1));
  assert.notEqual(
    posterArtFor("funny", 1).from,
    posterArtFor("serious", 1).from,
    "each mood has its own colour",
  );

  for (const seed of PASSAGE_SEEDS) {
    const art = posterArtFor(seed.tone, seed.order);
    assert.match(art.backgroundImage, /linear-gradient\(155deg/);
    for (const colour of [art.from, art.to]) {
      assert.match(colour, /^#[0-9a-f]{6}$/);
      const hue = hueOf(colour);
      assert.ok(
        hue < 38 || hue > 75,
        `${seed.slug}: ${colour} (hue ${Math.round(hue)}) is yellow/amber`,
      );
    }
  }
});

test("speaker colours repeat only after every colour has been used", () => {
  const first = [0, 1, 2, 3].map(speakerClassFor);
  assert.equal(new Set(first).size, 4);
  assert.equal(speakerClassFor(4), first[0]);
  assert.equal(
    speakerClassFor(-1),
    speakerClassFor(1),
    "an unknown speaker (-1) still gets a colour",
  );
});
