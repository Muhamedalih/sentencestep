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
  recorded.
  Dictation keeps the typing view's own frame (same text size, audio controls,
  Stories header, Conversation bubble) instead of a card of its own: the
  sentence is drawn in place with a blank under every letter, and there is no
  answer box. When the switch is turned on, a quick wave (about half a second)
  drops every letter onto its line while the blank draws itself out (only for
  the sentence on screen at that moment; a new sentence just draws its blanks
  in, never flashing its text). The learner types straight onto the blanks: a
  cursor bar glides along them and each typed letter appears in its slot, word
  by word, with nothing said about whether it is right until Enter. The system
  decides where words end (`applyDictationInput`): a word that has received all
  its letters hands over to the next one by itself, right or wrong, so the
  learner never types the space and can't type more letters than a word has
  (a space or hyphen typed early just moves on; punctuation is ignored; edits
  anywhere but the end of the answer are ignored; Backspace over the automatic
  hand-over also takes the word's last letter). With Show word-length blanks
  off nothing is enforced. Punctuation and apostrophes stay printed between the
  blanks. While the sentence is hidden, hovering a word only lights its blanks
  up, and tapping it says the word (Normal and Stories, from the same clips,
  loaded by the same rolling window, as the typing view — see
  `docs/word-audio-loading.md` — so a tap plays from memory; if a never-generated
  clip takes more than 2.5 seconds the browser's own voice says it so a tap is
  never silent). Turning **Show word-length blanks** off leaves the area empty and
  only echoes what has been typed. Checking an answer where every word is right
  plays the same sentence-complete sound as finishing a sentence by typing (and
  Continue then stays silent instead of playing it again). From memory shares
  the correction screen, Enter handling and Try again.
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
  Every word is meant to be spoken in the Word Lists voice
  (`tts_settings.default_pronunciation_voice_id`), whichever source it came
  from. The page only does a cache-only lookup of each word's clip
  (`lookupWordListVoiceAudio`); words without one are generated right after the
  response is sent, and a background job
  (`.github/workflows/session-word-audio.yml` → `/api/cron/session-word-audio`)
  keeps a clip ready for every word learners have in their mistakes, recall and
  saved-card queues. Speech is never synthesized while a learner waits (this
  backend is too slow for that); a word that still has no clip falls back to
  the browser voice rather than staying silent. Whether synthesis works on the
  deployed site is visible in that workflow's run output.
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
