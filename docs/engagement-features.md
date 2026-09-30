# Engagement features

Seven optional learning features, all controlled from **Admin → Features**
(`/admin/features`, full admins only). Every feature ships **Off**; nothing
changes for learners until an admin turns something on.

| Feature                  | Where it appears                                                    | Sections (admin matrix)       | Guests         |
| ------------------------ | ------------------------------------------------------------------- | ----------------------------- | -------------- |
| Dictation                | "Dictation" toggle under the lesson title                           | Normal, Stories, Conversation | works          |
| From memory              | Button on the lesson-completion screen                              | Normal, Stories, Conversation | works          |
| Personal word cards      | Star on the current-word label, `/learn/cards`, Anki export         | save star: Normal, Stories    | sign-in prompt |
| Daily session            | Card at the top of Home, `/learn/session`                           | global                        | sign-in prompt |
| Daily quests             | Card on Home, quest lines on the completion screen                  | global                        | sign-in prompt |
| Badges                   | Completion-screen celebration, `/learn/achievements`, header trophy | global                        | sign-in prompt |
| Streak calendar & freeze | 7-day strip on Home (tap for the month)                             | global                        | sign-in prompt |

## Admin controls

Per feature: **Off / Admin preview / On** (admin preview = only admins see it on
the live site), a **Premium only** switch (automatically open to everyone while
_Free access_ is on), and — where it makes sense — a per-section on/off matrix.
Plus feature options: dictation word-length blanks, from-memory helpers, daily
session size / XP / which sources feed it (mistakes + weak words by default;
Vocabulary Recall, Word Lists and personal cards are opt-in), the quest pool
(each type on/off, target, XP), each badge on/off, and the monthly free streak
freezes (default 2).

The config is one JSON document in `feature_settings` (validated on read and
write by `src/lib/features/config.ts`); a missing or unreadable row means
"everything off".

## Database migrations to apply (in order)

These are new and **not applied automatically**:

1. `20250315000000_feature_settings.sql`
2. `20250316000000_activity_and_streak_freeze.sql` (backfills `activity_days`)
3. `20250317000000_daily_quests.sql`
4. `20250318000000_badges.sql`
5. `20250319000000_saved_words.sql`
6. `20250320000000_daily_sessions.sql`

Until a migration is applied, the feature that needs it degrades quietly (its
card doesn't render, its event is skipped) — lesson completion is never
blocked by an optional feature.

## How they fit together

- **Dictation / From memory** grade a whole typed sentence on Enter
  (`src/lib/features/dictation.ts`): case- and punctuation-insensitive, typos
  are "close", misses go to Fix Your Mistakes. They deliberately don't use the
  per-keystroke engine, which would let a learner guess letters of a hidden
  sentence.
- **Streak freeze** sits on top of the existing free one-missed-day grace: each
  _extra_ consecutive missed day spends one freeze from the month's balance,
  otherwise the streak resets as before (`src/lib/features/streak-freeze.ts`).
- **Quests** are dealt per learner per local day, deterministically, from the
  achievable part of the pool; progress + XP payout happen atomically in
  `add_quest_progress`.
- **Badges** are retroactive: stats come from existing history via
  `badge_metrics()`, so the first evaluation awards what past progress earned
  (a flood collapses into one summary line).
- **Daily session** reuses the fill-in-the-blank review screen
  (`WordReviewSession variant="session"`); each word is recorded on the ledger
  of the source it came from (`src/lib/features/session-completion.ts`), and
  the XP is paid once per day (`complete_daily_session`).
- **Personal cards** review on the same 1/3/7/16-day schedule as mistakes;
  **Export for Anki** downloads a tab-separated file with Anki import headers.

## Local development

With no Supabase project linked there is no settings row. Set
`FEATURES_DEV_ALL_ON=true` (non-production only) to switch every feature on as
a guest, which is enough to exercise Dictation and From memory offline. The
account-only features need a real signed-in session.
