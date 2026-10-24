# Sentence bank

The site remembers the sentences a learner typed in lessons and stories and brings a few of them
back, with their text hidden, on the schedule Word Lists words already use. It lives inside
**Today's tasks** on Home as an extra row, **the day's exam** («امتحان اليوم»), and ends each week with a
ten-sentence exam and one honest line. (Renamed in the learner-facing text on 2026-10-23: the day's
exam is now «اختبر نفسك في دروس اليوم» / "Test yourself on today's lessons", a card of its own on the new
Home page — see `docs/home-today.md`; this document and the code keep saying "exam".) Phase 2 of the strategy report
(`reports/phase-2-3-brief.md`); nothing in it is open to learners until the owner says so.

## Switches

- **Permissions → "Sentence bank"** (`sentenceBank`, `src/lib/rollouts/catalog.ts`): starts **Admins
  only**. It is closed whenever `todaySession` is (`withRolloutDependencies`), so a test of Today stays
  a clean test of Today.
- **Features → Daily quests → "Today's exam"** (quest type `sentenceReview`): XP, target (how many
  questions) and on/off of the row. It is never dealt at random (`eligibleQuestTypes`).
- **The exam is an extra, not a fourth thing to finish** (`isOptionalQuest`, `requiredQuests` in
  `src/lib/today/quests.ts`): Home's ring, "all done", the reward line and the day badge count the three
  steps only; once they are done the exam becomes the row with the start button.

## Database (applied by pasting into the Supabase SQL editor; there is no CLI)

1. `20250347000000_sentence_mastery.sql` — `sentence_mastery` (one row per learner and sentence,
   created by the first review) and `record_sentence_review(p_sentence_id, p_outcome, p_today)`, the
   word schedule's rules statement for statement: 1 / 3 / 7 / 16 / 30 days, a miss back to 0 and due
   tomorrow. Parity with `word_mastery` is checked by `src/lib/sentence-bank/review.test.ts`.
2. `20250348000000_sentence_checks.sql` — `sentence_checks`, one row per weekly check
   (asked, remembered, written). Independent of the first.

Until the checks migration is applied the weekly check degrades quietly (one warning a minute at most per
server process, `isMissingTableError`). The day's test no longer reads `sentence_mastery` to decide whether it
exists, but a story sentence's answer needs it (the recording call fails, and with it the task's count).

## What comes back, and how it is asked

- **The day's test asks about Today's session and nothing else** (changed 2026-10-23, at the owner's
  word: a question had come from an earlier daily lesson, outside the passage and the story). Its
  questions are lines of the **passage** and of the **story** the learner finished today (`today-exam.ts`,
  read by `load.ts`): a story finished today counts even when it was first finished on an earlier day
  (Today's own "story done" counts it too), a passage counts when its `passage_progress` says it was
  completed today. Never a sentence from an earlier day, never a normal daily lesson. The earlier-days
  machinery (`selectSentenceReview`, `selectTodaySentences`, the schedule's "due" reads) is no longer
  called by the day's test; it is kept, with its tests, for the day earlier sentences come back. They
  now come back only through the weekly test.
- `poolForToday`: 4+ words, each line once (a passage that repeats a line word for word asks it once),
  and from each lesson the first six in the **day's own order** — a hash of the day and the line id, so
  it varies from day to day but never at random and never depends on what the learner does or on the
  order the lines were read in. `interleaveToday`: the passage and the story **in turn** (passage first,
  then the story, then the passage again), at most three from one lesson. Three questions a day by
  default (the row's target in Features), so with both lessons done it is passage, story, passage.
- **The same list every time**, because a test left half way carries on from the answers already counted:
  the questions drawn are the list from `quest.progress` up to `quest.target`. (The old way — leave out
  what already had a schedule row — cannot work for passage lines, which have none.)
- **Every question is heard and typed whole, from memory** (`buildTodayItems`, form `audio`;
  `TODAY_FORM_STRENGTH`). The fill-in-a-word form is no longer reachable from the day's test (its code stays
  in `mask.ts` and the runner). The meaning in the learner's language is shown after the answer; passages
  have an Arabic meaning only, so far. **Every question has its sound**: a story sentence's stored clip in
  the voice of its own lesson (`voice_audio_cache`, found by `lesson-clips.ts`; never generated, never
  the browser's voice), a passage line's narrated clip; a line with no clip is not asked.
- **A story's sentence reaches the schedule** (`record_sentence_review`: a clean answer enters at strength
  1, due tomorrow; a miss is due tomorrow) and counts for the day's task. **A passage line is not a row of
  the `sentences` table**, so it cannot be on the schedule (that would take a table of its own, applied by
  pasting SQL): it only counts for the task (`recordPassageLineReviewAction`), and the screen does not say
  "comes back tomorrow" for it. The finish screen says the score and lists every sentence with how it went
  and where it came from ("from today's passage" / "from today's story").
- **What the test says about an answer** (`feedback.ts`, `Verdict` in the runner; one short line, never a
  score): typed right — a round tick that settles in, "Perfect!", and the same soft chime a right answer
  in Passages plays (`usePassageChime`; it follows Admin → Typing sound, so switched off there it is
  silent); one to three letters away (wrong, missing or extra letters added across the sentence) — "so
  close" with the number of letters; further off — only "check the highlighted words"; "I don't
  remember" — "that's fine, here is the sentence".
- One help (the first letters) holds a sentence where it is; two helps, a wrong answer or "I don't
  remember" is a miss. The first answer alone goes to the schedule and a miss simply comes back tomorrow
  (a story's sentence): by default nothing is asked twice in a visit, so the test is exactly as long as it
  was said to be and nothing piles up on a learner having a hard day (`MAX_SECOND_CHANCES = 0` in
  `session.ts`).
- The screen is one card in the middle of the viewport (it has no app header), the way out ("Exit") in its
  header beside the name and the count.
- Routes: `/learn/today/sentences` (`?flow=1` from the finish screen, which offers it as an OPTION above
  its other buttons and then comes back to itself; the words step goes straight to the finish screen,
  nothing forces the test) and `/learn/today/check`.

## Reads (and why the service role)

Home: when the test row is not dealt yet, the learner's passage progress (one small read, shared with
Today's own through `cache`) and, only when something was finished today, the story's sentences (one
pool read) and the passage (share-cached). Nothing is read about earlier days, schedule rows or weak
words any more. Dealt once a day, for as many questions as today's lessons can give (up to the row's
target); later visits read nothing for it. A learner who goes from the story straight to the words never
rebuilds Home, so the finish screen (`/learn/today/end`) deals the row itself when it is missing
(`sentenceReviewPending` with `deal`). The weekly line adds one tiny read (the last check) and, only when
a check could be due, one more (their Today days). The test screen adds the story's meanings and a
batched clip lookup.

Row-level security on `sentences` hides premium lessons from a learner whose subscription ended. The
sentence bank never locks, so the pool read (`pool.ts`) uses the service role, scoped to that learner's
own finished lessons — ids that come from their server-side progress, never from the browser.

## Weekly check

After seven days of Today's session since the last check (and three lessons finished that week), the
box shows one quiet line: the check is ready. The check asks up to ten sentences of the week, each
from its meaning, no help, no second chance (a miss still comes back tomorrow), its clip playing after
the answer, and is **not** counted for the day's task. For the next seven days the line is the result: "Sentences this week: you wrote N,
and remembered M of K without looking (x%)". No level is ever derived from it; a check that asked
fewer than five shows no number (`weekly.ts`).

## Events (`analytics_events`)

`SENTENCE_REVIEW_STARTED {count, partial, audio, translate}`, `SENTENCE_REVIEW_FINISHED {count, clean,
assisted, missed, partial, audio, translate}`, `SENTENCE_CHECK_STARTED {asked}`,
`SENTENCE_CHECK_FINISHED {asked, remembered, written}`.

## Measuring a share of learners

Read-only, run by the owner: `npx tsx --env-file=.env.local scripts/sentence-bank-readout.ts` (optional
`--since <ISO time of the last change of the share>`). It reads the stored settings, works the arm out
with the same hash as the site, leaves admins out, and prints the row / visits / weekly test / schedule
figures with the stop rules, Today's three tasks per arm with the guard, and who came back per arm
(calendar days, so compare arm against arm, not against the report's 24-hour figures). While the bank
is Admins-only it shows the admins' own figures. Today's own before / after readout is
`scripts/today-readout.ts`. The pure parts are `src/lib/sentence-bank/readout.ts`,
`src/lib/today/readout.ts` and `src/lib/readout/returns.ts` (tests: `npm run test:readout`).

The plan behind it: the bank only exists inside Today, so read it **within the learners who have Today**: arm = whether
`rolloutBucket(userId, "sentenceBank") < percent` (FNV-1a of `sentenceBank:<userId>`, mod 100;
`src/lib/rollouts/config.ts`), control = the rest of Today's learners; exclude admins. The two tests
overlap by hashing, so do not open a share for the bank before Today's own test is read, or keep it
inside Today's.

- Main: any return within 7 days (baseline 18.5%) and the next-day return (9.1%; about 3,500 sign-ups
  per arm to see +1.5 points).
- Guard rails from the report: at least 40% of the learners shown the row finish it
  (`daily_quests` rows of type `sentenceReview` with `completed_at`, over rows dealt), and first-go
  accuracy of 50% or more (`SENTENCE_REVIEW_FINISHED`: (clean + assisted) / count). Below either, the
  difficulty or the probe is wrong, not the idea.
- Secondary: sentences at strength 2 or more per learner (`sentence_mastery`), weekly-check
  participation and the share remembered, `SENTENCE_REVIEW_STARTED` to `FINISHED` per visit.
- Known limits to keep in mind: with three a day and the 1 / 3 / 7 / 16 / 30 ladder a new sentence
  enters only every other day at first (about 0.6 a day later); learners with no meaning in their
  language for a sentence (Spanish and Turkish translations are partial) are asked it by sound or not
  at all.
