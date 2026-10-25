# Before / after readout of Today's session (the daily tasks)

`scripts/today-impact-readout.ts` answers the owner's three questions about the daily tasks once they
were open to everyone: do learners **stay longer**, **come back more**, **try to subscribe more**. It is
read-only (the service role, GET requests only) and writes an Arabic Markdown report. The maths is in
`src/lib/readout/impact.ts` (pure, tested in `impact.test.ts`), the wording in
`src/lib/readout/impact-report.ts`.

```bash
npx tsx --env-file=.env.local scripts/today-impact-readout.ts --out reports/today-impact.md
```

Options: `--since <ISO>` (the go-live time; otherwise the start of the last unbroken stretch of
"everyone, 100%" for `todaySession` in the audit log of /admin/permissions), `--before 12` (windows
before to compare with, at most back to 2026-10-10: the lock came back that day, earlier days were
free-for-all), `--cache <folder>` (keep what was read and reuse it, to spare the database; delete the
folder to read fresh), `--clarity <file.json>` (Clarity days, see below), `--stable` (the check in the
last section). `reports/` is untracked: never commit a report.

## How it compares

- **Windows, not calendar days.** Time is cut into 24-hour windows that start at the go-live moment:
  window 0 is the first 24 hours after it, window -1 the 24 hours before it. The change sits exactly on a
  boundary (no half-and-half launch day) and every window holds the same hours of the day.
- **Before** = the windows -12..-1, **after** = the complete windows from 0. The running window is shown,
  never counted. Each row shows the pooled value, the range of the windows before (the usual swing),
  the last 4 windows before, **the same weekdays one week earlier**, and each window after.
- **A learner** is a profile with `role = 'user'`; admins are left out. **Active** = any learning event
  in the window (a lesson, story, passage, words, review). **Returning** = signed up before the window,
  **new** = signed up inside it.
- **Verdict** (describes, never proves; this is a before / after reading with no control group):
  `up`/`down` (clear) needs every window after outside the range of the windows before, |z| ≥ 1.96 for
  shares and means, and agreement with the last 4 windows and the same weekdays a week earlier (same
  direction, at least a quarter of the size). One of the conditions only = a lean (`maybeUp`/`maybeDown`,
  ⚠ when the closer baselines disagree). Inside the range = flat. Fewer than two windows after = early.
- **New sign-ups** (next-day and week return) are judged per learner over exact hours after signing up
  (hours 24-48, and 24-192). A window of sign-ups counts as "before" only if all of its judged hours fall
  before the change, "after" only if it signed up after it; the ones in between are shown and left out.

## What the numbers are made of

- **Time is an estimate.** The database stores no durations. Events of one learner less than 4 minutes
  apart are one block, a lone event is one minute, a lesson or story opened and finished (events paired
  by lesson id, within 40 minutes) counts its real length, a passage counts first-open to finish when
  that is under 30 minutes. Read it as an index (before against after), not as exact minutes. The
  Microsoft Clarity numbers are the only direct time on site, and cover every visitor.
- **The road to paying**: `PAYWALL_VIEWED` (met a lock, by kind) -> `UPGRADE_VIEWED` (opened the page) ->
  `UPGRADE_CTA_CLICKED` (pressed pay: this creates an order) -> `payment_orders` (created / fulfilled,
  live only). Unregistered visitors' lock and upgrade views are shown apart as a comparison group
  (the tasks do not reach them).
- **Tasks**: `daily_quests` rows by the window they were dealt in. Before: the three random quests
  (slots 0-2). After: Today's listen / story / words (slots 10-12). The optional test row (13) is not a
  task. Rows of slots 10-12 dealt before go-live were tests, left out.
- **Return**: of the learners active in the window before, how many are active in this one; veterans
  (signed up 8+ days ago) who studied in the 7 windows before and are back; "came back" (studied, opened
  Home, or met a lock).

## Clarity file

`--clarity file.json` is an array of days read by hand from the Clarity dashboard (Baghdad days):
`{ date, sessions, users, pages, active (minutes per session), returningSessions, events: { daily_lessons_300s, passages_300s, stories_300s, word_lists_300s } }`.
Leave out an event on days when its smart event did not exist yet (daily lessons and stories from
2026-10-13, passages and word lists from 2026-10-18).

## `--stable`

Word reviews, finished tasks, the day's finish screen and the sentence test only exist since Today, so
counting them can make time and activity look bigger after it. `--stable` leaves those events out; if a
rise shrinks a lot, part of it was new things being recorded. (2026-10-25: mean minutes of a returning
learner +16% with everything counted, +9% with `--stable`.)

## Known limits

Other things changed in the same weeks (listed at the top of every report); the first weeks have only a
few complete windows after the change; the two weekly-return rows need 8+ days; payments are ~3 a day,
so only the steps before paying (locks, upgrade page, pay button) can be read for weeks.
