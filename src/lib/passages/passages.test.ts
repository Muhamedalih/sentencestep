import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { PASSAGE_SEEDS } from "@/data/passages";
import type { PassageSeed } from "@/data/passages";
import {
  isPassageWordGroupId,
  passageIdFor,
  questionIdFor,
  sectionIdFor,
  sentenceIdFor,
  wordGroupIdFor,
  wordIdFor,
} from "@/lib/passages/ids";
import { posterArtFor, speakerClassFor } from "@/lib/passages/art";
import {
  BELL_PARTIALS,
  CHIME_TAIL_SECONDS,
  CORRECT_CHIME_NOTES,
  CORRECT_CHIME_SPARKLE,
  createChimeBus,
  scheduleCorrectChime,
} from "@/lib/passages/chime";
import type { ChimeContext } from "@/lib/passages/chime";
import { parseQuestions } from "@/lib/passages/parse";
import {
  NO_EVIDENCE_LINE,
  WORD_LIST_LEVEL,
  passageFieldsFor,
  sectionRowsFor,
  sentenceRowsFor,
  speakerVoiceRowsFor,
  storedQuestionsFor,
  wordGroupRowFor,
  wordRowsFor,
} from "@/lib/passages/seed-rows";
import {
  DEFAULT_PLAYBACK_RATE,
  PLAYBACK_RATES,
  formatPlaybackRate,
  nextPlaybackRate,
  parsePlaybackRate,
} from "@/lib/passages/prefs";
import {
  estimatePassageMinutes,
  homeCardPick,
  parsePassageProgressInput,
  passageBadgesFor,
  passageStatus,
  plausibleLearnerDate,
  recommendedPassageId,
  resumeSectionIndex,
  scorePercent,
} from "@/lib/passages/progress";
import { QUEST_DEFAULTS, QUEST_TYPES } from "@/lib/features/catalog";
import type { PassageSummary } from "@/lib/passages/types";
import { canOpenPassage, openablePassages } from "@/lib/passages/access";
import { parsePassageJson } from "@/lib/passages/import";
import {
  narrationCost,
  narrationJobsFor,
  parsePauseHint,
  pauseMarksForSentences,
  planNarration,
  resolveNarrationVoices,
  rolesOf,
} from "@/lib/passages/narration-plan";
import type { NarrationSentence, NarrationVoice, VoiceSetup } from "@/lib/passages/narration-plan";
import { wordGroupStatusFor } from "@/lib/passages/publish";
import { NARRATOR_ROLE, PASSAGE_VOICE_IDS } from "@/lib/passages/voice-aliases";
import {
  pausePlanFor,
  pauseStyleFor,
  problemWithHint,
  withPause,
} from "@/lib/passages/narration-pauses";
import { narrationTextFor, spokenTextFor } from "@/lib/passages/spoken-text";
import { containsWholeWord, passageTextSizeFor, splitAroundWord } from "@/lib/passages/text";
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
    assert.match(seed.closing.ar, /[ء-ي]/, `${seed.slug}: closing question`);
    for (const option of seed.closing.options) assert.match(option.ar, /[ء-ي]/, seed.slug);
  }
});

/** Every question in reading order — each part's own, then the passage's closing one — with the position of its right answer. */
function answerPositionsInOrder(): { slug: string; level: string; position: number }[] {
  return PASSAGE_SEEDS.flatMap((seed) => [
    ...seed.sections.map((section) => ({
      slug: seed.slug,
      level: seed.level,
      position: section.question.answer,
    })),
    { slug: seed.slug, level: seed.level, position: seed.closing.answer },
  ]);
}

test("the right answer is spread over every option position (no pattern to guess)", () => {
  const all = answerPositionsInOrder();
  const optionCount = 3;
  for (let position = 0; position < optionCount; position += 1) {
    const share = all.filter((entry) => entry.position === position).length / all.length;
    assert.ok(
      share >= 0.25 && share <= 0.42,
      `option ${position + 1} holds the right answer ${Math.round(share * 100)}% of the time`,
    );
  }

  // The same holds inside each level, so a learner at one level cannot learn "pick the first one".
  for (const level of new Set(all.map((entry) => entry.level))) {
    const inLevel = all.filter((entry) => entry.level === level);
    for (let position = 0; position < optionCount; position += 1) {
      const share = inLevel.filter((entry) => entry.position === position).length / inLevel.length;
      assert.ok(
        share <= 0.5,
        `${level}: option ${position + 1} holds the right answer ${Math.round(share * 100)}% of the time`,
      );
    }
  }

  // And no streak of the same position runs on.
  let run = 1;
  for (let index = 1; index < all.length; index += 1) {
    run = all[index]!.position === all[index - 1]!.position ? run + 1 : 1;
    assert.ok(
      run <= 3,
      `${all[index]!.slug}: the right answer sits at the same position ${run} times in a row`,
    );
  }
});

test("a passage's questions do not all keep the right answer in one position", () => {
  for (const seed of PASSAGE_SEEDS) {
    const positions = new Set([
      ...seed.sections.map((section) => section.question.answer),
      seed.closing.answer,
    ]);
    assert.ok(
      positions.size >= 2,
      `${seed.slug}: every right answer is option ${[...positions][0]! + 1}`,
    );
  }
});

test("every passage closes with one question about the whole passage", () => {
  for (const seed of PASSAGE_SEEDS) {
    const partPrompts = seed.sections.map((section) => section.question.en.trim().toLowerCase());
    assert.ok(
      !partPrompts.includes(seed.closing.en.trim().toLowerCase()),
      `${seed.slug}: the closing question repeats a part's question`,
    );
    assert.ok(seed.closing.options.length >= 3, `${seed.slug}: the closing question has choices`);
  }
});

// --- The validator catches what it should ----------------------------------

function cloneSeed(): PassageSeed {
  return structuredClone(PASSAGE_SEEDS[0]!);
}

function seedBySlug(slug: string): PassageSeed {
  const seed = PASSAGE_SEEDS.find((candidate) => candidate.slug === slug);
  assert.ok(seed, slug);
  return seed;
}

/** A seed's lines the way the narration reads them back from the database. */
function sentencesOf(
  seed: PassageSeed,
  clips: ReadonlySet<string> = new Set(),
): NarrationSentence[] {
  return sentenceRowsFor(seed).map((row) => ({
    id: row.id,
    sectionId: row.section_id,
    speaker: row.speaker,
    en: row.en,
    say: row.say,
    pause: row.pause,
    audioUrl: clips.has(row.id) ? "https://example.test/clip.mp3" : null,
  }));
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

test("validate: the closing question is checked like any other, and a passage must have one", () => {
  const missing = cloneSeed() as Partial<PassageSeed>;
  delete missing.closing;
  assert.ok(
    validatePassageSeed(missing as PassageSeed).some((problem) =>
      /closing question: the passage has none/.test(problem),
    ),
  );

  const badAnswer = cloneSeed();
  badAnswer.closing.answer = 7;
  assert.ok(
    validatePassageSeed(badAnswer).some((problem) =>
      /closing question: answer 7 is not one of the 3 options/.test(problem),
    ),
  );

  const untranslated = cloneSeed();
  untranslated.closing.ar = "";
  assert.ok(
    validatePassageSeed(untranslated).some((problem) =>
      /closing question: question has no Arabic translation/.test(problem),
    ),
  );

  const repeated = cloneSeed();
  repeated.closing.en = ` ${repeated.sections[1]!.question.en.toUpperCase()} `;
  assert.ok(
    validatePassageSeed(repeated).some((problem) =>
      /closing question: repeats the question of one of the parts/.test(problem),
    ),
  );
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
  // A passage's word lesson is recognised by its id, so its back links can lead to the Passages list.
  assert.equal(isPassageWordGroupId(wordGroupIdFor("my-cat")), true);
  assert.equal(isPassageWordGroupId("group-1a2b3c4d"), false);
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
  // Without a date the save is still valid — it just carries none.
  assert.deepEqual(parsePassageProgressInput(good), { ...good, todayISO: null });
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

test("stored questions: a part keeps its own question, the last part also the closing one, and the reader parses them all", () => {
  for (const seed of PASSAGE_SEEDS) {
    const lastIndex = seed.sections.length - 1;
    seed.sections.forEach((section, index) => {
      const stored = storedQuestionsFor(seed, index);
      assert.equal(stored.length, index === lastIndex ? 2 : 1, `${seed.slug} part ${index + 1}`);
      assert.equal(stored[0]!.id, questionIdFor(seed.slug, index + 1, 1));
      assert.equal(stored[0]!.evidence, section.question.evidence);

      // What the insert script writes is what parseQuestions reads back, nothing dropped.
      assert.equal(parseQuestions(stored).length, stored.length, `${seed.slug} part ${index + 1}`);
    });

    const closing = storedQuestionsFor(seed, lastIndex)[1]!;
    assert.equal(closing.id, questionIdFor(seed.slug, lastIndex + 1, 2));
    assert.equal(closing.prompt, seed.closing.en);
    assert.equal(closing.answer, seed.closing.answer);
    assert.equal(closing.evidence, NO_EVIDENCE_LINE, "a closing question has no line to light up");
  }
  assert.deepEqual(storedQuestionsFor(PASSAGE_SEEDS[0]!, 99), []);
});

// --- The narrator's small pauses --------------------------------------------------------

test("pauses: a startled lead-in, a punchline and a reaction each get one beat — in the style the model understands", () => {
  const lead = pausePlanFor("Suddenly, Milo jumps on Tom's face.");
  assert.equal(lead?.reason, "lead-in");
  assert.equal(
    withPause("Suddenly, Milo jumps on Tom's face.", lead, "ellipsis"),
    "Suddenly... Milo jumps on Tom's face.",
  );
  assert.equal(
    withPause("Suddenly, Milo jumps on Tom's face.", lead, "break"),
    'Suddenly, <break time="0.4s" /> Milo jumps on Tom\'s face.',
  );

  const punch = pausePlanFor("Tom opens a third box. The same thing!");
  assert.equal(punch?.reason, "punchline");
  assert.equal(
    withPause("Tom opens a third box. The same thing!", punch, "ellipsis"),
    "Tom opens a third box... The same thing!",
  );

  const reaction = pausePlanFor("What? You're not hungry?");
  assert.equal(
    withPause("What? You're not hungry?", reaction, "ellipsis"),
    "What? ... You're not hungry?",
  );

  const reveal = pausePlanFor('In cat language, it means: "Food. Now."');
  assert.equal(reveal?.reason, "reveal");
  assert.equal(
    withPause('In cat language, it means: "Food. Now."', reveal, "ellipsis"),
    'In cat language, it means... "Food. Now."',
  );

  // A short reaction right after a long sentence gets the beat before it.
  const beat = pausePlanFor("MILO!", {
    previous: "Milo jumps on the table. He takes the sandwich and runs away.",
  });
  assert.equal(beat?.at, 0);
  assert.equal(withPause("Milo!", beat, "ellipsis"), "... Milo!");
});

test("pauses: an ordinary line gets none, and never more than one", () => {
  for (const plain of [
    "Tom has a cat. His name is Milo.",
    "It is five o'clock in the morning. Tom is asleep.",
    "Then he walks away.",
    "Okay. I'm coming.",
    "He puts food in Milo's bowl.",
  ]) {
    assert.equal(pausePlanFor(plain), null, plain);
  }
  // A line that already carries its own dots is left as the author wrote it.
  assert.equal(pausePlanFor("Help... please."), null);
  // In a character's speech a short closing sentence is only a reveal when it opens like one.
  assert.equal(
    pausePlanFor("Sorry, everybody. It's a package. One minute!", { dialogue: true }),
    null,
  );
  assert.equal(
    pausePlanFor("There is a burglar in my living room. Maybe two!", { dialogue: true })?.reason,
    "punchline",
  );

  for (const seed of PASSAGE_SEEDS) {
    for (const section of seed.sections) {
      section.lines.forEach((line, index) => {
        for (const style of ["ellipsis", "break"] as const) {
          const text = narrationTextFor(line, {
            model: style === "break" ? "eleven_multilingual_v2" : "eleven_v3",
            previousEn: section.lines[index - 1]?.en,
          });
          const marks =
            style === "break"
              ? (text.match(/<break/g) ?? []).length
              : (text.match(/\.\.\./g) ?? []).length;
          const own = (spokenTextFor(line).match(/\.\.\./g) ?? []).length;
          assert.ok(
            marks - (style === "break" ? 0 : own) <= 1,
            `${seed.slug}: more than one pause in "${line.en}"`,
          );
        }
      });
    }
  }
});

test("pauses: an author's hint places, moves or removes the beat, and a say always wins", () => {
  assert.equal(
    narrationTextFor(
      { en: "Emily? Ryan's friend was called Julia!", pause: { after: "Emily?" } },
      { model: "eleven_v3" },
    ),
    "Emily? ... Ryan's friend was called Julia!",
  );
  assert.equal(
    narrationTextFor({ en: "Suddenly, Milo jumps on Tom's face.", pause: "none" }),
    "Suddenly, Milo jumps on Tom's face.",
  );
  assert.equal(narrationTextFor({ en: "Nice ducks.", pause: { before: true } }), "... Nice ducks.");
  assert.equal(
    narrationTextFor({ en: "Nice ducks.", pause: { before: true, length: "long" } }),
    "... ... Nice ducks.",
  );
  // An anchor that is not in the spoken text falls back to the rules.
  assert.equal(
    narrationTextFor({ en: "Suddenly, Milo jumps on Tom's face.", pause: { after: "nowhere" } }),
    "Suddenly... Milo jumps on Tom's face.",
  );
  // The author's own say is sent exactly as written.
  assert.equal(
    narrationTextFor({ en: "Suddenly, Milo jumps.", say: "Suddenly, Milo jumps!" }),
    "Suddenly, Milo jumps!",
  );
  // Switched off for a run: only the spoken text.
  assert.equal(
    narrationTextFor({ en: "Suddenly, Milo jumps on Tom's face." }, { pauses: false }),
    "Suddenly, Milo jumps on Tom's face.",
  );

  assert.equal(problemWithHint("Emily? Ryan's friend.", { after: "Emily?" }), null);
  assert.match(
    problemWithHint("Emily? Ryan's friend.", { after: "Zoe" }) ?? "",
    /is not in the line/,
  );
  assert.match(problemWithHint("Emily?", { after: "Emily?" }) ?? "", /end of the line/);
  assert.match(problemWithHint("Emily?", { after: " " }) ?? "", /empty/);
  assert.equal(pauseStyleFor("eleven_v3"), "ellipsis");
  assert.equal(pauseStyleFor("eleven_multilingual_v2"), "break");
  assert.equal(pauseStyleFor(null), "ellipsis");
});

test("pauses: a touch, not a performance — about one line in ten, and what a learner reads is untouched", () => {
  let lines = 0;
  let paused = 0;
  for (const seed of PASSAGE_SEEDS) {
    for (const section of seed.sections) {
      section.lines.forEach((line, index) => {
        lines += 1;
        const text = narrationTextFor(line, {
          model: "eleven_v3",
          previousEn: section.lines[index - 1]?.en,
        });
        if (text !== spokenTextFor(line)) paused += 1;
        // The displayed line never carries a marker of its own.
        assert.ok(!/<break/.test(line.en), line.en);
      });
    }
  }
  const share = paused / lines;
  assert.ok(share >= 0.03 && share <= 0.15, `${Math.round(share * 100)}% of the lines get a pause`);

  // The admin's marks are the same plans, by sentence id.
  const marks = pauseMarksForSentences(sentencesOf(seedBySlug("my-cat-is-my-boss")));
  assert.deepEqual(marks[sentenceIdFor("my-cat-is-my-boss", 1, 4)], {
    afterWord: 1,
    length: "short",
  });
  assert.equal(marks[sentenceIdFor("my-cat-is-my-boss", 1, 1)], undefined);
  assert.deepEqual(pauseMarksForSentences([]), {});
});

test("voices: every character has a voice of their own; the narrator's own lines aside", () => {
  const twins = cloneSeed();
  twins.cast = { Tom: "russ", Milo: "russ" };
  assert.ok(validatePassageSeed(twins).some((problem) => /share the voice "russ"/.test(problem)));

  const fine = cloneSeed();
  fine.cast = { Tom: "russ", Email: "narrator", Sign: "narrator" };
  assert.ok(!validatePassageSeed(fine).some((problem) => /share the voice/.test(problem)));

  for (const seed of PASSAGE_SEEDS) {
    const voices = Object.values(seed.cast).filter((voice) => voice !== "narrator");
    assert.equal(new Set(voices).size, voices.length, `${seed.slug}: two characters share a voice`);
  }
});

// --- The right-answer chime ------------------------------------------------------------

/** A recording stand-in for an AudioContext: enough to see what the chime schedules without a browser. */
function fakeChimeContext() {
  const oscillators: { frequency: number; start: number; stop: number }[] = [];
  const peaks: number[] = [];
  const gainNode = () =>
    ({
      gain: {
        value: 0,
        setValueAtTime() {},
        linearRampToValueAtTime(value: number) {
          peaks.push(value);
        },
        exponentialRampToValueAtTime() {},
      },
      connect() {},
    }) as unknown as GainNode;
  const context: ChimeContext = {
    currentTime: 10,
    sampleRate: 8000,
    destination: {} as AudioNode,
    createGain: gainNode,
    createOscillator() {
      const entry = { frequency: 0, start: 0, stop: 0 };
      oscillators.push(entry);
      return {
        type: "sine",
        frequency: {
          setValueAtTime(value: number) {
            entry.frequency = value;
          },
        },
        connect() {},
        start(when: number) {
          entry.start = when;
        },
        stop(when: number) {
          entry.stop = when;
        },
      } as unknown as OscillatorNode;
    },
    createConvolver: () => ({ buffer: null, connect() {} }) as unknown as ConvolverNode,
    createBuffer: (_channels, length) =>
      ({ getChannelData: () => new Float32Array(length) }) as unknown as AudioBuffer,
  };
  return { context, oscillators, peaks };
}

test("the right-answer chime climbs, is quiet enough not to clip, and is over within its tail", () => {
  const notes = CORRECT_CHIME_NOTES;
  for (let index = 1; index < notes.length; index += 1) {
    assert.ok(notes[index]!.at > notes[index - 1]!.at, "the notes follow one another");
    assert.ok(notes[index]!.frequency > notes[index - 1]!.frequency, "and rise");
  }
  assert.ok(
    BELL_PARTIALS.every(
      (partial, index) => index === 0 || partial.gain < BELL_PARTIALS[index - 1]!.gain,
    ),
  );
  assert.ok(
    BELL_PARTIALS.every((partial) => partial.decayScale <= 1),
    "overtones fade no slower than the note",
  );

  const { context, oscillators, peaks } = fakeChimeContext();
  const bus = createChimeBus(context);
  const started = scheduleCorrectChime(context, bus, 1);
  const expected = [...CORRECT_CHIME_NOTES, ...CORRECT_CHIME_SPARKLE].reduce(
    (sum, note) =>
      sum + BELL_PARTIALS.filter((partial) => note.frequency * partial.ratio <= 9000).length,
    0,
  );
  assert.equal(started, expected);
  assert.equal(oscillators.length, expected);
  assert.ok(
    oscillators.every((oscillator) => oscillator.stop <= context.currentTime + CHIME_TAIL_SECONDS),
  );
  assert.ok(oscillators.every((oscillator) => oscillator.frequency <= 9000));
  assert.ok(Math.max(...peaks) <= 0.3, `loudest single partial ${Math.max(...peaks)}`);
});

test("the right-answer chime follows the volume and stays silent at zero", () => {
  const quiet = fakeChimeContext();
  assert.equal(scheduleCorrectChime(quiet.context, createChimeBus(quiet.context), 0), 0);
  assert.equal(quiet.oscillators.length, 0);

  const half = fakeChimeContext();
  scheduleCorrectChime(half.context, createChimeBus(half.context), 0.5);
  const full = fakeChimeContext();
  scheduleCorrectChime(full.context, createChimeBus(full.context), 1);
  assert.ok(Math.max(...half.peaks) < Math.max(...full.peaks));
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

// --- What a finished part counts toward -------------------------------------------

test("a learner's date is only believed when it can be somebody's today", () => {
  const now = Date.parse("2026-10-15T09:30:00Z");
  assert.equal(plausibleLearnerDate("2026-10-15", now), "2026-10-15");
  // Time zones reach a day either side of UTC.
  assert.equal(plausibleLearnerDate("2026-10-16", now), "2026-10-16");
  assert.equal(plausibleLearnerDate("2026-10-14", now), "2026-10-14");
  // …and no further: a crafted date must not move anybody's streak.
  assert.equal(plausibleLearnerDate("2026-10-20", now), null);
  assert.equal(plausibleLearnerDate("2030-01-01", now), null);
  assert.equal(plausibleLearnerDate("2026-02-30", now), null, "not a real date");
  assert.equal(plausibleLearnerDate("15/10/2026", now), null);
  assert.equal(plausibleLearnerDate(20261015, now), null);
  assert.equal(plausibleLearnerDate(undefined, now), null);
});

test("a progress save carries the learner's date only when it is believable", () => {
  const now = Date.parse("2026-10-15T09:30:00Z");
  const save = { passageId: "x-y", sectionsDone: 1, correct: 1, total: 1, completed: false };
  assert.equal(
    parsePassageProgressInput({ ...save, todayISO: "2026-10-15" }, now)?.todayISO,
    "2026-10-15",
  );
  // A wrong date never costs the learner their place — only the day-keyed extras.
  const crafted = parsePassageProgressInput({ ...save, todayISO: "1999-01-01" }, now);
  assert.ok(crafted, "the save itself is still accepted");
  assert.equal(crafted?.todayISO, null);
});

test("passage badges: the first one, then five and ten", () => {
  assert.deepEqual(passageBadgesFor(0), []);
  assert.deepEqual(passageBadgesFor(1), ["firstPassage"]);
  assert.deepEqual(passageBadgesFor(5), ["firstPassage", "passages5"]);
  assert.deepEqual(passageBadgesFor(12), ["firstPassage", "passages5", "passages10"]);
});

test("the passages quest is part of the daily-quest pool with real defaults", () => {
  assert.ok(QUEST_TYPES.includes("passages"));
  assert.ok(QUEST_DEFAULTS.passages.target >= 1);
  assert.ok(QUEST_DEFAULTS.passages.xp >= 0);
});

function summary(id: string, order: number, sectionCount = 4): PassageSummary {
  return {
    id,
    order,
    level: "A1",
    tone: "funny",
    icon: "book",
    title: id,
    titleAr: id,
    summary: "",
    summaryAr: "",
    isFree: true,
    sectionCount,
    sentenceCount: 20,
    estimatedMinutes: 4,
    wordGroupId: null,
  };
}

function progressFor(passageId: string, sectionsDone: number, completed = false): PassageProgress {
  return {
    passageId,
    sectionsDone,
    correctAnswers: 0,
    totalQuestions: 0,
    completedAt: completed ? "2026-10-15T09:00:00Z" : null,
  };
}

test("Home's card: finish what you started, else the first one not started, else nothing", () => {
  const list = [summary("a", 1), summary("b", 2), summary("c", 3)];

  // Nothing started: the first.
  const fresh = homeCardPick(list, new Map());
  assert.equal(fresh?.passage.id, "a");
  assert.equal(fresh?.mode, "next");
  assert.equal(fresh?.sectionsDone, 0);

  // One in progress comes before the first untouched one, and says how far.
  const started = homeCardPick(
    list,
    new Map([
      ["a", progressFor("a", 4, true)],
      ["b", progressFor("b", 2)],
    ]),
  );
  assert.equal(started?.passage.id, "b");
  assert.equal(started?.mode, "continue");
  assert.equal(started?.sectionsDone, 2);

  // Everything finished: no card.
  const all = new Map(list.map((item) => [item.id, progressFor(item.id, 4, true)]));
  assert.equal(homeCardPick(list, all), null);
  assert.equal(homeCardPick([], new Map()), null);
});

// --- Levels and the size of the type -------------------------------------------------

test("the passages cover A1, A2 and B1, numbered 1, 2, 3… inside each level", () => {
  for (const [level, count] of [
    ["A1", 10],
    ["A2", 10],
    ["B1", 6],
  ] as const) {
    const orders = PASSAGE_SEEDS.filter((seed) => seed.level === level)
      .map((seed) => seed.order)
      .sort((a, b) => a - b);
    assert.deepEqual(
      orders,
      Array.from({ length: count }, (_, index) => index + 1),
      `level ${level}`,
    );
  }
});

test("a longer part is set in smaller type, so every part fits a screen", () => {
  assert.equal(passageTextSizeFor(0), "large");
  assert.equal(passageTextSizeFor(430), "large");
  assert.equal(passageTextSizeFor(431), "medium");
  assert.equal(passageTextSizeFor(540), "medium");
  assert.equal(passageTextSizeFor(541), "small");
  assert.equal(passageTextSizeFor(650), "small");
  assert.equal(passageTextSizeFor(651), "xsmall");
  // The authored levels land where they should: A1 big, B1 smaller.
  const sizes = (level: string) =>
    PASSAGE_SEEDS.filter((seed) => seed.level === level).flatMap((seed) =>
      seed.sections.map((section) =>
        passageTextSizeFor(section.lines.reduce((sum, line) => sum + line.en.length, 0)),
      ),
    );
  assert.ok(sizes("A1").every((size) => size === "large"));
  assert.ok(sizes("B1").some((size) => size !== "large"));
});

// --- Admin -> Passages: the rows, the narration, the voices ----------------------------------

test("the admin migration: one voice per character behind admin-only RLS, and two additive columns", () => {
  const sql = readMigration("20250337000000_passage_admin.sql");
  assert.match(sql, /create table if not exists passage_speaker_voices \(/);
  assert.match(sql, /primary key \(passage_id, speaker\)/);
  // A passage's voices go with it; a voice in use can't be deleted from under it.
  assert.match(sql, /passage_id text not null references passages \(id\) on delete cascade/);
  assert.match(sql, /voice_id text not null references voices \(id\) on delete restrict/);
  assert.match(sql, /alter table passage_speaker_voices enable row level security/);
  assert.match(sql, /create policy "Admins manage passage speaker voices"[\s\S]*is_admin/);
  assert.match(sql, /alter table passage_sentences add column if not exists say text/);
  assert.match(sql, /alter table passage_sentences add column if not exists pause jsonb/);
  assert.doesNotMatch(sql, /drop (table|column)/i, "nothing that exists is removed");
});

test("voice aliases: every alias but the narrator names a registered ElevenLabs voice, and no two share one", () => {
  const ids = Object.values(PASSAGE_VOICE_IDS);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.match(id, /^elevenlabs-[a-z0-9]+$/);
  assert.ok(
    !("narrator" in PASSAGE_VOICE_IDS),
    "the narrator is the site's default, never an id here",
  );
});

test("seed rows: a passage's rows carry everything the data says, and nothing the admin owns", () => {
  let lines = 0;
  for (const seed of PASSAGE_SEEDS) {
    const rows = sentenceRowsFor(seed);
    lines += rows.length;
    assert.equal(
      rows.length,
      seed.sections.reduce((sum, section) => sum + section.lines.length, 0),
    );
    assert.equal(new Set(rows.map((row) => row.id)).size, rows.length);

    // say and pause are kept as authored (an empty say is no say).
    const authored = seed.sections.flatMap((section) => section.lines);
    rows.forEach((row, index) => {
      assert.equal(row.say, authored[index]!.say?.trim() ? authored[index]!.say!.trim() : null);
      assert.deepEqual(row.pause, authored[index]!.pause ?? null);
      assert.equal(row.speaker, authored[index]!.who ?? null);
    });

    const parts = sectionRowsFor(seed);
    assert.equal(parts.length, seed.sections.length);
    parts.forEach((part, index) => {
      assert.equal(part.passage_id, passageIdFor(seed.slug));
      assert.deepEqual(part.questions, storedQuestionsFor(seed, index));
    });

    // Who speaks: one row per character the narrator doesn't read, each with its own voice.
    const voiceRows = speakerVoiceRowsFor(seed);
    const characters = Object.entries(seed.cast).filter(([, alias]) => alias !== "narrator");
    assert.deepEqual(
      voiceRows.map((row) => row.speaker),
      characters.map(([name]) => name),
    );
    assert.equal(new Set(voiceRows.map((row) => row.voice_id)).size, voiceRows.length);
    for (const row of voiceRows) assert.equal(row.passage_id, passageIdFor(seed.slug));

    // The data never decides status or access: those are the admin's.
    const fields = passageFieldsFor(seed);
    assert.ok(!("status" in fields) && !("is_free" in fields));
    assert.equal(fields.word_group_id, wordGroupIdFor(seed.slug));

    const words = wordRowsFor(seed);
    assert.equal(words.length, seed.words.length);
    assert.ok(words.every((word) => word.group_id === wordGroupIdFor(seed.slug)));
    assert.deepEqual(
      words.map((word) => word.id),
      seed.words.map((word) => wordIdFor(seed.slug, word.word)),
    );

    const group = wordGroupRowFor(seed, 99, true);
    assert.equal(group.status, "draft");
    assert.equal(group.level, WORD_LIST_LEVEL[seed.level]);
    assert.equal(group.order_index, 99);
  }
  assert.equal(lines, 676);
});

test("pause hints stored as jsonb are read back safely", () => {
  assert.equal(parsePauseHint("none"), "none");
  assert.deepEqual(parsePauseHint({ after: "Suddenly,", length: "long" }), {
    after: "Suddenly,",
    length: "long",
  });
  assert.deepEqual(parsePauseHint({ before: true }), { before: true });
  assert.deepEqual(parsePauseHint({ before: true, length: "short" }), {
    before: true,
    length: "short",
  });
  for (const bad of [null, undefined, 3, "later", {}, { after: "" }, { before: false }, []]) {
    assert.equal(parsePauseHint(bad), undefined, JSON.stringify(bad));
  }
  assert.deepEqual(parsePauseHint({ after: "Wow,", length: "weird" }), { after: "Wow," });
});

test("narration from the database sends exactly what the authored data would have", () => {
  let checked = 0;
  for (const seed of PASSAGE_SEEDS) {
    const jobs = narrationJobsFor(sentencesOf(seed), { model: "eleven_v3" });
    const plain = narrationJobsFor(sentencesOf(seed), { model: "eleven_v3", pauses: false });
    let index = 0;
    for (const section of seed.sections) {
      section.lines.forEach((line, lineIndex) => {
        const job = jobs[index]!;
        assert.equal(
          job.sentenceId,
          sentenceIdFor(seed.slug, seed.sections.indexOf(section) + 1, lineIndex + 1),
        );
        assert.equal(
          job.text,
          narrationTextFor(line, {
            model: "eleven_v3",
            previousEn: section.lines[lineIndex - 1]?.en,
          }),
          job.sentenceId,
        );
        assert.equal(job.plain, spokenTextFor(line));
        assert.equal(plain[index]!.text, spokenTextFor(line));
        assert.equal(job.role, line.who ?? NARRATOR_ROLE);
        index += 1;
        checked += 1;
      });
    }
  }
  assert.equal(checked, 676);
});

test("a line's reaction is judged by the line before it in the same part only", () => {
  const sentences: NarrationSentence[] = [
    {
      id: "a",
      sectionId: "s1",
      speaker: null,
      en: "The dog ate the whole cake.",
      say: null,
      pause: null,
      audioUrl: null,
    },
    { id: "b", sectionId: "s2", speaker: null, en: "Wow.", say: null, pause: null, audioUrl: null },
  ];
  const jobs = narrationJobsFor(sentences, { model: "eleven_v3" });
  const sameParts = narrationJobsFor(
    sentences.map((sentence) => ({ ...sentence, sectionId: "s1" })),
    { model: "eleven_v3" },
  );
  // Across a part break "Wow." has nothing to react to; in one part it follows a long sentence.
  assert.equal(jobs[1]!.text, narrationTextFor({ en: "Wow." }, { model: "eleven_v3" }));
  assert.equal(
    sameParts[1]!.text,
    narrationTextFor(
      { en: "Wow." },
      { model: "eleven_v3", previousEn: "The dog ate the whole cake." },
    ),
  );
});

function voice(
  id: string,
  providerVoiceId = `provider-${id}`,
  gender: "female" | "male" = "female",
): NarrationVoice {
  return { id, name: `Voice ${id}`, gender, providerVoiceId, sampleAudioUrl: null };
}

function setupOf(
  assigned: Record<string, string>,
  options: { narrator?: string | null; voices?: NarrationVoice[] } = {},
): VoiceSetup {
  const voices = options.voices ?? ["n", "a", "b", "c"].map((id) => voice(id));
  return {
    assigned: new Map(Object.entries(assigned)),
    defaultNarratorVoiceId: options.narrator === undefined ? "n" : options.narrator,
    voices: new Map(voices.map((entry) => [entry.id, entry])),
  };
}

test("voices: the narrator falls back to the site default, a character nobody voiced to the narrator", () => {
  const { voiceFor, problems } = resolveNarrationVoices(
    [NARRATOR_ROLE, "Anna", "Email"],
    setupOf({ Anna: "a" }),
  );
  assert.deepEqual(problems, []);
  assert.equal(voiceFor.get(NARRATOR_ROLE)?.id, "n");
  assert.equal(voiceFor.get("Anna")?.id, "a");
  assert.equal(
    voiceFor.get("Email")?.id,
    "n",
    "a character with no voice of their own is read by the narrator",
  );

  // The passage's own narrator beats the site default.
  const own = resolveNarrationVoices(
    [NARRATOR_ROLE, "Anna"],
    setupOf({ narrator: "b", Anna: "a" }),
  );
  assert.equal(own.voiceFor.get(NARRATOR_ROLE)?.id, "b");
  assert.deepEqual(own.problems, []);
});

test("voices: two roles never share a voice, and nothing is narrated with a voice nobody chose", () => {
  const twins = resolveNarrationVoices(
    ["Anna", "Dan"],
    setupOf(
      { Anna: "a", Dan: "b" },
      { voices: [voice("n"), voice("a", "same"), voice("b", "same")] },
    ),
  );
  assert.ok(
    twins.problems.some((problem) => /Dan and Anna would speak with the same voice/.test(problem)),
  );

  // A character with the narrator's own voice is the same problem.
  const withNarrator = resolveNarrationVoices(
    ["Anna"],
    setupOf({ Anna: "a" }, { voices: [voice("n", "same"), voice("a", "same")] }),
  );
  assert.ok(withNarrator.problems.some((problem) => /Anna and the narrator/.test(problem)));

  const noNarrator = resolveNarrationVoices(["Anna"], setupOf({ Anna: "a" }, { narrator: null }));
  assert.ok(noNarrator.problems.some((problem) => /no narrator voice/.test(problem)));

  const unknown = resolveNarrationVoices(["Anna"], setupOf({ Anna: "ghost" }));
  assert.ok(
    unknown.problems.some((problem) => /Anna is not a registered|chosen for Anna/.test(problem)),
  );
});

test("the plan narrates what is missing, or everything with force, for one role, minus what a run already did", () => {
  const seed = seedBySlug("my-cat-is-my-boss");
  const ids = sentenceRowsFor(seed).map((row) => row.id);
  const clips = new Set(ids.slice(0, 3));
  const sentences = sentencesOf(seed, clips);
  const cast = Object.keys(seed.cast);
  const setup = setupOf(
    Object.fromEntries(
      speakerVoiceRowsFor(seed).map((row, index) => [row.speaker, ["a", "b", "c"][index]!]),
    ),
  );

  const missing = planNarration(sentences, setup, "eleven_v3");
  assert.deepEqual(missing.problems, []);
  assert.equal(missing.all.length, ids.length);
  assert.deepEqual(
    missing.jobs.map((job) => job.sentenceId),
    ids.slice(3),
  );

  const forced = planNarration(sentences, setup, "eleven_v3", { force: true });
  assert.equal(forced.jobs.length, ids.length);

  const one = planNarration(sentences, setup, "eleven_v3", { force: true, role: cast[0] });
  assert.ok(one.jobs.length > 0 && one.jobs.every((job) => job.role === cast[0]));

  const skipped = planNarration(sentences, setup, "eleven_v3", {
    force: true,
    skip: new Set(ids.slice(0, 10)),
  });
  assert.deepEqual(
    skipped.jobs.map((job) => job.sentenceId),
    ids.slice(10),
  );

  // A passage whose setup is wrong still plans, but says so: nothing narrates until it is fixed.
  const broken = planNarration(sentences, setupOf({}, { narrator: null }), "eleven_v3");
  assert.ok(broken.problems.length > 0);

  assert.deepEqual(rolesOf(sentences)[0], NARRATOR_ROLE);
  const cost = narrationCost(missing.jobs);
  assert.equal(cost.lines, missing.jobs.length);
  assert.equal(
    cost.characters,
    missing.jobs.reduce((sum, job) => sum + job.text.length, 0),
  );
});

test("the narrator is a reserved name: no character can be called that", () => {
  const seed = cloneSeed();
  const [name, alias] = Object.entries(seed.cast)[0]!;
  seed.cast = { ...seed.cast, Narrator: alias };
  delete seed.cast[name];
  for (const section of seed.sections) {
    for (const line of section.lines) if (line.who === name) line.who = "Narrator";
  }
  assert.ok(
    validatePassageSeed(seed).some((problem) => /can't be called "narrator"/.test(problem)),
  );
});

test("a Premium passage opens for a subscriber or an admin, a free one for everybody", () => {
  assert.equal(canOpenPassage({ isFree: true }, false), true);
  assert.equal(canOpenPassage({ isFree: false }, false), false);
  assert.equal(canOpenPassage({ isFree: false }, true), true);
  const mixed = [
    { id: "a", isFree: true },
    { id: "b", isFree: false },
    { id: "c", isFree: true },
  ];
  assert.deepEqual(
    openablePassages(mixed, false).map((passage) => passage.id),
    ["a", "c"],
  );
  assert.equal(openablePassages(mixed, true).length, 3);
});

test("a word lesson is open in Word Lists only while the section is On and its passage is published", () => {
  assert.equal(wordGroupStatusFor("on", "published"), "published");
  assert.equal(wordGroupStatusFor("on", "draft"), "draft");
  assert.equal(wordGroupStatusFor("admin", "published"), "draft");
  assert.equal(wordGroupStatusFor("off", "published"), "draft");
});

test("import: an authored passage written out as JSON is accepted, as it is", () => {
  for (const seed of PASSAGE_SEEDS) {
    const parsed = parsePassageJson(JSON.stringify(seed));
    assert.deepEqual(parsed.problems, [], seed.slug);
    assert.deepEqual(parsed.seed, seed);
  }
});

test("import: bad JSON, a wrong shape and a broken rule are each said in plain words", () => {
  assert.match(parsePassageJson("{ nope").problems[0]!, /not valid JSON/);
  assert.match(parsePassageJson("[]").problems[0]!, /must be one passage/);
  assert.match(parsePassageJson("3").problems[0]!, /must be one passage/);

  const wrongShape = JSON.parse(JSON.stringify(cloneSeed())) as Record<string, unknown>;
  wrongShape.order = "first";
  wrongShape.cast = "Anna";
  wrongShape.sections = {};
  const shape = parsePassageJson(JSON.stringify(wrongShape));
  assert.equal(shape.seed, null);
  assert.ok(shape.problems.some((problem) => /order must be a whole number/.test(problem)));
  assert.ok(shape.problems.some((problem) => /cast must be an object/.test(problem)));
  assert.ok(shape.problems.some((problem) => /sections must be a list/.test(problem)));

  const badPause = structuredClone(cloneSeed());
  (badPause.sections[0]!.lines[0] as { pause?: unknown }).pause = 7;
  assert.ok(
    parsePassageJson(JSON.stringify(badPause)).problems.some((problem) =>
      /pause must be/.test(problem),
    ),
  );

  const brokenRule = cloneSeed();
  brokenRule.sections[0]!.question.answer = 9;
  const rule = parsePassageJson(JSON.stringify(brokenRule));
  assert.equal(rule.seed, null);
  assert.ok(rule.problems.some((problem) => /answer 9 is not one of/.test(problem)));

  // However much is wrong, a dozen problems are enough to start fixing.
  const hopeless = parsePassageJson(
    JSON.stringify({ sections: Array.from({ length: 40 }, () => 1) }),
  );
  assert.ok(hopeless.problems.length <= 12);
});
