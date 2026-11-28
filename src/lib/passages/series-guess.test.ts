import assert from "node:assert/strict";
import test from "node:test";

import { PASSAGE_SEEDS } from "@/data/passages";
import { SERIES_GUESSES } from "@/data/passages/series-guesses";
import { PASSAGE_SERIES } from "@/lib/passages/series";

import {
  countdown,
  guessAfter,
  guessAnsweredBy,
  opensTomorrow,
  parseGuess,
  previousEpisode,
  typedLetter,
  typedSoFar,
} from "./series-guess";
import { seriesReminderId, seriesReminderPassage, seriesReminderText } from "./series-reminder";

const episodes = PASSAGE_SERIES[0]!.episodes.map((episode) => episode.passageId);

test("every guess stands between two written episodes and its answer is really in the next one", () => {
  for (const guess of SERIES_GUESSES) {
    assert.equal(episodes[episodes.indexOf(guess.after) + 1], guess.next);
    const next = PASSAGE_SEEDS.find((seed) => seed.slug === guess.next)!;
    assert.equal(next.title, guess.nextTitle);
    const line = next.sections[guess.reveal.section]!.lines[guess.reveal.line]!.en;
    for (const word of guess.reveal.light) assert.ok(line.includes(word), `${word}: ${line}`);
    // The hidden line of the waiting screen is that line with the answer taken out.
    assert.ok(line.includes(`${guess.teaser.before}${guess.answer}${guess.teaser.after}`), line);
    assert.equal(guess.options.filter((option) => option.word === guess.answer).length, 1);
    assert.equal(new Set(guess.options.map((option) => option.word)).size, guess.options.length);
  }
});

test("a guess is asked after an episode and answered by the next, and nowhere else", () => {
  assert.equal(guessAfter(episodes[0]!)?.next, episodes[1]);
  assert.equal(guessAnsweredBy(episodes[1]!)?.after, episodes[0]);
  assert.equal(guessAnsweredBy(episodes[0]!), null);
  // The last written episode asks nothing: no next one answers it yet.
  assert.equal(guessAfter(episodes[episodes.length - 1]!), null);
  assert.equal(previousEpisode(episodes[0]!), null);
  assert.equal(previousEpisode(episodes[2]!), episodes[1]);
  assert.equal(previousEpisode("my-cat-is-my-boss"), null);
});

test("an episode is closed only on the day the one before it was finished", () => {
  const dayOf = (iso: string) => iso.slice(0, 10);
  const closed = (previousCompletedAt: string | null, sectionsDone = 0) =>
    opensTomorrow({ previousCompletedAt, sectionsDone, todayISO: "2026-11-28", dayOf });
  assert.equal(closed("2026-11-28T09:00:00Z"), true);
  assert.equal(closed("2026-11-27T23:59:00Z"), false);
  assert.equal(closed(null), false);
  // Once it has been started it is never taken back.
  assert.equal(closed("2026-11-28T09:00:00Z", 1), false);
});

test("the countdown and the letter", () => {
  assert.equal(countdown(3_723_000, 0), "01:02:03");
  assert.equal(countdown(0, 5_000), "00:00:00");
  assert.equal(typedSoFar("Cole", "co"), 2);
  assert.equal(typedSoFar("grandmother", "grxan dmother"), 11);
  assert.equal(typedSoFar("key", "zzz"), 0);
});

test("a key writes its letter, also on a keyboard left on Arabic", () => {
  assert.equal(typedLetter("c", "KeyC"), "c");
  assert.equal(typedLetter("C", "KeyC"), "C");
  assert.equal(typedLetter("ؤ", "KeyC"), "c");
  assert.equal(typedLetter("لا", "KeyB"), "b");
  // Not a letter: left to the browser.
  assert.equal(typedLetter("Escape", "Escape"), null);
  assert.equal(typedLetter("Unidentified", ""), null);
  assert.equal(typedLetter(" ", "Space"), null);
  assert.equal(typedLetter("1", "Digit1"), null);
});

test("a stored guess is read back, and anything else is none", () => {
  const stored = { word: "mother", lead: "It was her", sealedAt: "x", revealed: false };
  assert.deepEqual(parseGuess(JSON.stringify(stored)), stored);
  assert.equal(parseGuess(null), null);
  assert.equal(parseGuess("nonsense"), null);
  assert.equal(parseGuess('{"word":3}'), null);
});

test("the series reminder names the question left open, in each language", () => {
  const next = episodes[1]!;
  assert.equal(seriesReminderPassage(seriesReminderId(next)), next);
  // A lesson reminder, or a marker for an episode that answers nothing, is not a series reminder.
  assert.equal(seriesReminderPassage("normal-1"), null);
  assert.equal(seriesReminderPassage(seriesReminderId(episodes[0]!)), null);
  assert.equal(seriesReminderPassage(null), null);
  for (const language of ["en", "ar", "es", "tr"] as const) {
    const text = seriesReminderText(language, next)!;
    assert.ok(text.subject && text.body.includes("A Letter from Nora"));
    assert.equal(text.path, `/learn/passages/${next}`);
  }
  assert.ok(seriesReminderText("ar", next)!.subject.includes("من كتب لسارة"));
});
