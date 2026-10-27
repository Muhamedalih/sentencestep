/**
 * Read-only readout of the Word Lists section (the topic lists under "Word Lists"): who typed words
 * there, how deep they went, whether they came back, how far the Family list's learners get, what
 * the weak-word ledger looks like, and the WORDS_ROUND events once they exist. It is the "before"
 * for everything built on the words (docs: reports/words-work-plan-2026-10-27.md, slice W1), taken at
 * a date that stays put so a later run can be set against it.
 *
 * Reads the live database through the service role with GET requests only (nothing is written, no id
 * or email is printed). Learners are accounts with the role "user": admins and editors are left out.
 * Only the 24 published topic lists count: the 53 hidden lists of passage words are not read.
 *
 * `--as-of` is required and fixes the figures: a date counts through the END of that UTC day, so the
 * same date prints the same figures once the day is over; a full instant ("2026-10-26T20:00:00Z")
 * counts what is before it. `--as-of 2026-10-26` reproduces the strategy report of 27 Oct 2026 to
 * within a rounding step (1,551 learners, 691 in the last 7 days, 18.8% came back, 16,575 weak words).
 *
 * Run with:
 *   npx tsx --env-file=.env.local scripts/words-readout.ts --as-of 2026-10-26
 *
 * What it cannot say: guests keep their progress in the browser, so they are not in the database
 * (the typed-words figures are signed-in learners); the share of time spent in the section is
 * Microsoft Clarity's; and the weak-word ledger is a live table, so for a date long past its open /
 * corrected split is today's.
 */

import { isPassageWordGroupId } from "../src/lib/passages/ids";
import { DAY_MS, pct } from "../src/lib/readout/returns";
import {
  comeBack,
  depthSummary,
  finishedAnyList,
  groupFunnel,
  learnerUses,
  ledgerStats,
  parseAsOf,
  roundStats,
  startTiming,
  touchedGroup,
  windowUse,
} from "../src/lib/readout/words";
import type { LedgerRow, RoundEventRow, TypedWord } from "../src/lib/readout/words";
import { all, allOrEmpty, arg } from "./_readout-rest";

/** The list almost every learner meets first: its funnel is the one the strategy report gives. */
const FUNNEL_GROUP = "family";

/** The report counts 24 published topic lists; another number is worth a look before reading on. */
const EXPECTED_TOPIC_LISTS = 24;

const share = (part: number, whole: number) =>
  whole === 0 ? "-" : `${pct(part, whole)} (${part})`;
const fixed = (value: number | undefined, digits = 1) =>
  value === undefined ? "-" : value.toFixed(digits);

async function main() {
  const asOf = parseAsOf(arg("--as-of"));
  if (!asOf) {
    console.error(
      "Give a fixed date: --as-of YYYY-MM-DD (counts through the end of that UTC day), or a full instant like 2026-10-26T20:00:00Z.\nExample: npx tsx --env-file=.env.local scripts/words-readout.ts --as-of 2026-10-26",
    );
    process.exit(1);
  }
  const { cutoffMs, day } = asOf;
  const cutoffIso = new Date(cutoffMs).toISOString();
  const readAt = new Date();

  console.log("WORDS READOUT: Word Lists, the published topic lists");
  console.log(
    `as of: everything before ${cutoffIso} (through the end of ${day} UTC). Read at ${readAt.toISOString()}.`,
  );
  if (cutoffMs > readAt.getTime()) {
    console.log(
      "NOTE: that moment has not come yet, so the day is not over and these figures will change if you run this again. A fixed reading needs a date that is over.",
    );
  }

  console.error(
    "Reading lists, words, accounts, typed words, weak words and events (read-only)...",
  );
  const groups = await all<{ id: string; status: string }>(
    "word_groups?select=id,status&order=order_index",
  );
  const listWords = await all<{ id: string; group_id: string }>(
    "vocabulary_words?select=id,group_id&order=id",
  );
  const profiles = await all<{ id: string; role: string; created_at: string }>(
    "profiles?select=id,role,created_at&order=id",
  );
  const progress = await all<{
    user_id: string;
    word_id: string;
    created_at: string;
    completed_at: string;
  }>(
    `word_progress?select=user_id,word_id,created_at,completed_at&created_at=lt.${cutoffIso}&order=id`,
  );
  const weakRows = await all<LedgerRow>(
    `mistakes?select=user_id,status,created_at,corrected_at,review_stage,next_review_at&sentence_id=is.null&created_at=lt.${cutoffIso}&order=id`,
  );
  const events = await allOrEmpty<RoundEventRow>(
    `analytics_events?select=user_id,event_name,event_properties&event_name=in.(WORDS_ROUND_STARTED,WORDS_ROUND_FINISHED)&created_at=lt.${cutoffIso}&order=id`,
  );

  // ---- Which lists, which accounts. ----
  const topicGroups = groups.filter(
    (group) => group.status === "published" && !isPassageWordGroupId(group.id),
  );
  const topicIds = new Set(topicGroups.map((group) => group.id));
  const groupOfWord = new Map<string, string>();
  const sizes = new Map<string, number>();
  for (const word of listWords) {
    if (!topicIds.has(word.group_id)) continue;
    groupOfWord.set(word.id, word.group_id);
    sizes.set(word.group_id, (sizes.get(word.group_id) ?? 0) + 1);
  }
  console.log(
    `lists: ${topicGroups.length} published topic lists with ${groupOfWord.size} words (${groups.length - topicGroups.length} other lists, the hidden passage word lessons among them, are not read).`,
  );
  if (topicGroups.length !== EXPECTED_TOPIC_LISTS) {
    console.log(
      `WARNING: the strategy report counted ${EXPECTED_TOPIC_LISTS} published topic lists; there are ${topicGroups.length} now, so the figures are not comparable with it.`,
    );
  }

  const learnerAccounts = profiles.filter((profile) => profile.role === "user");
  const learnerIds = new Set(learnerAccounts.map((profile) => profile.id));
  const signedUpMs = new Map(
    learnerAccounts.map((profile) => [profile.id, Date.parse(profile.created_at)]),
  );
  const registered = learnerAccounts.filter(
    (profile) => Date.parse(profile.created_at) < cutoffMs,
  ).length;
  console.log(
    `learners: ${registered} registered accounts of role "user" (admins and editors left out).`,
  );

  const typed: TypedWord[] = [];
  for (const row of progress) {
    const groupId = groupOfWord.get(row.word_id);
    if (!groupId || !learnerIds.has(row.user_id)) continue;
    typed.push({
      userId: row.user_id,
      groupId,
      firstMs: Date.parse(row.created_at),
      lastMs: Date.parse(row.completed_at),
    });
  }
  const uses = learnerUses(typed, cutoffMs);

  // ---- 1. Who used the lists. ----
  console.log(
    "\n1. WHO TYPED WORDS IN THE LISTS (a word typed right, or typed again, inside the window)",
  );
  const windows: { label: string; spanMs: number | null }[] = [
    { label: "since the start", spanMs: null },
    { label: "last 30 days", spanMs: 30 * DAY_MS },
    { label: "last 7 days", spanMs: 7 * DAY_MS },
  ];
  console.table(
    windows.map(({ label, spanMs }) => {
      const window = windowUse(typed, spanMs === null ? null : cutoffMs - spanMs, cutoffMs);
      return {
        window: label,
        learners: window.learners,
        "share of registered learners": pct(window.learners, registered),
        words: window.words,
        "words per learner (mean)": fixed(window.perLearner?.mean),
        "words per learner (median)": fixed(window.perLearner?.median, 0),
      };
    }),
  );

  // ---- 2. How deep. ----
  const depth = depthSummary(uses);
  if (!depth) {
    console.log("\nNo learner typed a word before the cutoff: nothing more to read.");
  } else {
    console.log(`\n2. HOW DEEP, since the start (${depth.learners} learners)`);
    console.table([
      {
        measure: "words typed right per learner",
        mean: fixed(depth.words.mean),
        median: fixed(depth.words.median, 0),
        "90th percent": depth.words.p90,
      },
      {
        measure: "typing events per day of use (first typing and re-typing)",
        mean: fixed(depth.useDay?.mean),
        median: fixed(depth.useDay?.median, 0),
        "90th percent": depth.useDay?.p90 ?? "-",
      },
    ]);
    console.log("learners by words typed right:");
    console.table(
      depth.buckets.map((bucket) => ({
        words: bucket.label,
        learners: bucket.count,
        share: pct(bucket.count, depth.learners),
      })),
    );
    console.table([
      {
        measure: "days with NEW words (UTC)",
        mean: fixed(depth.newDays.mean, 2),
        "exactly one": share(depth.newDays.one, depth.learners),
        "two or more": share(depth.newDays.twoPlus, depth.learners),
        "three or more": share(depth.newDays.threePlus, depth.learners),
      },
      {
        measure: "lists touched",
        mean: fixed(depth.lists.mean, 2),
        "exactly one": share(depth.lists.one, depth.learners),
        "two or more": share(depth.lists.twoPlus, depth.learners),
        "three or more": share(depth.lists.threePlus, depth.learners),
      },
    ]);
    const timing = startTiming(uses, signedUpMs);
    console.log(
      `first word after signing up (of ${timing.known} learners): within an hour ${pct(timing.within1h, timing.known)}, within 24 hours ${pct(timing.within24h, timing.known)}, more than 7 days later ${pct(timing.after7d, timing.known)}.`,
    );

    // ---- 3. Coming back. ----
    const back = comeBack(uses, day);
    console.log(
      `\n3. COMING BACK: of the ${back.pool} learners who started at least 8 days before ${day}, ${back.back} (${pct(back.back, back.pool)}) typed NEW words on another day than their first.`,
    );
    console.log(
      `   (all learners: ${share(depth.newDays.twoPlus, depth.learners)} typed new words on two or more days)`,
    );

    // ---- 4. Lists. ----
    const family = touchedGroup(uses, FUNNEL_GROUP);
    const finishedAny = finishedAnyList(uses, sizes);
    console.log("\n4. LISTS");
    console.table([
      {
        measure: `touched the ${FUNNEL_GROUP} list`,
        learners: share(family.touched, depth.learners),
      },
      {
        measure: `touched only the ${FUNNEL_GROUP} list`,
        learners: share(family.onlyThis, depth.learners),
      },
      {
        measure: "typed every word of at least one list",
        learners: share(finishedAny, depth.learners),
      },
    ]);
    const familySize = sizes.get(FUNNEL_GROUP);
    if (familySize === undefined) {
      console.log(`The "${FUNNEL_GROUP}" list is not among the published topic lists: no funnel.`);
    } else {
      const funnel = groupFunnel(uses, FUNNEL_GROUP, familySize);
      console.log(
        `how far the ${funnel.started} learners who started the ${FUNNEL_GROUP} list (${familySize} words) get:`,
      );
      console.table(
        funnel.reached.map((step) => ({
          "reached (words)":
            step.words === familySize ? `${step.words} (the whole list)` : step.words,
          learners: step.learners,
          "share of those who started": pct(step.learners, funnel.started),
        })),
      );
      console.log(
        `   of the ${funnel.finished} who finished it, ${pct(funnel.finishedAlsoOther, funnel.finished)} also typed a word of another list.`,
      );
    }
  }

  // ---- 5. The weak-word ledger. ----
  const ledger = ledgerStats(
    weakRows.filter((row) => learnerIds.has(row.user_id)),
    cutoffMs,
  );
  console.log(
    "\n5. THE WEAK-WORD LEDGER (mistakes with no sentence: words missed in the Word Lists). Live table: status is as of the reading.",
  );
  console.table([
    { measure: "words missed (learner and word)", value: ledger.words },
    { measure: "learners who missed any", value: ledger.learners },
    { measure: "corrected", value: share(ledger.corrected, ledger.words) },
    {
      measure: "median minutes from the miss to the correction",
      value: fixed(ledger.medianMinutesToCorrect ?? undefined, 2),
    },
    {
      measure: "on the review schedule (stage reached or next review set)",
      value: ledger.scheduled,
    },
    { measure: "still open (never corrected)", value: share(ledger.open, ledger.words) },
    { measure: "learners with open words", value: ledger.openLearners },
    {
      measure: "median age of the open words (days)",
      value: fixed(ledger.openMedianAgeDays ?? undefined),
    },
    {
      measure: "open words older than 3 days",
      value: share(ledger.openOlderThan3Days, ledger.open),
    },
  ]);

  // ---- 6. The new events. ----
  const rounds = roundStats(events, (id) => learnerIds.has(id));
  console.log("\n6. WORDS_ROUND EVENTS (guests included, admins and editors left out)");
  if (rounds.length === 0) {
    console.log(
      "none recorded before the cutoff: the events start with the release that carries them.",
    );
  } else {
    console.table(
      rounds.map((round) => ({
        source: round.source,
        started: round.started,
        finished: round.finished,
        "finished / started": pct(round.finished, round.started),
        "words asked (finished)": round.asked,
        "first-go right": pct(round.clean + round.assisted, round.asked),
        "right with a hint": pct(round.assisted, round.asked),
        missed: pct(round.missed, round.asked),
        "signed-in learners": round.learners,
        "starts by guests": round.guestStarts,
      })),
    );
  }

  console.log(
    '\nDefinitions: learners = role "user"; typed = a word typed right at least once; days are UTC days; "came back" = new words on a day other than the first, among learners who started 8+ days before the as-of day. Guests keep their progress in the browser and are not here. Time in the section (Clarity) is not readable from the database.',
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
