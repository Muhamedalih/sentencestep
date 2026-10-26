# Readout of the "Chosen level shapes the path" test

`scripts/level-test-readout.ts` reads the test of the `levelFloor` permission (Admin -> Permissions ->
"Chosen level shapes the path") once it is given to **a share of learners**. It is read-only (the
service role, GET requests only, no id or email printed, admin accounts left out). The maths is in
`src/lib/readout/level-test.ts` (pure, tested in `level-test.test.ts`).

```bash
npx tsx --env-file=.env.local scripts/level-test-readout.ts --read-date 2026-11-24
```

Options: `--read-date <YYYY-MM-DD>` (the day chosen **before** the test starts; without it no verdict is
given), `--since <ISO>` (when the test began; otherwise the last save of the setting in the audit log),
`--days 14` (days of sign-ups read while the permission is closed), `--pretend-percent 50` (see below).

## What it reads

- **The cohort**: accounts created after the test began that finished the Intermediate or Advanced
  opening lesson (`onboarding-intermediate` / `onboarding-advanced`). These are the learners the fix
  reaches: the read-back stores their level, a Beginner opener stores nothing. Finishing the opener
  comes before the permission can act, so choosing the cohort this way is not biased by the test.
- **The arms** are not stored anywhere: `armOf` runs the app's own hash (`rolloutBucket`, accounts 0 to
  N-1 of 100 are the test arm) on the account ids, and a test checks it against `isRolloutOpen`.
  Intention to treat: a test-arm learner counts as test even if no level was stored.
- **The setting**: while the mode is "emails" or "admin" (or 100%) there is no control group, so the
  script prints the **baseline** and the planning table instead of two arms.

## The one verdict, and the stop limit

- **Verdict** = the next-day return (calendar days, `activity_days`), the 95% (Newcombe) interval of
  test minus control. It is given only on or after `--read-date`, and only with at least 300 learners
  whose next day is over in each arm. Every other row (days 1-7, active 2+ of 14, a Level 2+ lesson or
  story in days 0-3, sentences in days 0-3, stored level) is description.
- **Stop limit** = the only reading allowed before the date: the test arm came back less and even a
  99.7% interval of the gap lies below zero. Closing the permission is then the owner's call.
- **Checks**: the split must be near the share (|z| < 3, a sample-ratio check on all new accounts and on
  the cohort), and `has a stored level` must be close to all of the test arm against a few percent of
  the control (7% of the baseline set it on the level card). A test arm far below that means the
  permission is not reaching learners as it should, and nothing else is worth reading yet.

## What the first runs showed (2026-10-26, UTC)

- **Baseline** (sign-ups of 12-26 October): 1,318 new accounts finished a harder opening lesson, about
  **93 a day**; 7.1% have a stored level; **21.2% come back the next day** (267 of 1,257), 30.9% in days
  1-7 (of those a week old), 22.3% finished a Level 2+ lesson or story in their first four days, 16.5
  sentences typed in days 0-3 on average.
- **Planning** at 50%: 14 days = 647 per arm (smallest next-day gap seen about 8 times in 10: 6.4
  points), 21 days = 971 (5.2), 28 days = 1,295 (4.5).
- **A pretend run** (`--pretend-percent 50`, nobody had the permission): the split came out 48.7% and
  48.5% (z -1.8 and -1.1), the stored level 7.2% against 6.9%, and the next-day return **19.4% against
  22.9% (a gap of -3.5 points from chance alone, interval -8.0 to +1.0)**. A gap of three or four points
  in the next-day return is inside what chance does at this size: only the mechanism rows (stored level,
  Level 2+ lessons) move enough to be read in days.

## Known limits

Passages and word lists have no level in this table, so "a Level 2+ lesson or story" counts the normal
and Stories modes only. A guest's lessons before sign-up are filed under their sign-up day (every
migrated opener checked on 2026-10-26 carries a time after the account was created, so the migration
seems to stamp them with its own time), the same in both arms. Calendar-day returns do not match the
24-hour figures of the strategy report: compare the two arms of one run only. One test at a time on the
same learners.
