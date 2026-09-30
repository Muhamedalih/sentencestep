# Engagement features

Seven optional learning features, all controlled from **Admin → Features**
(`/admin/features`, full admins only). The code default is **Off** for every
feature (no settings row, or an unreadable one, means nothing shows). The last
migration below moves the fresh settings row to **Admin preview** for all
seven, so on the live site only admins see anything until a feature is set to
**On**.

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
7. `20250321000000_feature_settings_admin_preview.sql` (puts every feature in
   Admin preview; only touches a settings row nobody has saved yet, so it never
   overwrites a configuration an admin chose)

Until a migration is applied, the feature that needs it degrades quietly (its
card doesn't render, its event is skipped) — lesson completion is never
blocked by an optional feature.

While a feature is in Admin preview, learners who aren't admins see and get
nothing from it. The one invisible side effect: once the streak calendar or
badges are not Off, each lesson completion also writes that day's
`activity_days` row for everyone (a single best-effort upsert), so the calendar
already has history the day the feature goes On.

## How they fit together

- **Dictation / From memory** grade a whole typed sentence on Enter
  (`src/lib/features/dictation.ts`): case- and punctuation-insensitive, typos
  are "close", misses go to Fix Your Mistakes. They deliberately don't use the
  per-keystroke engine, which would let a learner guess letters of a hidden
  sentence.
  The correction screen shows the correct sentence large with each missed word
  as a chip and its wrong letters underlined (typed and correct line), Enter or
  **Continue** moves on, and **Try again** lets the learner retype the same
  sentence as often as they like: only the first attempt is scored and
  recorded. While the sentence is hidden, every blank is a word-shaped pill:
  hovering only lights it up (and quietly prepares that word's clip), tapping it
  says the word (Normal and Stories, using the same word audio as the typing
  view; if the clip takes more than a second the browser's own voice says it so
  a tap is never silent). From memory shares the correction screen, Enter
  handling and Try again.
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
  Every word is spoken in the Word Lists voice (`tts_settings.default_pronunciation_voice_id`),
  whichever source it came from, and never in the browser's own voice: the
  server resolves each word's clip while building the session
  (`src/lib/voice/word-list-word-audio.ts` — cached Word Lists clip first,
  otherwise synthesized once with the same voice and cached for everyone).
- **Saving words** is offered only for words worth studying: pronouns,
  demonstratives, articles, numbers, names, be/have/do forms, modals,
  prepositions, conjunctions, common function adverbs and contractions get no
  star (`isWordWorthSaving`, also enforced when saving). In Normal lessons the
  words that can be saved carry a dotted underline.
- **Personal cards** review on the same 1/3/7/16-day schedule as mistakes;
  **Export for Anki** downloads a tab-separated file with Anki import headers.

## Local development

With no Supabase project linked there is no settings row. Set
`FEATURES_DEV_ALL_ON=true` (non-production only) to switch every feature on as
a guest, which is enough to exercise Dictation and From memory offline. The
account-only features need a real signed-in session.
