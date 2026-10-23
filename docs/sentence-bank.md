# Sentence bank

The site remembers the sentences a learner typed in lessons and stories and brings a few of them
back, with their text hidden, on the schedule Word Lists words already use. It lives inside
**Today's tasks** on Home as an extra row, **the day's exam** («امتحان اليوم»), and ends each week with a
ten-sentence exam and one honest line. Phase 2 of the strategy report
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

Until a migration is applied the code degrades quietly: no fourth row, nothing recorded, one warning a
minute at most per server process (`isMissingTableError`).

## What comes back, and how it is asked

- The exam has two kinds of question (`exam.ts`, `composeExam`), today's first. About half come from
  the lessons finished **today** (`selectTodaySentences`: 4+ words, never asked yet, weak words first,
  then a spread, at most three from one lesson) so the day ends with proof it was learned; the rest
  from **earlier** days (`selectSentenceReview`: 4+ words, due ones oldest first, then new ones holding
  the learner's weak words, then a spread over the finished lessons, newest first, at most two from one
  lesson). Three questions a day by default: two about today and one from before; when one side has
  too few the other fills the exam, so a learner's first day is all about today and a day with nothing
  finished all about before. No counter of what waits. One constant (`ceil(limit / 2)` in `exam.ts`)
  moves the split.
- Today's answers go to the schedule like any other (a clean one enters at strength 1, due tomorrow;
  a miss is due tomorrow), which also stops the same sentence being asked twice if the visit is left
  half done. The finish screen says the score and its two halves ("from today's lesson: 2 of 2",
  "from earlier days: 1 of 1"), and lists every sentence with how it went.
- Form by strength (`review.ts`): 0-1 partial dictation (hear it, type the one or two missing words),
  2-3 audio only, 4-5 meaning only (Arabic to English). A sentence of today's lesson is asked as if it
  had strength 2 (`TODAY_FORM_STRENGTH`): heard and typed whole, or from its meaning with no clip. Sound forms play **only a stored clip**
  (`voice_audio_cache`, never generated); with no clip the sentence is asked from its meaning, with no
  meaning either it is left for another day.
- One help (the first letters) holds a sentence where it is; two helps, a wrong answer or "I don't
  remember" is a miss. The first answer alone goes to the schedule; a miss is asked once more at the
  end of the visit with other blanks, for practice only (`session.ts`, `mask.ts`).
- Routes: `/learn/today/sentences` (`?flow=1` from the words step through
  `/learn/today/go?step=sentences`, then on to the finish screen) and `/learn/today/check`.

## Reads (and why the service role)

Home: when the exam row is not dealt yet, two reads — the learner's own rows, then one pool read of
the sentences of the lessons they finished today, their 40 most recent finished lessons and the due
ones. Dealt once a day; later visits read nothing for it. A learner who goes from the story straight
to the words never rebuilds Home, so `/learn/today/go?step=sentences` deals the row itself when it is
missing (`sentenceReviewPending` with `deal`). The weekly line adds one tiny read (the last check) and, only when a check
could be due, one more (their Today days). The review screen adds weak words, meanings and a batched
clip lookup.

Row-level security on `sentences` hides premium lessons from a learner whose subscription ended. The
sentence bank never locks, so the pool read (`pool.ts`) uses the service role, scoped to that learner's
own finished lessons and own schedule rows — ids that come from their server-side progress, never from
the browser.

## Weekly check

After seven days of Today's session since the last check (and three lessons finished that week), the
box shows one quiet line: the check is ready. The check asks up to ten sentences of the week, each
from its meaning, no help, no second chance (a miss still comes back tomorrow), and is **not** counted
for the day's task. For the next seven days the line is the result: "Sentences this week: you wrote N,
and remembered M of K without looking (x%)". No level is ever derived from it; a check that asked
fewer than five shows no number (`weekly.ts`).

## Events (`analytics_events`)

`SENTENCE_REVIEW_STARTED {count, partial, audio, translate}`, `SENTENCE_REVIEW_FINISHED {count, clean,
assisted, missed, partial, audio, translate}`, `SENTENCE_CHECK_STARTED {asked}`,
`SENTENCE_CHECK_FINISHED {asked, remembered, written}`.

## Measuring a share of learners (plan; no readout script yet)

The bank only exists inside Today, so read it **within the learners who have Today**: arm = whether
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
