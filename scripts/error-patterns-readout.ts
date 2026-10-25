/**
 * Read-only readout: which spelling patterns do learners get wrong in the lessons and stories?
 * (The strategy report's phase-0 item "error log by word property", and the evidence for deciding
 * whether an Arabic-speaker spelling coach is worth building.)
 *
 * For every word the lessons hold, it counts the learners who FINISHED a lesson holding it (exposed)
 * and, of those, the learners with a mistake logged on it in such a lesson (wrong), and how many of
 * them got it wrong twice or more (a gap rather than a slip). Patterns are then compared with plain
 * words of the same length (src/lib/readout/spelling.ts). Reads the live database through the service
 * role; nothing is written, and no learner id or email is printed. Admin accounts are left out.
 *
 * Run with:
 *   npx tsx --env-file=.env.local scripts/error-patterns-readout.ts
 * Optional: --min-exposed 300 (the least exposure a word needs to be listed among the hardest).
 */

import { isMistakeWorthTracking, normalizeMistakeWord } from "../src/lib/mistakes/normalize";
import { pct } from "../src/lib/readout/returns";
import {
  LENGTH_BUCKETS,
  rate,
  spellingFeatures,
  spellingReport,
} from "../src/lib/readout/spelling";
import type { WordStat } from "../src/lib/readout/spelling";
import { all, arg, readAdminIds } from "./_readout-rest";

/** A word seen by fewer learners than this is left out of every figure: its rate is noise. */
const MIN_EXPOSED_FOR_ANALYSIS = 30;

const percent = (value: number | null) => (value === null ? "-" : `${(value * 100).toFixed(1)}%`);

async function main() {
  const minListed = Number(arg("--min-exposed") ?? 300);
  const admins = await readAdminIds();

  console.error("Reading finished lessons, sentences and mistakes (read-only)...");
  const [progress, sentences, mistakes] = await Promise.all([
    all<{ user_id: string; lesson_id: string; mode: string }>(
      "user_progress?select=user_id,lesson_id,mode&completed_at=not.is.null&mode=in.(normal,stories)&order=id",
    ),
    all<{ id: string; lesson_id: string; en: string }>("sentences?select=id,lesson_id,en&order=id"),
    all<{
      user_id: string;
      word: string;
      sentence_id: string;
      mistake_count: number;
      error_indexes: number[] | null;
    }>(
      "mistakes?select=user_id,word,sentence_id,mistake_count,error_indexes&sentence_id=not.is.null&order=id",
    ),
  ]);

  // The tracked words of each lesson, and which lesson a sentence belongs to.
  const wordsOfLesson = new Map<string, Set<string>>();
  const lessonOfSentence = new Map<string, string>();
  for (const sentence of sentences) {
    lessonOfSentence.set(sentence.id, sentence.lesson_id);
    const words = wordsOfLesson.get(sentence.lesson_id) ?? new Set<string>();
    for (const token of sentence.en.split(/\s+/)) {
      if (!isMistakeWorthTracking(token)) continue;
      words.add(normalizeMistakeWord(token));
    }
    wordsOfLesson.set(sentence.lesson_id, words);
  }

  // Exposure: who finished a lesson holding the word.
  const finished = new Map<string, Set<string>>();
  const exposedTo = new Map<string, Set<string>>();
  for (const row of progress) {
    if (admins.has(row.user_id)) continue;
    const lessons = finished.get(row.user_id) ?? new Set<string>();
    if (lessons.has(row.lesson_id)) continue;
    lessons.add(row.lesson_id);
    finished.set(row.user_id, lessons);
    for (const word of wordsOfLesson.get(row.lesson_id) ?? []) {
      const users = exposedTo.get(word) ?? new Set<string>();
      users.add(row.user_id);
      exposedTo.set(word, users);
    }
  }

  // Wrong: a mistake logged on the word, in a lesson that learner finished.
  const wrongCounts = new Map<string, Map<string, number>>();
  /** Per word: how often each letter position was wrong in the learners' latest attempt, and how many rows said where. */
  const positions = new Map<string, { rows: number; at: Map<number, number>; raw: string }>();
  let used = 0;
  /** Letters marked wrong in the learners' latest attempts, by class. */
  const wrongLetters = {
    total: 0,
    vowels: 0,
    first: 0,
    last: 0,
    expectedFirst: 0,
  };
  for (const row of mistakes) {
    if (admins.has(row.user_id)) continue;
    const lesson = lessonOfSentence.get(row.sentence_id);
    if (!lesson || !finished.get(row.user_id)?.has(lesson)) continue;
    const word = normalizeMistakeWord(row.word);
    if (!exposedTo.get(word)?.has(row.user_id)) continue;
    const users = wrongCounts.get(word) ?? new Map<string, number>();
    users.set(row.user_id, (users.get(row.user_id) ?? 0) + Math.max(1, row.mistake_count));
    wrongCounts.set(word, users);
    used += 1;
    if (row.error_indexes && row.error_indexes.length > 0) {
      const where = positions.get(word) ?? {
        rows: 0,
        at: new Map<number, number>(),
        raw: row.word,
      };
      where.rows += 1;
      for (const index of new Set(row.error_indexes))
        where.at.set(index, (where.at.get(index) ?? 0) + 1);
      const letters = row.word.replace(/[^\p{L}]/gu, "");
      if (letters.length >= 4) {
        for (const index of new Set(row.error_indexes)) {
          if (index < 0 || index >= row.word.length) continue;
          const letter = row.word[index]!.toLowerCase();
          if (!/\p{L}/u.test(letter)) continue;
          wrongLetters.total += 1;
          if ("aeiou".includes(letter)) wrongLetters.vowels += 1;
          if (index === 0) wrongLetters.first += 1;
          if (index === row.word.length - 1) wrongLetters.last += 1;
          wrongLetters.expectedFirst += 1 / letters.length;
        }
      }
      positions.set(word, where);
    }
  }

  const stats: WordStat[] = [];
  for (const [word, users] of exposedTo) {
    if (users.size < MIN_EXPOSED_FOR_ANALYSIS) continue;
    const wrong = wrongCounts.get(word);
    stats.push({
      word,
      exposed: users.size,
      wrong: wrong?.size ?? 0,
      repeat: wrong ? [...wrong.values()].filter((count) => count >= 2).length : 0,
    });
  }

  const report = spellingReport(stats);
  console.log(
    `Read ${progress.length} finished lessons by ${finished.size} learners, ${sentences.length} sentences, ${mistakes.length} mistake rows (${used} used: sentence lessons the learner finished).`,
  );
  console.log(
    `Words analysed: ${report.all.words} (each seen by at least ${MIN_EXPOSED_FOR_ANALYSIS} learners). Learner-word pairs exposed: ${report.all.exposed}; with a mistake: ${report.all.wrong} (${pct(report.all.wrong, report.all.exposed)}); of those, wrong twice or more: ${pct(report.all.repeat, report.all.wrong)}.`,
  );

  console.log("\nPLAIN WORDS (none of the patterns below), the yardstick, by length");
  console.table(
    LENGTH_BUCKETS.map((bucket) => ({
      length: bucket,
      words: report.baseline[bucket].words,
      "learner-word pairs": report.baseline[bucket].exposed,
      "wrong rate": percent(rate(report.baseline[bucket].wrong, report.baseline[bucket].exposed)),
      "wrong twice+": percent(rate(report.baseline[bucket].repeat, report.baseline[bucket].wrong)),
    })),
  );

  console.log(
    "\nPATTERNS, hardest first. 'x plain' = wrong learners over the number expected if these words were as hard as plain words of the same length (1.0 = no harder). A word can have several patterns and then counts in each.",
  );
  console.table(
    report.rows.map((row) => ({
      pattern: row.label,
      words: row.words,
      "learner-word pairs": row.exposed,
      "wrong rate": percent(row.rate),
      "x plain": row.ratio === null ? "-" : row.ratio.toFixed(2),
      "wrong twice+": percent(row.repeatShare),
    })),
  );

  console.log(`\nTHE 25 HARDEST WORDS (seen by at least ${minListed} learners)`);
  console.table(
    stats
      .filter((stat) => stat.exposed >= minListed)
      .sort((a, b) => b.wrong / b.exposed - a.wrong / a.exposed)
      .slice(0, 25)
      .map((stat) => ({
        word: stat.word,
        learners: stat.exposed,
        "wrong rate": percent(stat.wrong / stat.exposed),
        "wrong twice+": percent(rate(stat.repeat, stat.wrong)),
        patterns: spellingFeatures(stat.word).join(", ") || "-",
      })),
  );
  console.log(
    "\nWHERE IN THE WORD they go wrong: the words that many learners got wrong more than once (a gap, not a slip). The letter is the one in the word; the share is of the attempts that recorded where, how many had that letter wrong.",
  );
  console.table(
    stats
      .filter((stat) => stat.exposed >= minListed && stat.repeat >= 40)
      .sort((a, b) => b.repeat - a.repeat)
      .slice(0, 20)
      .map((stat) => {
        const where = positions.get(stat.word);
        const top = where
          ? [...where.at.entries()]
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3)
              .map(
                ([index, count]) =>
                  `${where.raw[index] ?? "?"} (${index + 1}): ${percent(count / where.rows)}`,
              )
              .join(" · ")
          : "-";
        return {
          word: stat.word,
          "learners wrong twice+": stat.repeat,
          "of learners who saw it": percent(stat.repeat / stat.exposed),
          "letters most often wrong (position)": top,
        };
      }),
  );
  let lettersTyped = 0;
  let vowelsTyped = 0;
  for (const stat of stats) {
    const letters = stat.word.replace(/[^\p{L}]/gu, "");
    if (letters.length < 4) continue;
    lettersTyped += stat.exposed * letters.length;
    vowelsTyped += stat.exposed * [...letters].filter((letter) => "aeiou".includes(letter)).length;
  }
  console.log(
    "\nWHICH LETTERS are marked wrong (words of four letters or more; the letters marked wrong in each learner's latest attempt)",
  );
  console.table([
    {
      "letters marked wrong": wrongLetters.total,
      "vowels: share of letters typed": percent(rate(vowelsTyped, lettersTyped)),
      "vowels: share of letters marked wrong": percent(
        rate(wrongLetters.vowels, wrongLetters.total),
      ),
      "first letter: share marked wrong": percent(rate(wrongLetters.first, wrongLetters.total)),
      "first letter: share if it were chance": percent(
        rate(wrongLetters.expectedFirst, wrongLetters.total),
      ),
      "last letter: share marked wrong": percent(rate(wrongLetters.last, wrongLetters.total)),
    },
  ]);
  console.log(
    "\nRead it as: a word 'wrong' for a learner means a mistake was logged in a lesson they finished (a slip counts like a gap; 'wrong twice+' is the closer look at gaps). Patterns are my orthographic guesses at what an Arabic speaker finds hard; this shows which are harder than a plain word of the same length, not why.",
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
